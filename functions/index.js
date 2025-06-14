const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * EDIT Exercise in Routine
 */
exports.editExerciseInRoutine = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new Error("unauthenticated");

  const { routineId, exerciseId, sets, reps, rest } = request.data;

  const routineRef = db.collection("users").doc(uid).collection("routines").doc(routineId);
  const doc = await routineRef.get();
  if (!doc.exists) throw new Error("Routine not found");

  const exercises = doc.data().exercises || [];
  const updatedExercises = exercises.map((ex) =>
    ex.id === exerciseId ? { ...ex, sets, reps, rest } : ex
  );

  await routineRef.update({ exercises: updatedExercises, updatedAt: FieldValue.serverTimestamp() });
  return { success: true };
});

/**
 * DELETE Exercise from Routine
 */
exports.deleteExerciseFromRoutine = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new Error("unauthenticated");

  const { routineId, exerciseId } = request.data;

  const routineRef = db.collection("users").doc(uid).collection("routines").doc(routineId);
  const doc = await routineRef.get();
  if (!doc.exists) throw new Error("Routine not found");

  const exercises = doc.data().exercises || [];
  const updatedExercises = exercises.filter((ex) => ex.id !== exerciseId);

  await routineRef.update({ exercises: updatedExercises, updatedAt: FieldValue.serverTimestamp() });
  return { success: true };
});

/**
 * ADD Exercise to Routine
 */
exports.addExerciseToRoutine = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new Error("unauthenticated");

  const { routineId, newExercise } = request.data;

  const routineRef = db.collection("users").doc(uid).collection("routines").doc(routineId);
  const doc = await routineRef.get();
  if (!doc.exists) throw new Error("Routine not found");

  const exercises = doc.data().exercises || [];
  exercises.push(newExercise);

  await routineRef.update({ exercises, updatedAt: FieldValue.serverTimestamp() });
  return { success: true };
});

/**
 * REORDER Exercises in Routine
 */
exports.reorderExercisesInRoutine = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new Error("unauthenticated");

  const { routineId, reorderedExercises } = request.data;

  const routineRef = db.collection("users").doc(uid).collection("routines").doc(routineId);
  await routineRef.update({
    exercises: reorderedExercises,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});
