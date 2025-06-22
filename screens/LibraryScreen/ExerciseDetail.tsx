import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';

const exercises = [
  {
    id: 1,
    name: 'Bench Press',
    category: 'upper',
    muscles: ['Chest'],
    equipment: 'Barbell',
    description: 'Lie on a flat bench with your feet on the ground. Grip the barbell with hands slightly wider than shoulder-width apart. Lower the bar to your chest, then push it back up to the starting position.',
    video: 'https://firebasestorage.googleapis.com/v0/b/fithealthproject-ba957.firebasestorage.app/o/Exercisemedia%2FVideo%2FDumbbell_Bench_Press.mp4?alt=media&token=99b5fa63-3bc9-43d3-adf0-442eb37bf87d',
  },
  {
    id: 2,
    name: 'Squat',
    category: 'lower',
    muscles: ['Legs'],
    equipment: 'Barbell',
    description: 'Stand with feet shoulder-width apart. Place the barbell on your upper back. Bend your knees and lower your hips until your thighs are parallel to the ground. Push through your heels to return to the starting position.',
    video: 'https://firebasestorage.googleapis.com/v0/b/fithealthproject-ba957.firebasestorage.app/o/Exercisemedia%2FVideo%2FSquat.mp4?alt=media&token=1624e546-3bea-409f-9d25-e27252fd0da6',
  },
];

const ExerciseDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  
  const exercise = exercises.find((e) => e.id === Number(id));

  // Create video player instance
  const player = useVideoPlayer(exercise?.video || '', (player) => {
    player.loop = true;
    player.muted = true;
    // Autoplay the video
    player.play();
  });

  if (!exercise) {
    return (
      <View className="flex-1 bg-[#84BDEA] justify-center items-center">
        <Text className="text-white text-center text-lg">Exercise not found</Text>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mt-4 bg-[#1E293B] px-6 py-3 rounded-lg"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleVideoError = (error) => {
    console.error('Video error:', error);
    setVideoError(true);
    Alert.alert('Video Error', 'Unable to load video content');
  };

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

  // Hide controls after 3 seconds when video is playing
  React.useEffect(() => {
    if (isPlaying && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, showControls]);

  return (
    <View className="flex-1 bg-[#84BDEA] px-2 pt-5">
      {/* Header Video */}
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
            
            {/* Touch overlay for play/pause */}
            <TouchableOpacity 
              onPress={togglePlayPause}
              className="absolute inset-0"
              activeOpacity={1}
            >
              {/* Play/Pause button overlay */}
              {(!isPlaying || showControls) && (
                <View className="absolute inset-0 justify-center items-center">
                  <View className="bg-black/60 rounded-full p-4">
                    <Ionicons 
                      name={isPlaying ? "pause" : "play"} 
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
        
        {/* Overlay for better text visibility */}
        <View className="absolute inset-0 bg-black/20 pointer-events-none" />
        
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="absolute top-5 left-2 bg-black/50 rounded-full p-2 z-10"
        >
          <Ionicons name="chevron-back-outline" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Exercise Name */}
        <View className="absolute bottom-4 left-4 right-4 pointer-events-none">
          <Text className="text-white text-2xl font-bold text-center shadow-lg">
            {exercise.name}
          </Text>
        </View>
      </View>

      {/* Exercise Details */}
      <ScrollView 
        className="flex-1 mt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-[#1E293B] rounded-xl p-5">
          {/* Equipment Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3 flex-row items-center">
              Equipment
            </Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              <Text className="text-white text-base">{exercise.equipment}</Text>
            </View>
          </View>

          {/* Muscles Worked Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              Muscles 
            </Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              <Text className="text-white text-base">{exercise.muscles.join(', ')}</Text>
            </View>
          </View>

          {/* Instruction Section */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
               Instruction
            </Text>
            <View className="bg-[#2D3B50] p-4 rounded-lg">
              <Text className="text-white text-base leading-6">{exercise.description}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ExerciseDetail;