const { defineSecret } = require("firebase-functions/params");
const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const dayjs = require("dayjs");
const { clerkClient } = require("@clerk/clerk-sdk-node");

// Define secrets
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const CLERK_SECRET_KEY = defineSecret("CLERK_SECRET_KEY");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

exports.generateFirebaseCustomToken = onCall({
  enforceAppCheck: false,
  secrets: [CLERK_SECRET_KEY],
}, async (request) => {
  logger.info("generateFirebaseCustomToken called");

  const clerkUserId = request.data?.clerkUserId;
  if (!clerkUserId) {
    throw new Error("Missing clerkUserId parameter");
  }

  const clerk = clerkClient({ secretKey: CLERK_SECRET_KEY.value() });

  try {
    const firebaseCustomToken = await clerk.users.getFirebaseToken(clerkUserId);
    logger.info("Generated Firebase custom token for Clerk user:", clerkUserId);
    return { token: firebaseCustomToken };
  } catch (error) {
    logger.error("Failed to generate Firebase custom token:", error);
    throw new Error("Failed to generate Firebase custom token");
  }
});

exports.generateWorkoutPlan = onCall({
  enforceAppCheck: false,
  timeoutSeconds: 1000,
  secrets: [OPENAI_API_KEY],
}, async (request) => {
  const firebaseUid = request.auth?.uid;
  const userId = request.data?.userId || firebaseUid;

  if (!userId) {
    throw new Error("You must be logged in");
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    if (!userData) {
      throw new Error("User data not found");
    }

    const exercisesSnapshot = await db.collection("exercises").get();
    const exercises = exercisesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const allowedExercises =
      userData.equipment === "None"
        ? exercises.filter((ex) => ex.equipment === "None")
        : exercises;

    const today = dayjs();
    const startDate = today.format("YYYY-MM-DD");
    const endDate = today.add(29, "day").format("YYYY-MM-DD");

    const prompt = `
You are a professional personal trainer creating a detailed 30-day monthly workout plan for a client.

🧍‍♂️ User Profile:
- Gender: ${userData.gender}
- Age: ${userData.age}
- Height: ${userData.height}
- Weight: ${userData.weight}
- Fitness Level: ${userData.level}
- Goal: ${userData.goal}
- Training Frequency: ${userData.workoutDay} day(s) per week
- Equipment Available: ${userData.equipment}

🏋️‍♀️ Exercises Library:
${JSON.stringify(allowedExercises, null, 2)}

🔧 Equipment Restrictions:
- The client has access to: **${userData.equipment}**
${
      userData.equipment === "None"
        ? "- Use only bodyweight exercises. Do not include any exercise that requires equipment."
        : userData.equipment === "Dumbbell"
        ? "- Use only exercises that can be done with bodyweight or a dumbbell (no machines or full gym)."
        : "- The client has access to full gym equipment. You may include bodyweight, dumbbell, barbell, cable, and machine-based exercises."
    }

🎯 Objective:
Generate a structured 30-day workout plan (from "${startDate}" to "${endDate}") in valid JSON format.

🛑 STRICT RULES:
1. The user must **train exactly ${userData.workoutDay} day(s) per week**, totaling ${
      userData.workoutDay * 4
    }-${userData.workoutDay * 5} workout days.
2. Remaining days must be titled "Rest Day" and contain an empty "exercises" array.
3. Spread workout days evenly. Avoid 2 workout days back-to-back unless training 6-7 days/week.
4. Each workout day should include 3 to 5 exercises that focus on the same or related muscle group(s), using the "muscleGroups" field from the Exercises Library as the target.
5. Rotate workout types each week.
6. Use only allowed equipment as per user profile.
7. Avoid repeating same workout routines too often.

📦 Output Format (JSON only):
{
  "userId": "${userId}",
  "monthlyWorkoutPlan": [
    {
      "day": "2025-07-01",
      "title": "Full Body Strength",
      "exercises": [
        { "id: a short unique string (can be UUID, or "ex1", "ex2", etc.),target: "Chest" exercise": "Push Up", "sets": "3", "reps": "12", "rest": "60" }
      ],
      "completed": false
    },
    {
      "day": "2025-07-02",
      "title": "Rest Day",
      "exercises": [],
      "completed": false
    }
  ]
}

📌 VERY IMPORTANT: Return ONLY raw JSON — absolutely NO markdown formatting (no triple backticks or code blocks).
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    const monthlyPlan = parsedContent.monthlyWorkoutPlan;

    const userRef = db.collection("users").doc(userId);
    const routinesRef = userRef.collection("routines");

    const batch = db.batch();

    // (Optional) Clear previous routine documents
    const existingDocs = await routinesRef.listDocuments();
    existingDocs.forEach(doc => batch.delete(doc));

    // Add new routine documents
    monthlyPlan.forEach(day => {
    const dayRef = routinesRef.doc(day.day);
    batch.set(dayRef, {
      title: day.title || "",
      completed: day.completed || false,
      exercises: day.exercises || [],
    });
  });
    // Update user metadata
    batch.set(userRef, {
      updatedAt: new Date().toISOString(),
      isFirstPlan: false,
    }, { merge: true });

    // Commit everything at once
    await batch.commit();

    return { success: true, message: "Workout plan generated successfully" };

  } catch (err) {
    logger.error("❌ Error generating workout plan", err);
    throw new Error("Failed to generate workout plan: " + err.message);
  }
});

// For the other functions, you can either:
// 1. Use the same approach (no Firebase Auth required)
// 2. Or pass the userId in the data like generateWorkoutPlan does

/** EDIT Exercise in Routine - No Firebase Auth required */
exports.editExerciseInRoutine = onCall({
  enforceAppCheck: false,
}, async (request) => {
  logger.info("editExerciseInRoutine called");
  
  const {userId, routineId, exerciseId, sets, reps, rest} = request.data;
  
  if (!userId) {
    logger.error("No userId provided in request data");
    throw new Error("Missing userId parameter");
  }

  try {
    if (!routineId || !exerciseId) {
      throw new Error("Missing required parameters");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      logger.error("User not found:", userId);
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const routine = userData.routine || [];
    
    const routineIndex = routine.findIndex(r => r.day === routineId);
    if (routineIndex === -1) {
      logger.error("Routine not found:", routineId);
      throw new Error("Routine not found");
    }

    const exercises = routine[routineIndex].exercises || [];
    const updatedExercises = exercises.map((ex) =>
      ex.exercise === exerciseId ? {...ex, sets, reps, rest} : ex,
    );

    routine[routineIndex].exercises = updatedExercises;

    await db.collection("users").doc(userId).update({
      routine: routine,
      updatedAt: new Date().toISOString()
    });

    logger.info("Exercise updated successfully");
    return {success: true};
  } catch (err) {
    logger.error("❌ Error editing exercise in routine", err);
    throw new Error("Failed to edit exercise: " + err.message);
  }
});

/** DELETE Exercise from Routine - No Firebase Auth required */
exports.deleteExerciseFromRoutine = onCall({
  enforceAppCheck: false,
}, async (request) => {
  logger.info("deleteExerciseFromRoutine called");
  
  const {userId, routineId, exerciseId} = request.data;
  
  if (!userId) {
    logger.error("No userId provided in request data");
    throw new Error("Missing userId parameter");
  }

  try {
    if (!routineId || !exerciseId) {
      throw new Error("Missing required parameters");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      logger.error("User not found:", userId);
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const routine = userData.routine || [];
    
    const routineIndex = routine.findIndex(r => r.day === routineId);
    if (routineIndex === -1) {
      logger.error("Routine not found:", routineId);
      throw new Error("Routine not found");
    }

    const exercises = routine[routineIndex].exercises || [];
    const updatedExercises = exercises.filter((ex) => ex.exercise !== exerciseId);

    routine[routineIndex].exercises = updatedExercises;

    await db.collection("users").doc(userId).update({
      routine: routine,
      updatedAt: new Date().toISOString()
    });

    logger.info("Exercise deleted successfully");
    return {success: true};
  } catch (err) {
    logger.error("❌ Error deleting exercise from routine", err);
    throw new Error("Failed to delete exercise: " + err.message);
  }
});

/** ADD Exercise to Routine - No Firebase Auth required */
exports.addExerciseToRoutine = onCall({
  enforceAppCheck: false,
}, async (request) => {
  logger.info("addExerciseToRoutine called");
  
  const {userId, routineId, newExercise} = request.data;
  
  if (!userId) {
    logger.error("No userId provided in request data");
    throw new Error("Missing userId parameter");
  }

  try {
    if (!routineId || !newExercise) {
      throw new Error("Missing required parameters");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      logger.error("User not found:", userId);
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const routine = userData.routine || [];
    
    const routineIndex = routine.findIndex(r => r.day === routineId);
    if (routineIndex === -1) {
      logger.error("Routine not found:", routineId);
      throw new Error("Routine not found");
    }

    const exercises = routine[routineIndex].exercises || [];
    exercises.push(newExercise);

    routine[routineIndex].exercises = exercises;

    await db.collection("users").doc(userId).update({
      routine: routine,
      updatedAt: new Date().toISOString()
    });

    logger.info("Exercise added successfully");
    return {success: true};
  } catch (err) {
    logger.error("❌ Error adding exercise to routine", err);
    throw new Error("Failed to add exercise: " + err.message);
  }
});

/** REORDER Exercises in Routine - No Firebase Auth required */
exports.reorderExercisesInRoutine = onCall({
  enforceAppCheck: false,
}, async (request) => {
  logger.info("reorderExercisesInRoutine called");
  
  const {userId, routineId, reorderedExercises} = request.data;
  
  if (!userId) {
    logger.error("No userId provided in request data");
    throw new Error("Missing userId parameter");
  }

  try {
    if (!routineId || !reorderedExercises) {
      throw new Error("Missing required parameters");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      logger.error("User not found:", userId);
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const routine = userData.routine || [];
    
    const routineIndex = routine.findIndex(r => r.day === routineId);
    if (routineIndex === -1) {
      logger.error("Routine not found:", routineId);
      throw new Error("Routine not found");
    }

    routine[routineIndex].exercises = reorderedExercises;

    await db.collection("users").doc(userId).update({
      routine: routine,
      updatedAt: new Date().toISOString()
    });

    logger.info("Exercises reordered successfully");
    return {success: true};
  } catch (err) {
    logger.error("❌ Error reordering exercises in routine", err);
    throw new Error("Failed to reorder exercises: " + err.message);
  }
});