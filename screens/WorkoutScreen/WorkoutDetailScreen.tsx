import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { shadows } from '~/utils/shadow';
import { useRoutineStore } from '~/store/useRoutineStore';
import dayjs from 'dayjs';


type Exercise = {
  exercise: string;
  target: [];
  sets: number;
  reps: number | string;
  rest: string;
};

type Workout = {
  title: string;
  exercises: Exercise[];
};
type WorkoutDetailScreenProps = {
  workoutId: string;
};

const WorkoutDetailScreen: React.FC<WorkoutDetailScreenProps> = ({ workoutId }) => {
  const router = useRouter();
  const { workouts } = useRoutineStore();
  const workout = workouts[workoutId];

  if (!workout) {
    return (
      <View className="flex-1 bg-[#84BDEA] justify-center items-center">
        <Text className="text-white text-lg">Workout not found</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-[#84BDEA] px-2 pt-5">
      {/* Header Image */}
      <View className="relative">
        <Image source={require('../../assets/images/Image/Push.jpg')} className="w-full h-[253px] rounded-[12px]" />
        <View className="absolute inset-0 h-[253px] rounded-[12px] bg-black/30" />
        <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-2">
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>
        <Text className="absolute left-1/2 bottom-6 -translate-x-1/2 text-white text-2xl font-bold">
          {workout.title}
        </Text>
      </View>

      {/* Start Button */}
      <View className="absolute left-1/2 top-[255px] -translate-x-1/2 z-10">
        <TouchableOpacity className="bg-[#84BDEA] px-20 py-3 rounded-[12px]" style={shadows.large}>
          <Text className="text-[#142939] font-bold text-lg">START</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Details */}
      <ScrollView className="p-5 bg-[#1E293B] rounded-t-xl flex-1 mt-4">
        <Text className="text-white text-lg font-semibold mb-2">Date</Text>
        <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
          <Text className="text-white">{dayjs(workoutId).format('dddd, MMMM D, YYYY')}</Text>
        </View>

        <Text className="text-white text-lg font-semibold mb-2">Muscle Targets</Text>
        <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
          <Text className="text-white">
            {workout.exercises?.map((e) => e.target).join(', ') || 'Full Body'}
          </Text>
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

          {workout.exercises?.map((exercise, index) => (
            <View key={index} className="flex-row justify-between py-2">
              <Text className="text-white flex-1">{exercise.exercise}</Text>
              <Text className="text-white w-20 text-center">{exercise.target}</Text>
              <Text className="text-white w-10 text-center">{exercise.reps}</Text>
              <Text className="text-white w-10 text-center">{exercise.sets}</Text>
              <Text className="text-white w-14 text-center">{exercise.rest}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetailScreen;
