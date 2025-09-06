import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs } from "firebase/firestore";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProgressSection } from "~/components/ProgressSection";
import { FIREBASE_STORE, FIRESTORE_DB } from "~/firebase";
import { shadows } from "~/utils/shadow";
import { Card } from "../../components/ui/card";
import { useRoutineStore } from "~/store/useRoutineStore";

// Define workout type
interface WorkoutDay {
  id: string;
  title: string;
  day: string;
  targetMuscles: string;
  image: any;
}

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


import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("Asia/Bangkok"); // 👈 now every dayjs() will use Bangkok



const WorkoutIndexScreen: React.FC = () => {
  const { user } = useUser();

  const [data, setData] = useState<IRoutines[]>([]);

  useEffect(() => {
    const checkData = async () => {
      if (!user?.id) return;

      const userRef = collection(FIRESTORE_DB, "users", user.id, "routines");

      const userDocSnap = await getDocs(userRef);

      setData(
        userDocSnap.docs.map((doc) => ({
          completed: doc.data().completed,
          id: doc.id,
          title: doc.data().title,
          exercises: doc.data().exercises,
          ...doc.data(),
        }))
      );
    };

    checkData();
  }, [user]);

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const getImageUrl = async (link: string) => {
    try {
      if (link) {
        const imageRef = ref(
          FIREBASE_STORE,
          `gs://fithealthproject-ba957.firebasestorage.app/${link}`
        );
        const result = await listAll(imageRef);

        const urls = await Promise.all(
          result.items.map((itemRef) => getDownloadURL(itemRef))
        );

        return urls;
      }
      return [];
    } catch (error) {
      console.error("Error fetching download URL:", error);
      return null;
    }
  };

  useEffect(() => {
    const imagePaths = ["Exercisemedia/RoutineThumbnail"];

    const fetchUrls = async () => {
      const urls = await Promise.all(
        imagePaths.map((path) => getImageUrl(path))
      );
      setImageUrls(
        urls.flat().filter((url): url is string => !!url && url.trim() !== "")
      );
    };

    fetchUrls();
  }, []);

  const router = useRouter();

  const handleWorkoutPress = (id: string, data: IRoutines) => {
    router.push({
      pathname: `/workout/${id}`,
      params: {
        data: JSON.stringify(data),
      },
    });
  };

const todayId = dayjs().format("YYYY-MM-DD");

  const todayWorkout = data.find((item) => item.id === todayId);

  const day = todayWorkout && dayjs(todayWorkout.id).format("dddd");
  const date = todayWorkout && dayjs(todayWorkout.id).format("DD/MM/YYYY");

  const randomIndex =
    imageUrls.length > 0 ? Math.floor(Math.random() * imageUrls.length) : null;

  const imageUri = randomIndex !== null ? imageUrls[randomIndex] : "";

  return (
    <SafeAreaView className="flex-1 bg-[#84BDEA]">
      <StatusBar style="dark" />
      <View className="flex-1 px-4 pb-2 pt-3 mb-1">
        {/* Header */}
        <Text className="text-[#142939] text-3xl font-bold mb-4">Workout</Text>

        {/* Scrollable Container */}
        <View className="bg-[#42779F] rounded-[12px] p-4" style={shadows.large}>
          <View
          // className="flex-1"
          // showsVerticalScrollIndicator={false}
          // contentContainerStyle={{ paddingBottom: 16 }}
          >
            {todayWorkout && (
              <TouchableOpacity
                key={todayWorkout.id}
                onPress={() =>
                  handleWorkoutPress(todayWorkout.id, todayWorkout)
                }
                className="mb-4"
              >
                <Card className="rounded-xl overflow-hidden border-0">
                  {/* Workout image with overlay */}
                  <View className="relative h-40">
                    {imageUri && (
                      <Image
                        source={{ uri: imageUri }}
                        className="w-full h-40"
                        style={{ width: "100%", height: 150 }}
                      />
                    )}
                    <View className="absolute inset-0 bg-black/30" />

                    {/* Title */}
                    <View className="absolute left-4 top-4">
                      <Text className="text-white text-xl font-bold">
                        {todayWorkout.title}
                      </Text>
                    </View>

                    {/* Day */}
                    <View className="absolute left-4 bottom-1">
                      <Text className="text-white text-base">
                        {day} {""}
                        {date}
                      </Text>
                    </View>
                  </View>

                  {/* Muscles */}
                  <View className="flex-row items-center px-4 py-2 bg-gray-800 rounded-b-xl">
                    <Ionicons name="body" size={16} color="white" />
                    <Text className="text-white ml-2 text-sm">
                      Tap to view for details
                    </Text>
                    <Ionicons
                      className="absolute right-2"
                      name="chevron-forward"
                      size={24}
                      color="white"
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <ProgressSection />
    </SafeAreaView>
  );
};

export default WorkoutIndexScreen;
