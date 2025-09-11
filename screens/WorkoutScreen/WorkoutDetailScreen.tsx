// WorkoutDetailScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { shadows } from "~/utils/shadow";
import { twMerge } from "tailwind-merge";
import { useUser } from "@clerk/clerk-expo";
import { FIRESTORE_DB } from "~/firebase";
import { doc, getDoc } from "firebase/firestore";
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

interface Props {
  workoutId: string;
  workoutData?: IRoutines;
}

const WorkoutDetailScreen: React.FC<Props> = ({ workoutId, workoutData }) => {
  const router = useRouter();
  const { user } = useUser();

  const [data, setData] = useState<IRoutines | null>(workoutData ?? null);
  const [loading, setLoading] = useState<boolean>(!workoutData);
  const [thumbUrl, setThumbUrl] = useState<string>("");

  // Load workout if not passed via params
  useEffect(() => {
    let mounted = true;
    const fetchById = async () => {
      if (workoutData || !user?.id || !workoutId) return;
      try {
        setLoading(true);
        const dref = doc(FIRESTORE_DB, "users", user.id, "routines", workoutId);
        const snap = await getDoc(dref);
        if (!mounted) return;
        if (snap.exists()) {
          const raw = snap.data();
          setData({
            id: snap.id,
            title: raw.title ?? "",
            exercises: raw.exercises ?? [],
            completed: !!raw.completed,
          });
        } else {
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchById();
    return () => { mounted = false; };
  }, [workoutData, workoutId, user?.id]);

  // Fetch stable image for the title
  useEffect(() => {
    let alive = true;
    (async () => {
      const title = data?.title;
      if (!title) { setThumbUrl(""); return; }
      try {
        const url = await fetchThumbUrlForTitle(title);
        if (alive) setThumbUrl(url);
      } catch (e) {
        console.error("Error fetching thumb:", e);
        if (alive) setThumbUrl("");
      }
    })();
    return () => { alive = false; };
  }, [data?.title]);

  const handleWorkoutSessionPress = (id: string, exercises: TExercise[]) => {
    router.push({
      pathname: `/workout/workoutSession`,
      params: { id, data: JSON.stringify(exercises) },
    });
  };

  if (loading || !data) {
    return (
      <View className="flex-1 bg-[#84BDEA] px-2 pt-5 items-center justify-center">
        <ActivityIndicator color="#fff" size="large" />
        <Text className="text-white mt-3">Loading workout…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#84BDEA] px-2 pt-5">
      {/* Header Image */}
      <View className="relative h-[253]">
        {thumbUrl ? (
          <Image source={{ uri: thumbUrl }} className="w-[100%] h-[253] rounded-[12]" />
        ) : (
          <View className="w-[100%] h-[253] rounded-[12] bg-black/20" />
        )}
        <View className="absolute inset-0 h-[253] rounded-[12] bg-black/30" />
        <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-2">
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text className="absolute left-1/2 bottom-6 -translate-x-1/2 text-white text-2xl font-bold">
          {data.title}
        </Text>
      </View>

      {/* Start / Completed / Rest Day */}
      <View className="absolute left-1/2 top-[255] -translate-x-1/2 z-10">
        <TouchableOpacity
          className={twMerge(
            "bg-[#84BDEA] px-20 py-3 rounded-[12]",
            (data.completed || data.title.includes("Rest Day")) && "bg-slate-400"
          )}
          style={shadows.large}
          onPress={() => handleWorkoutSessionPress(workoutId, data.exercises)}
          disabled={data.completed || data.title.includes("Rest Day")}
        >
          <Text className="text-[#142939] font-bold text-lg">
            {data.completed ? "COMPLETED" : data.title.includes("Rest Day") ? "REST DAY" : "START"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Details */}
      <ScrollView className="p-5 bg-[#1E293B] rounded-t-xl flex-1 mt-4">
        <Text className="text-white text-lg font-semibold mb-2">Equipment</Text>
        <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
          <Text className="text-white">None</Text>
        </View>

        <Text className="text-white text-lg font-semibold mb-2">Difficulty</Text>
        <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
          <Text className="text-white">Beginner</Text>
        </View>

        <Text className="text-white text-lg font-semibold mb-2">Exercise Detail</Text>
        <View className="bg-[#2D3B50] p-4 rounded-md">
          <View className="flex-row justify-between pb-2 border-b border-white/20">
            <Text className="text-white font-bold flex-1">Exercise</Text>
            <Text className="text-white font-bold w-20 text-center">Target</Text>
            <Text className="text-white font-bold w-10 text-center">Rep</Text>
            <Text className="text-white font-bold w-10 text-center">Set</Text>
            <Text className="text-white font-bold w-14 text-center">Rest</Text>
          </View>

          {data.exercises.map((ex, i) => (
            <View key={i} className="flex-row justify-between py-2">
              <Text className="text-white flex-1">{ex.exercise}</Text>
              <Text className="text-white w-20 text-center">{ex.target}</Text>
              <Text className="text-white w-10 text-center">{ex.reps}</Text>
              <Text className="text-white w-10 text-center">{ex.sets}</Text>
              <Text className="text-white w-14 text-center">{ex.rest}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetailScreen;
