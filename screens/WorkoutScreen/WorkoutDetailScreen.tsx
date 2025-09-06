import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { FIREBASE_STORE } from "~/firebase";
import { shadows } from "~/utils/shadow";
import { IRoutines, TExercise } from "./WorkoutIndexScreen";
import { twMerge } from "tailwind-merge";

// Define mock workout data (Replace this with actual API fetching later)
// const workouts = [
//   {
//     id: "1",
//     title: "Push Day",
//     day: "Monday",
//     targetMuscles: "Chest, Shoulder and Triceps",
//     image: require("../../assets/images/Image/Push.jpg"),
//     exercises: [
//       {
//         name: "Push-up",
//         target: "Chest",
//         reps: "10 - 15",
//         sets: 4,
//         rest: "1:30",
//       },
//     ],
//   },
//   {
//     id: "2",
//     title: "Pull Day",
//     day: "Wednesday",
//     targetMuscles: "Back and Biceps",
//     image: require("../../assets/images/favicon.png"),
//     exercises: [
//       {
//         name: "Pull-up",
//         target: "Back",
//         reps: "8 - 12",
//         sets: 3,
//         rest: "1:30",
//       },
//     ],
//   },
// ];

interface IWorkOutDetailScreen {
  workoutId: string;
  workoutData: IRoutines;
}

const WorkoutDetailScreen: React.FC<IWorkOutDetailScreen> = (props) => {
  const { workoutId, workoutData } = props;
  const router = useRouter();

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const getImageUrl = async (link: string) => {
    try {
      const imageRef = ref(
        FIREBASE_STORE,
        `gs://fithealthproject-ba957.firebasestorage.app/${link}`
      );
      const result = await listAll(imageRef);

      const urls = await Promise.all(
        result.items.map((itemRef) => getDownloadURL(itemRef))
      );

      return urls;
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
      setImageUrls(urls.flat().filter((url): url is string => url !== null));
    };

    fetchUrls();
  }, []);

  const randomIndex =
    imageUrls.length > 0 ? Math.floor(Math.random() * imageUrls.length) : null;

  const imageUri = randomIndex !== null ? imageUrls[randomIndex] : "";

  const handleWorkoutSessionPress = (id: string, data: TExercise[]) => {
    router.push({
      pathname: `/workout/workoutSession`,
      params: {
        data: JSON.stringify(data),
        id: JSON.stringify(id),
      },
    });
  };

  return (
    <View className="flex-1 bg-[#84BDEA] px-2 pt-5">
      {/* Header Image */}
      <View className="relative h-[253]">
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            className="w-[100%] h-[253] rounded-[12]"
          />
        )}
        <View className="absolute inset-0 h-[253] rounded-[12] bg-black/30" />
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-5 left-2"
        >
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text className="absolute left-1/2 bottom-6 -translate-x-1/2 text-white text-2xl font-bold">
          {workoutData.title}
        </Text>
      </View>

      {/* Start Button - Positioned to Overlap */}
      <View className="absolute left-1/2 top-[255] -translate-x-1/2 z-10">
        <TouchableOpacity
          className={twMerge(
            "bg-[#84BDEA] px-20 py-3 rounded-[12]",
            (workoutData.completed || workoutData.title.includes("Rest Day")) &&
              "bg-slate-400"
          )}
          style={shadows.large}
          onPress={() =>
            handleWorkoutSessionPress(workoutId, workoutData.exercises)
          }
          disabled={
            workoutData.completed || workoutData.title.includes("Rest Day")
          }
        >
          <Text className="text-[#142939] font-bold text-lg">
            {workoutData.completed
              ? "COMPLETED"
              : workoutData.title.includes("Rest Day")
              ? "REST DAY"
              : "START"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Details - Pushed Down to Leave Space */}
      <ScrollView className="p-5 bg-[#1E293B] rounded-t-xl flex-1 mt-4">
        <Text className="text-white text-lg font-semibold mb-2">Equipment</Text>
        <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
          <Text className="text-white">None</Text>
        </View>

        <Text className="text-white text-lg font-semibold mb-2">
          Difficulty
        </Text>
        <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
          <Text className="text-white">Beginner</Text>
        </View>

        <Text className="text-white text-lg font-semibold mb-2">
          Exercise Detail
        </Text>
        <View className="bg-[#2D3B50] p-4 rounded-md">
          <View className="flex-row justify-between pb-2 border-b border-white/20">
            <Text className="text-white font-bold flex-1">Exercise</Text>
            <Text className="text-white font-bold w-20 text-center">
              Target
            </Text>
            <Text className="text-white font-bold w-10 text-center">Rep</Text>
            <Text className="text-white font-bold w-10 text-center">Set</Text>
            <Text className="text-white font-bold w-14 text-center">Rest</Text>
          </View>

          {workoutData.exercises.map((exercise, index) => (
            <View key={index} className="flex-row justify-between py-2">
              <Text className="text-white flex-1">{exercise.exercise}</Text>
              <Text className="text-white w-20 text-center">
                {exercise.target}
              </Text>
              <Text className="text-white w-10 text-center">
                {exercise.reps}
              </Text>
              <Text className="text-white w-10 text-center">
                {exercise.sets}
              </Text>
              <Text className="text-white w-14 text-center">
                {exercise.rest}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetailScreen;
