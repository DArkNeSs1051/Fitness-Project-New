import { useLocalSearchParams } from "expo-router";
import WorkoutDetailScreen from "../../../screens/WorkoutScreen/WorkoutDetailScreen";
import type { IRoutines } from "../../../screens/WorkoutScreen/WorkoutDetailScreen"; 

export default function WorkoutDetailPage() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    data?: string | string[];
  }>();

  const workoutId = Array.isArray(params.id) ? params.id[0] : params.id || "";

  const rawData = Array.isArray(params.data) ? params.data[0] : params.data;
  let workoutData: IRoutines | undefined;
  if (rawData) {
    try {
      workoutData = JSON.parse(rawData) as IRoutines;
    } catch {
    }
  }

  return <WorkoutDetailScreen workoutId={workoutId} workoutData={workoutData} />;
}
