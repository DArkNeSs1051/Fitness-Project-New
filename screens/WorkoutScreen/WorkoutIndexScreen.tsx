// WorkoutIndexScreen.tsx
import React, { useEffect, useState } from "react";
import { Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE_DB } from "~/firebase";
import { shadows } from "~/utils/shadow";
import { Card } from "../../components/ui/card";
import { ProgressSection } from "~/components/ProgressSection";
import { fetchThumbUrlForTitle } from "~/utils/storageThumbs";

export type TExercise = {
  id: string;
  exercise: string;
  target: string;
  sets: string;
  rest: string;
  reps?: string;
  duration?: string;
};

export interface IRoutines {
  id: string;
  title: string;
  exercises: TExercise[];
  completed: boolean;
}

const WorkoutIndexScreen: React.FC = () => {
  const { user } = useUser();
  const router = useRouter();

  const [data, setData] = useState<IRoutines[]>([]);
  const [thumbUrl, setThumbUrl] = useState<string>("");

  useEffect(() => {
    const fetchRoutines = async () => {
      if (!user?.id) return;
      const userRef = collection(FIRESTORE_DB, "users", user.id, "routines");
      const snap = await getDocs(userRef);
      setData(
        snap.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          exercises: doc.data().exercises ?? [],
          completed: !!doc.data().completed,
          ...doc.data(),
        }))
      );
    };
    fetchRoutines();
  }, [user?.id]);

  const todayId = dayjs().format("YYYY-MM-DD");
  const todayWorkout = data.find((item) => item.id === todayId);

  // Fetch stable image for today's title
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!todayWorkout?.title) {
        setThumbUrl("");
        return;
      }
      try {
        const url = await fetchThumbUrlForTitle(todayWorkout.title);
        if (alive) setThumbUrl(url);
      } catch (e) {
        console.error("Error fetching thumb:", e);
        if (alive) setThumbUrl(""); // fallback (no image)
      }
    })();
    return () => {
      alive = false;
    };
  }, [todayWorkout?.title]);

  const handleWorkoutPress = (id: string, item: IRoutines) => {
    router.push({
      pathname: `/workout/${id}`,
      params: { data: JSON.stringify(item) },
    });
  };

  const day = todayWorkout && dayjs(todayWorkout.id).format("dddd");
  const date = todayWorkout && dayjs(todayWorkout.id).format("DD/MM/YYYY");

  return (
    <SafeAreaView className="flex-1 bg-[#84BDEA]">
      <StatusBar style="dark" />
      <View className="flex-1 p-4 mt-5">
        <Text className="text-[#142939] text-3xl font-bold mb-4">Workout</Text>

        <View className="bg-[#42779F] rounded-[12px] p-4" style={shadows.large}>
          {todayWorkout && (
            <TouchableOpacity onPress={() => handleWorkoutPress(todayWorkout.id, todayWorkout)}>
              <Card className="rounded-xl overflow-hidden border-0">
                <View className="relative h-40">
                  {thumbUrl ? (
                    <Image
                      source={{ uri: thumbUrl }}
                      className="w-full h-40"
                      style={{ width: "100%", height: 150 }}
                    />
                  ) : (
                    <View className="w-full h-40 bg-black/20" />
                  )}
                  <View className="absolute inset-0 bg-black/30" />
                  <View className="absolute left-4 top-4">
                    <Text className="text-white text-xl font-bold">{todayWorkout.title}</Text>
                  </View>
                  <View className="absolute left-4 bottom-1">
                    <Text className="text-white text-base">
                      {day} {date}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center px-4 py-2 bg-gray-800 rounded-b-xl">
                  <Ionicons name="body" size={16} color="white" />
                  <Text className="text-white ml-2 text-sm">Tap to view for details</Text>
                  <Ionicons className="absolute right-2" name="chevron-forward" size={24} color="white" />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ProgressSection />
    </SafeAreaView>
  );
};

export default WorkoutIndexScreen;
