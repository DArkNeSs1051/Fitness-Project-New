import React, { useState, useRef, useEffect  } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEventListener } from 'expo';
import Animated, {FadeIn,FadeOut} from "react-native-reanimated";

type Category = 'all' | 'upper' | 'lower' | 'core' | 'cardio';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'upper', name: 'Upper Body' },
  { id: 'lower', name: 'Lower Body' },
  { id: 'core', name: 'Core' },
  { id: 'cardio', name: 'Cardio' }
];

const muscles = ['Chest', 'Back', 'Arms', 'Legs', 'Core'];
const equipmentList = ['None', 'Barbell', 'Dumbbell', 'Machine'];
const level = ['Beginner', 'Intermediate', 'Advanced']

const exercises = [
  { 
    id: 1, 
    name: 'Bench Press', 
    category: 'upper', 
    muscles: ['Chest'], 
    equipment: 'Barbell', 
    level: 'Beginner',
    description: 'Lie on a flat bench with your feet on the ground. Grip the barbell with hands slightly wider than shoulder-width apart. Lower the bar to your chest, then push it back up to the starting position.', 
    image: 'https://firebasestorage.googleapis.com/v0/b/fithealthproject-ba957.firebasestorage.app/o/Exercisemedia%2FThumbnail%2FDumbbell_Bench_Press.jpg?alt=media&token=23535fc9-7d09-4bbc-9f66-71292e2df09e', 
    hasVideo: true,
    video: 'https://firebasestorage.googleapis.com/v0/b/fithealthproject-ba957.firebasestorage.app/o/Exercisemedia%2FVideo%2FDumbbell_Bench_Press.mp4?alt=media&token=99b5fa63-3bc9-43d3-adf0-442eb37bf87d'
  },
  { 
    id: 2, 
    name: 'Squat', 
    category: 'lower', 
    muscles: ['Legs'], 
    equipment: 'Barbell', 
    level: 'Beginner',
    description: 'Stand with feet shoulder-width apart. Place the barbell on your upper back. Bend your knees and lower your hips until your thighs are parallel to the ground. Push through your heels to return to the starting position.', 
    image: 'https://firebasestorage.googleapis.com/v0/b/fithealthproject-ba957.firebasestorage.app/o/Exercisemedia%2FThumbnail%2FSquat.jpg?alt=media&token=ab9c690d-14af-4b59-84e0-6bdf7c18dbd7', 
    hasVideo: true,
    video: 'https://firebasestorage.googleapis.com/v0/b/fithealthproject-ba957.firebasestorage.app/o/Exercisemedia%2FVideo%2FSquat.mp4?alt=media&token=1624e546-3bea-409f-9d25-e27252fd0da6'
  },
  { id: 3, name: 'Deadlift', category: 'lower', muscles: ['Back', 'Legs'], equipment: 'Barbell', level: 'Beginner', description: '...', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 4, name: 'Push-up', category: 'upper', muscles: ['Chest', 'Arms'], equipment: 'None', level: 'Beginner', description: '...', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 5, name: 'Pull-up', category: 'upper', muscles: ['Back', 'Arms'], equipment: 'None', level: 'Beginner', description: 'Hang from a pull-up bar with palms facing away from you. Pull your body up until your chin is above the bar. Lower yourself back down with control.', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 6, name: 'Plank', category: 'core', muscles: ['Core'], equipment: 'None', level: 'Beginner', description: 'Start in a push-up position with your forearms on the ground. Keep your body in a straight line from head to heels, engaging your core muscles. Hold this position for the prescribed time.', hasVideo: false },
];

// Video Thumbnail Component with Reset on End
const VideoThumbnail = ({ exercise, onPress }) => {
  const [showVideo, setShowVideo] = useState(false);
  const player = useVideoPlayer(exercise.video || '', (player) => {
    player.muted = true;
    player.loop = false;
  });

  // Listen for the playToEnd event to reset the video back to thumbnail
  useEventListener(player, 'playToEnd', () => {
    setShowVideo(false);
    // Reset the video to the beginning for next play
    player.currentTime = 0;
  });

  const handlePress = () => {
    if (showVideo) {
      onPress(); // Navigate to detail page
    } else {
      setShowVideo(true);
      player.play();
    }
  };
  
  const handleVideoPress = () => {
    onPress(); // Navigate to detail page when video is clicked
  };

  if (!exercise.hasVideo || !exercise.video) {
    return (
      <TouchableOpacity onPress={onPress}>
        <Image
          source={{ uri: exercise.image }}
          className="w-full h-40"
          resizeMode="cover"
        />
        <View className="absolute inset-0 justify-center items-center">
          <View className="bg-black/50 rounded-full p-3">
            <Ionicons name="image" size={30} color="white" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} className="relative">
      {showVideo ? (
        <TouchableOpacity onPress={handleVideoPress}>
          <VideoView
            player={player}
            style={{ width: '100%', height: 160 }}
            contentFit="cover"
            nativeControls={false}
          />
          {/* Video indicator overlay */}
          <View className="absolute top-2 right-2">
            <View className="bg-red-500 rounded-full px-2 py-1 flex-row items-center">
              <View className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              <Text className="text-white text-xs font-bold">LIVE</Text>
            </View>
          </View>
          {/* Tap to view indicator */}
          <View className="absolute bottom-2 left-2 right-2">
            <View className="bg-black/70 rounded-lg px-3 py-2">
              <Text className="text-white text-xs text-center">Tap to view details</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <>
          <Image
            source={{ uri: exercise.image }}
            className="w-full h-40"
            resizeMode="cover"
          />
          {/* Play button overlay */}
          <View className="absolute inset-0 justify-center items-center">
            <View className="bg-black/60 rounded-full p-4">
              <Ionicons name="play" size={30} color="white" />
            </View>
          </View>
          {/* Video duration/type indicator */}
          <View className="absolute top-2 right-2">
            <View className="bg-black/70 rounded-full px-2 py-1 flex-row items-center">
              <Ionicons name="videocam" size={12} color="white" />
              <Text className="text-white text-xs ml-1">Demo</Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const LibraryScreen = () => {
  const router = useRouter();
  const filterButtonRef = useRef(null);
  
  const handleWorkoutPress = (id: number) => {
    router.push(`/exercise/${id}`);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterButtonLayout, setFilterButtonLayout] = useState({ y: 0, height: 0 });

  const toggleFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterVisible(!filterVisible);
  };

  const handleFilterButtonLayout = (event) => {
    const { y, height } = event.nativeEvent.layout;
    setFilterButtonLayout({ y, height });
  };

  const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
    const matchesMuscle = selectedMuscles.length === 0 || selectedMuscles.some(m => exercise.muscles.includes(m));
    const matchesEquipment = selectedEquipment.length === 0 || selectedEquipment.includes(exercise.equipment);
    const matchesLevel = selectedLevel.length ===0 || selectedLevel.includes(exercise.level)
    const matchesSearch =
      searchQuery === '' ||
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscles.some(muscle => muscle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exercise.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesMuscle && matchesEquipment && matchesLevel && matchesSearch;
  });

  return (
    <View className="flex-1 py-4 bg-[#84BDEA]">
      <View className="px-4 pb-2">
        <Text className="text-3xl font-bold text-[#142939]">Exercise Library</Text>
        <Text className="text-[#142939] mt-1">Find and learn proper techniques</Text>
      </View>

      {/* Search Bar */}
      <View className="px-4 my-3">
        <View className="flex-row items-center bg-white rounded-lg px-3 border border-gray-200">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput 
            className="flex-1 py-3 px-2" 
            placeholder="Search exercises" 
            placeholderTextColor="#000" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Button */}
      <TouchableOpacity 
        ref={filterButtonRef}
        onPress={toggleFilter} 
        onLayout={handleFilterButtonLayout}
        className="mx-4 py-3 bg-[#5FA3D6] rounded-t-lg shadow-lg flex-row items-center justify-center"
      >
        <Ionicons name="filter" size={20} color="#142939" />
        <Text className="text-[#142939] ml-2 text-lg">Filter</Text>
      </TouchableOpacity>

      {/* Filter Dropdown */}
      {filterVisible && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)} 
          className="absolute left-4 right-4 p-4 bg-white rounded-bl-[12] rounded-br-[12] shadow-lg z-50"
          style={{
            top: filterButtonLayout.y + filterButtonLayout.height,
          }}
        >
          {/* Category Filter */}
          <Text className="text-lg font-bold mb-2">Category</Text>
          <View className="flex-row flex-wrap">
            {categories.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                className={`px-3 py-2 m-1 rounded-lg ${selectedCategory === cat.id ? 'bg-[#5FA3D6]' : 'bg-gray-200'}`} 
                onPress={() => setSelectedCategory(cat.id as Category)}
              >
                <Text className={selectedCategory === cat.id ? 'text-white' : 'text-gray-700'}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

             {/* Level Filter */}
          <Text className="text-lg font-bold mt-4 mb-2">Level</Text>
          <View className="flex-row flex-wrap">
            {level.map(lvl => (
              <TouchableOpacity
                key={lvl}
                className={`px-3 py-2 m-1 rounded-lg ${selectedLevel.includes(lvl) ? 'bg-[#5FA3D6]' : 'bg-gray-200'}`}
                onPress={() => toggleSelection(lvl, selectedLevel, setSelectedLevel)}
              >
                <Text className={selectedLevel.includes(lvl) ? 'text-white' : 'text-gray-700'}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Muscle Group Filter */}
          <Text className="text-lg font-bold mt-4 mb-2">Muscle Groups</Text>
          <View className="flex-row flex-wrap">
            {muscles.map(muscle => (
              <TouchableOpacity
                key={muscle}
                className={`px-3 py-2 m-1 rounded-lg ${selectedMuscles.includes(muscle) ? 'bg-[#5FA3D6]' : 'bg-gray-200'}`}
                onPress={() => toggleSelection(muscle, selectedMuscles, setSelectedMuscles)}
              >
                <Text className={selectedMuscles.includes(muscle) ? 'text-white' : 'text-gray-700'}>
                  {muscle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Equipment Filter */}
          <Text className="text-lg font-bold mt-4 mb-2">Equipment</Text>
          <View className="flex-row flex-wrap">
            {equipmentList.map(equip => (
              <TouchableOpacity
                key={equip}
                className={`px-3 py-2 m-1 rounded-lg ${selectedEquipment.includes(equip) ? 'bg-[#5FA3D6]' : 'bg-gray-200'}`}
                onPress={() => toggleSelection(equip, selectedEquipment, setSelectedEquipment)}
              >
                <Text className={selectedEquipment.includes(equip) ? 'text-white' : 'text-gray-700'}>
                  {equip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}

      {/* Exercise List */}
      <View className='bg-[#42779F] shadow-lg mx-4 rounded-b-[12] flex-1'>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {filteredExercises.length === 0 ? (
            <View className="flex-1 items-center justify-center mt-10">
              <Ionicons className='mt-10' name="search-outline" size={35} color="white" />
              <Text className="text-white text-lg mt-2">Exercise not found</Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                className="bg-white rounded-xl overflow-hidden mb-4"
                activeOpacity={0.9}
                onPress={() => handleWorkoutPress(exercise.id)} 
              >
                <VideoThumbnail 
                  exercise={exercise} 
                  onPress={() => handleWorkoutPress(exercise.id)} 
                />
                
                <View className="bg-gray-800 p-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-white">{exercise.name}</Text>
                    <View className='flex-row'>
                      <View className="bg-[#98c9ee] rounded-full px-2 py-1 flex-row items-center">
                        <Ionicons name="barbell" size={14} color="#42779F" />
                        <Text className="text-xs text-[#42779F] font-medium ml-1">{exercise.equipment}</Text>
                      </View>
                      {exercise.hasVideo && (
                        <View className="bg-[#98c9ee] ml-[5] px-2 py-1 rounded-full flex-row items-center">
                          <Ionicons name="videocam" size={14} color="#42779F" />
                          <Text className="text-xs text-[#42779F] font-medium ml-1">Video</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className="text-[#98c9ee] mt-1">{exercise.muscles.join(', ')}</Text>
                  <Text className="text-white mt-2 text-sm">{exercise.description.substring(0, 100)}...</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default LibraryScreen;