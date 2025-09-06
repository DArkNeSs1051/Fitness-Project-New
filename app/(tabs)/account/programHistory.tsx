import React, { useEffect, useState } from 'react';
import { useRouter } from "expo-router";
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '~/utils/shadow';
import { useRoutineStore } from '~/store/useRoutineStore';
import { useUser } from '@clerk/clerk-expo';
import dayjs from 'dayjs';

const programHistoryIndex: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const { fetchRoutineFromFirestore, getCompletedDates, workouts } = useRoutineStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user?.id && !loaded) {
      fetchRoutineFromFirestore(user.id).then(() => setLoaded(true));
    }
  }, [user]);

  const completedDates = getCompletedDates();

  const formatWorkoutTitle = (date: string) => {
    const dayName = dayjs(date).format('dddd');
    const workout = workouts[date];
    const workouttitle = workout?.title;
    const muscles = workout?.exercises?.map((e) => e.target).join(', ') || 'Full Body';

    return {
      title: workouttitle,
      day: dayjs(date).format('YYYY-MM-DD'),
      targetMuscles: muscles,
      image: require('../../../assets/images/Image/Push.jpg'), // Change this logic if you want dynamic images
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#84BDEA]">
      <StatusBar style="dark" />
      <View className="flex-1 px-4 pb-2 pt-3 mb-1">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={30} color="white" />
        </TouchableOpacity>

        <View className="bg-[#42779F] rounded-[12] mt-5 p-4 flex-1" style={shadows.large}>
          <Text className="text-[#ffff] text-3xl font-bold mb-4">History</Text>
          {completedDates.length === 0 ? (
            <View className="flex-1 justify-center items-center">
                <Ionicons name="search-outline" size={35} color="white" />
                <Text className="text-white text-center text-base">No completed routines yet.</Text>
            </View>
            ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {completedDates.map((date) => {
                const workout = formatWorkoutTitle(date);
                return (
                    <TouchableOpacity key={date} onPress={() => router.push(`/workout/${date}`)} className="mb-4">
                    <View className="bg-white rounded-xl overflow-hidden shadow-md">
                        <View className="relative">
                        <Image source={workout.image} className="w-full h-40" style={{ width: '100%', height: 150 }} />
                        <View className="absolute inset-0 bg-black/30" />
                        <View className="absolute left-4 top-4">
                            <Text className="text-white text-xl font-bold">{workout.title}</Text>
                        </View>
                        <View className="absolute left-4 bottom-1">
                            <Text className="text-white text-base">{workout.day}</Text>
                        </View>
                        </View>
                        <View className="flex-row items-center px-4 py-2 bg-gray-800 rounded-b-xl">
                        <Ionicons name="body" size={16} color="white" />
                        <Text className="text-white ml-2 text-sm">Tap to see more detail.</Text>
                        <Ionicons style={{ position: 'absolute', right: 8 }} name="chevron-forward" size={24} color="white" />
                        </View>
                    </View>
                    </TouchableOpacity>
                );
                })}
            </ScrollView>
            )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default programHistoryIndex;
