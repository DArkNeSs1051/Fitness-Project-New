import { useLocalSearchParams } from "expo-router";
import React from "react";
import { TExercise } from "~/screens/WorkoutScreen/WorkoutIndexScreen";
import WorkoutSessionScreen from "~/screens/WorkoutScreen/WorkoutSessionScreen";

const workoutSession = () => {
  const { id, data } = useLocalSearchParams();
  const workoutId =
    (Array.isArray(id) ? id[0] : id || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] ||
    "";
  let workoutExercise: TExercise[] = [];

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        workoutExercise = parsed;
      } else {
        console.warn("⚠️ JSON ไม่ใช่ array");
      }
    } catch (e) {
      console.error("❌ JSON parse error:", e);
    }
  } else if (Array.isArray(data)) {
    console.warn("⚠️ data เป็น array ของ string:", data);
  } else {
    console.warn("⚠️ ไม่พบ data หรือ data เป็น undefined");
  }

  return (
    <WorkoutSessionScreen id={workoutId} workoutExercise={workoutExercise} />
  );
};

export default workoutSession;
