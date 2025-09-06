const { defineSecret } = require("firebase-functions/params");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldPath } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const dayjs = require("dayjs");

const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

initializeApp();
const db = getFirestore();

/** ---------------- helpers ---------------- */
const MAX_EX_LIBRARY = 80;   // cap exercises sent to the model
const MAX_EX_PER_DAY = 4;    // cap exercises written per day (defensive)

const norm = (s) => String(s ?? "").trim();

function toAllowedLite(exercises, cap = MAX_EX_LIBRARY) {
  const out = [];
  for (const ex of exercises) {
    const name = norm(ex.name || ex.exercise);
    if (!name) continue;

    let mg = ex.muscleGroups || ex.target || [];
    if (typeof mg === "string") mg = [mg];
    if (!Array.isArray(mg)) mg = [];

    out.push({
      id: String(ex.id || name),
      name,
      muscleGroups: mg.map(norm),
      equipment: norm(ex.equipment || "None"),
    });
    if (out.length >= cap) break;
  }
  return out;
}

function buildPrompt({ userData, startDate, endDate, allowedLite }) {
  return `
Create a detailed 30-day workout plan.

User:
- gender: ${userData.gender}
- age: ${userData.age}
- height: ${userData.height}
- weight: ${userData.weight}
- level: ${userData.level}
- goal: ${userData.goal}
- frequency_per_week: ${userData.workoutDay}
- equipment: ${userData.equipment}

Exercises (use ONLY from this list by exact "name"):
${JSON.stringify(allowedLite)}  // compact, no pretty-print

Rules:
1) Exactly ${userData.workoutDay} sessions/week (~${userData.workoutDay * 4}-${userData.workoutDay * 5} total). Other days are "Rest Day" with empty exercises.
2) Distribute sessions evenly; avoid back-to-back unless training 6–7 days/week.
3) Each workout day has 3–${MAX_EX_PER_DAY} exercises targeting related muscle groups.
4) Respect equipment limits: None=bodyweight only; Dumbbell=bodyweight or dumbbell; else=full gym allowed.
5) Format rules:
  - For strength/rep exercises → reps is a plain number, e.g. "12"
  - For static/time exercises like Plank, Side Plank, Wall Sit → reps must be in mm:ss format, e.g. "00:30"
  - Single limb exercises: the total number (e.g., '30' for 15 per leg)
  - Rest must always be mm:ss, e.g. "01:00"

Dates: "${startDate}" .. "${endDate}"

Return JSON ONLY (no markdown, no extra text):
{
  "userId": "${userData.uid || "unknown"}",
  "monthlyWorkoutPlan": [
    {
      "day": "YYYY-MM-DD",
      "title": "Upper Body Strength",
      "exercises": [
        { "id": "ex1", "target": "Chest", "exercise": "Push Up", "sets": "3", "reps": "12", "rest": "01:00" }
      ],
      "completed": false
    },
    {
      "day": "YYYY-MM-DD",
      "title": "Rest Day",
      "exercises": [],
      "completed": false
    }
  ]
}
`.trim();
}

exports.generateWorkoutPlan = onCall(
  {
    region: "us-central1",        
    enforceAppCheck: false,
    timeoutSeconds: 540,          
    memory: "1GiB",
    secrets: [OPENAI_API_KEY],
  },
  async (request) => {
    const firebaseUid = request.auth?.uid;
    const userId = request.data?.userId || firebaseUid;
    if (!userId) throw new HttpsError("permission-denied", "You must be logged in");

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

    try {
      //Load user
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      if (!userData) throw new HttpsError("not-found", "User data not found");
      userData.uid = userId;

      //Load exercises, filter by equipment, trim to lite list
      const exercisesSnapshot = await db.collection("exercises").get();
      const exercises = exercisesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const eq = norm(userData.equipment);
      const filtered = eq === "None" ? exercises.filter((ex) => norm(ex.equipment) === "None") : exercises;
      const allowedLite = toAllowedLite(filtered, MAX_EX_LIBRARY);

      //Dates
      const today = dayjs();
      const startDate = today.format("YYYY-MM-DD");
      const endDate = today.add(29, "day").format("YYYY-MM-DD");

      //Build prompt and call OpenAI
      const prompt = buildPrompt({ userData, startDate, endDate, allowedLite });

      const ai = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 3500,                     
        messages: [{ role: "user", content: prompt }],
      });

      let content = ai.choices?.[0]?.message?.content || "";
      content = content.replace(/```json|```/g, "").trim();

      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        logger.error("JSON parse error. Raw content (truncated):", content.slice(0, 1200));
        throw new HttpsError("invalid-argument", "Model returned invalid JSON. Please try again.");
      }

      const monthlyPlan = parsedContent.monthlyWorkoutPlan;
      if (!Array.isArray(monthlyPlan)) {
        throw new HttpsError("invalid-argument", "monthlyWorkoutPlan missing or invalid");
      }

      //Delete ONLY present to future routines
      const userRef = db.collection("users").doc(userId);
      const routinesRef = userRef.collection("routines");

      const futureSnap = await routinesRef
        .where(FieldPath.documentId(), ">=", startDate)
        .orderBy(FieldPath.documentId())
        .get();

      if (!futureSnap.empty) {
        let batchDel = db.batch();
        let opsDel = 0;
        for (const d of futureSnap.docs) {
          batchDel.delete(d.ref);
          opsDel++;
          if (opsDel === 450) {
            await batchDel.commit();
            batchDel = db.batch();
            opsDel = 0;
          }
        }
        if (opsDel) await batchDel.commit();
      }

      //Write new plan
      let batch = db.batch();
      let ops = 0;

      for (const day of monthlyPlan) {
        const dayId = day.day;
        if (!dayId || dayId < startDate) continue;

        const list = Array.isArray(day.exercises) ? day.exercises.slice(0, MAX_EX_PER_DAY) : [];

        const docData = {
          title: day.title || "",
          completed: Boolean(day.completed),
          exercises: list.map((ex, i) => ({
            id: String(ex.id ?? `ex${i + 1}`),
            exercise: norm(ex.exercise),
            target: norm(ex.target),
            sets: String(ex.sets ?? "3"),
            reps: norm(ex.reps ?? "12"),
            rest: norm(ex.rest ?? "01:00"),
          })),
        };

        batch.set(routinesRef.doc(dayId), docData, { merge: false });
        ops++;
        if (ops === 450) {
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }

      //Metadata
      batch.set(userRef, { updatedAt: new Date().toISOString(), isFirstPlan: false }, { merge: true });
      if (ops || true) await batch.commit();

      return {
        success: true,
        message: "Workout plan generated successfully",
        deletedFutureCount: futureSnap.size,
        startDate,
        endDate,
      };
    } catch (err) {
      logger.error("❌ Error generating workout plan", err);

      const msg = String(err?.message || "");
      if (/(deadline|deadline_exceeded|504|time[ ]?out)/i.test(msg)) {
        throw new HttpsError(
          "deadline-exceeded",
          "The server took too long. It may have finished writing your plan—please refresh to check, or try again."
        );
      }
      if (err instanceof HttpsError) throw err;

      throw new HttpsError(
        "internal",
        "Failed to generate workout plan. Please try again.",
        { originalMessage: msg.slice(0, 500) }
      );
    }
  }
);
