import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from "expo-router";

const exercises = [
    { id: 1, name: 'Bench Press', category: 'upper', muscles: ['Chest'], equipment: 'Barbell', description: 'Lie on a flat bench with your feet on the ground. Grip the barbell with hands slightly wider than shoulder-width apart. Lower the bar to your chest, then push it back up to the starting position.', image: 'https://via.placeholder.com/320x200' },
    { id: 2, name: 'Squat', category: 'lower', muscles: ['Legs'], equipment: 'Barbell', description: 'Stand with feet shoulder-width apart. Place the barbell on your upper back. Bend your knees and lower your hips until your thighs are parallel to the ground. Push through your heels to return to the starting position.', image: 'https://via.placeholder.com/320x200' },
    { id: 3, name: 'Deadlift', category: 'lower', muscles: ['Back', 'Legs'], equipment: 'Barbell', description: 'A fundamental compound movement that strengthens the back and legs.', image: 'https://via.placeholder.com/320x200' },
    { id: 4, name: 'Push-up', category: 'upper', muscles: ['Chest', 'Arms'], equipment: 'None', description: 'Bodyweight exercise that targets the chest and arms.', image: 'https://via.placeholder.com/320x200' },
    { id: 5, name: 'Pull-up', category: 'upper', muscles: ['Back', 'Arms'], equipment: 'None', description: 'Strengthens the upper back and biceps.', image: 'https://via.placeholder.com/320x200' },
    { id: 6, name: 'Plank', category: 'core', muscles: ['Core'], equipment: 'None', description: 'Core stability exercise.', image: 'https://via.placeholder.com/320x200' },
];

const ExerciseDetail: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // Find the workout by ID
    const exercise = exercises.find((e) => e.id === Number(id));

    if (!exercise) {
        return <Text className="text-white text-center mt-10">Exercise not found</Text>;
    }

    return (
        <View className="flex-1 bg-sky-200 px-2 pt-10">
            {/* Header Image */}
            <View className="relative">
                <Image source={{ uri: exercise.image }} className="w-full h-64 rounded-xl" />
                <View className="absolute inset-0 bg-black/30 rounded-xl" />
                <TouchableOpacity onPress={() => router.back()} className="absolute top-5 left-2">
                    <Ionicons name="chevron-back-outline" size={30} color="white" />
                </TouchableOpacity>
                <Text className="absolute left-1/2 bottom-6 -translate-x-1/2 text-white text-2xl font-bold">
                    {exercise.name}
                </Text>
            </View>

            {/* Exercise Details */}
            <ScrollView className="p-5 bg-[#1E293B] rounded-t-xl flex-1 mt-4">
                {/* Equipment */}
                <Text className="text-white text-lg font-semibold mb-2">Equipment</Text>
                <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
                    <Text className="text-white">{exercise.equipment}</Text>
                </View>

                {/* Muscles Worked */}
                <Text className="text-white text-lg font-semibold mb-2">Muscles Worked</Text>
                <View className="bg-[#2D3B50] p-3 rounded-md mb-4">
                    <Text className="text-white">{exercise.muscles.join(', ')}</Text>
                </View>

                {/* Exercise Description */}
                <Text className="text-white text-lg font-semibold mb-2">Description</Text>
                <View className="bg-[#2D3B50] p-4 rounded-md">
                    <Text className="text-white">{exercise.description}</Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default ExerciseDetail;
