import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect } from "react";
import { FIRESTORE_DB } from "../../firebaseconfig";
import WorkoutScreen from "../../screens/WorkoutScreen/WorkoutIndexScreen";

export default function Workout() {
  const { user } = useUser();

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!user?.id) return;

      const userRef = doc(FIRESTORE_DB, "users", user.id);

      const userDocSnap = await getDoc(userRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData.isFirstLogin) {
          router.replace("/auth/question");
        }
      }
    };

    checkFirstLogin();
  }, [user]);

  return <WorkoutScreen />;
}
