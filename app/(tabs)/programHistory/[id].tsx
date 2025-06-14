import { useLocalSearchParams } from "expo-router";
import WorkoutDetailScreen from "../../../screens/WorkoutScreen/WorkoutDetailScreen";

export default function WorkoutDetailPage() {
  const { id } = useLocalSearchParams();
  const workoutId = Array.isArray(id) ? id[0] : id || ""; // ✅ Ensure it's a string

  return <WorkoutDetailScreen workoutId={workoutId} />;
}
