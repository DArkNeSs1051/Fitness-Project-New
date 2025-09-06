import { useLocalSearchParams } from "expo-router";
import WorkoutDetailScreen from "../../screens/WorkoutScreen/WorkoutDetailScreen";
import { IRoutines } from "~/screens/WorkoutScreen/WorkoutIndexScreen";

export default function WorkoutDetailPage() {
  const { id, data } = useLocalSearchParams();
  const workoutId = Array.isArray(id) ? id[0] : id || "";
  const workoutData: IRoutines = data ? JSON.parse(data as string) : null;

  return (
    <WorkoutDetailScreen workoutId={workoutId} workoutData={workoutData} />
  );
}
