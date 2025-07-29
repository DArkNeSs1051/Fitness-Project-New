import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useExerciseStore } from '../../store/useExerciseStore';

const ExerciseDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const exerciseId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);

  const [exercise, setExercise] = useState(null);

  // Get exercises from store
  const exercises = useExerciseStore((state) => state.exercises);
  const fetchExercises = useExerciseStore((state) => state.fetchExercises);

  useEffect(() => {
    const loadData = async () => {
      if (!exerciseId || typeof exerciseId !== 'string') {
        Alert.alert('Error', 'Invalid or missing exercise ID');
        router.back();
        return;
      }

      if (exercises.length === 0) {
        await fetchExercises();
      }

      const found = exercises.find((ex) => ex.id === exerciseId);

      if (!found) {
        Alert.alert('Error', 'Exercise not found');
        router.back();
      } else {
        setExercise(found);
      }

      setLoading(false);
    };

    loadData();
  }, [exerciseId, exercises]);

  const player = useVideoPlayer(exercise?.videoUrl || '', (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      player.play();
      setIsPlaying(true);
      setShowControls(false);
    }
  };

  useEffect(() => {
    if (isPlaying && showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, showControls]);

  const handleVideoError = (error) => {
    console.error('Video error:', error);
    setVideoError(true);
    Alert.alert('Video Error', 'Unable to load video content');
  };

  if (loading || !exercise) {
    return (
      <View className="flex-1 bg-[#84BDEA] justify-center items-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white mt-4">Loading exercise...</Text>
      </View>
    );
  }
  return (
    <View className="flex-1 bg-[#84BDEA] px-2 pt-5">
      <View className="relative rounded-xl overflow-hidden bg-black">
        {!videoError ? (
          <>
            <VideoView
              player={player}
              style={{ width: '100%', height: 250 }}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              onError={handleVideoError}
              contentFit="cover"
              nativeControls={false}
            />
            <TouchableOpacity
              onPress={togglePlayPause}
              className="absolute inset-0"
              activeOpacity={1}
            >
              {(!isPlaying || showControls) && (
                <View className="absolute inset-0 justify-center items-center">
                  <View className="bg-black/60 rounded-full p-4">
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={40}
                      color="white"
                    />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View className="w-full h-[250px] bg-gray-800 justify-center items-center">
            <Ionicons name="videocam-off" size={50} color="#9CA3AF" />
            <Text className="text-gray-400 mt-2">Video unavailable</Text>
          </View>
        )}

        <View className="absolute inset-0 bg-black/20 pointer-events-none" />
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-5 left-2 bg-black/50 rounded-full p-2 z-10"
        >
          <Ionicons name="chevron-back-outline" size={24} color="white" />
        </TouchableOpacity>

        <View className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <Text className="text-white text-2xl font-bold text-center shadow-lg">
            {exercise.name}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        <View className="bg-[#1E293B] rounded-xl p-5">
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Equipment</Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              <Text className="text-white text-base">{exercise.equipment}</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Muscles</Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              <Text className="text-white text-base">{exercise.muscleGroups?.join(', ')}</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Description</Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              <Text className="text-white text-base leading-6">{exercise.description}</Text>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Instruction</Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              {exercise.instruction.map((item, index) => (
                <Text
                  key={index}
                  className="text-white text-base leading-6"
                  style={{ marginBottom: 12 }}
                >
                  {item}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ExerciseDetail;
