import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, LayoutAnimation, UIManager, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";

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

const exercises = [
  { id: 1, name: 'Bench Press', category: 'upper', muscles: ['Chest'], equipment: 'Barbell', description: 'Lie on a flat bench with your feet on the ground. Grip the barbell with hands slightly wider than shoulder-width apart. Lower the bar to your chest, then push it back up to the starting position.', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 2, name: 'Squat', category: 'lower', muscles: ['Legs'], equipment: 'Barbell', description: 'Stand with feet shoulder-width apart. Place the barbell on your upper back. Bend your knees and lower your hips until your thighs are parallel to the ground. Push through your heels to return to the starting position.', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 3, name: 'Deadlift', category: 'lower', muscles: ['Back', 'Legs'], equipment: 'Barbell', description: '...', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 4, name: 'Push-up', category: 'upper', muscles: ['Chest', 'Arms'], equipment: 'None', description: '...', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 5, name: 'Pull-up', category: 'upper', muscles: ['Back', 'Arms'], equipment: 'None', description: 'Hang from a pull-up bar with palms facing away from you. Pull your body up until your chin is above the bar. Lower yourself back down with control.', image: '/api/placeholder/320/200', hasVideo: true },
  { id: 6, name: 'Plank', category: 'core', muscles: ['Core'], equipment: 'None', description: 'Start in a push-up position with your forearms on the ground. Keep your body in a straight line from head to heels, engaging your core muscles. Hold this position for the prescribed time.', hasVideo: false },
];

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
    const matchesSearch =
      searchQuery === '' ||
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscles.some(muscle => muscle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exercise.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesMuscle && matchesEquipment && matchesSearch;
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

      {/* Filter Dropdown - Positioned absolutely to overlay content */}
      {filterVisible && (
        <View 
          className="absolute left-4 right-4 p-4 bg-white rounded-bl-[12] rounded-br-[12] shadow-lg z-50"
          style={{
            top: filterButtonLayout.y + filterButtonLayout.height ,
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
        </View>
      )}

      {/* Exercise List */}
      <View className='bg-[#42779F] shadow-lg mx-4 rounded-b-[12] flex-1'>
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {filteredExercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              className="bg-white rounded-xl overflow-hidden mb-4"
              onPress={() => handleWorkoutPress(exercise.id)}
            >
              <Image
                source={{ uri: exercise.image }}
                className="w-full h-40"
                resizeMode="cover"
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
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default LibraryScreen;