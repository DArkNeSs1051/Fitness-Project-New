import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";
import { shadows } from '~/utils/shadow';

// Define mock workout data (Replace this with actual API fetching later)
const workouts = [
    {
        id: '1',
        title: 'Push Day',
        day: 'Monday',
        targetMuscles: 'Chest, Shoulder and Triceps',
        image: require('../../assets/images/Image/Push.jpg'),
        exercises: [
            { name: 'Push-up', target: 'Chest', reps: '10 - 15', sets: 4, rest: '1:30' },
        ],
    },
    {
        id: '2',
        title: 'Pull Day',
        day: 'Wednesday',
        targetMuscles: 'Back and Biceps',
        image: require('../../assets/images/favicon.png'),
        exercises: [
            { name: 'Pull-up', target: 'Back', reps: '8 - 12', sets: 3, rest: '1:30' },
        ],
    },
];

const WorkoutDetailScreen: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // Find the workout by ID
    const workout = workouts.find((w) => w.id === id);

    if (!workout) {
        return <Text className="text-white text-center mt-10">Workout not found</Text>;
    }

    return (
        <View className="flex-1 bg-[#84BDEA] px-2 pt-5">
            {/* Header Image */}
            <View className="relative">
                <Image source={workout.image} className="w-[100%] h-[253] rounded-[12]" />
                <View className="absolute inset-0 h-[253] rounded-[12] bg-black/30" />
                <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-2">
                    <Ionicons name="chevron-back-outline" size={30} color="white" />
                </TouchableOpacity>
                <Text className="absolute left-1/2 bottom-6 -translate-x-1/2 text-white text-2xl font-bold">
                    {workout.title}
                </Text>
            </View>

            {/* Start Button - Positioned to Overlap */}
            <View className="absolute left-1/2 top-[255] -translate-x-1/2 z-10">
                <TouchableOpacity className="bg-[#84BDEA] px-20 py-3 rounded-[12]" style={shadows.large}>
                    <Text className="text-[#142939] font-bold text-lg">START</Text>
                </TouchableOpacity>
            </View>

            {/* Exercise Details - Pushed Down to Leave Space */}
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

                    {workout.exercises.map((exercise, index) => (
                        <View key={index} className="flex-row justify-between py-2">
                            <Text className="text-white flex-1">{exercise.name}</Text>
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
