import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ProgressSection } from "~/components/ProgressSection";
import { shadows } from "~/utils/shadow";
import { Card } from "../../components/ui/card";
import { useUser } from "@clerk/clerk-expo";
import { useRoutineStore } from "~/store/useRoutineStore";

// Define workout type
interface WorkoutDay {
  id: string;
  title: string;
  day: string;
  targetMuscles: string;
  image: any;
}

const WorkoutIndexScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const fetchRoutine = useRoutineStore((state) => state.fetchRoutineFromFirestore);

  useEffect(() => {
    if (user?.id) {
      fetchRoutine(user.id);
    }
  }, [user?.id]);

  const workouts: WorkoutDay[] = [
    {
      id: "1",
      title: "Push Day",
      day: "Monday",
      targetMuscles: "Chest, Shoulder and Triceps",
      image: require("../../assets/images/Image/Push.jpg"),
    },
    {
      id: "2",
      title: "Pull Day",
      day: "Wednesday",
      targetMuscles: "Back and Biceps",
      image: require("../../assets/images/favicon.png"),
    },
    {
      id: "3",
      title: "Leg Day",
      day: "Friday",
      targetMuscles: "Quads, Hamstrings and Calves",
      image: require("../../assets/images/favicon.png"),
    },
  ];

  const handleWorkoutPress = (id: string) => {
    router.push(`/workout/${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#84BDEA]">
      <StatusBar style="dark" />
      <View className="flex-1 px-4 pb-2 pt-3 mb-1">
        {/* Header */}
        <Text className="text-[#142939] text-3xl font-bold mb-4">Workout</Text>

        {/* Workout Cards */}
        <View
          className="bg-[#42779F] rounded-[12] p-4 flex-1"
          style={shadows.large}
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {workouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                onPress={() => handleWorkoutPress(workout.id)}
                className="mb-4"
              >
                <Card className="rounded-xl overflow-hidden border-0">
                  <View className="relative">
                    <Image
                      source={workout.image}
                      className="w-full h-40"
                      style={{ width: "100%", height: 150 }}
                    />
                    <View className="absolute inset-0 bg-black/30" />

                    {/* Title */}
                    <View className="absolute left-4 top-4">
                      <Text className="text-white text-xl font-bold">
                        {workout.title}
                      </Text>
                    </View>

                    {/* Day */}
                    <View className="absolute left-4 bottom-1">
                      <Text className="text-white text-base">{workout.day}</Text>
                    </View>
                  </View>

                  {/* Muscles */}
                  <View className="flex-row items-center px-4 py-2 bg-gray-800 rounded-b-xl">
                    <Ionicons name="body" size={16} color="white" />
                    <Text className="text-white ml-2 text-sm">
                      {workout.targetMuscles}
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
            ))}
          </ScrollView>
        </View>
      </View>
      <ProgressSection />
    </SafeAreaView>
  );
};

export default WorkoutIndexScreen;
