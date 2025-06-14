import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Keyboard, TouchableWithoutFeedback, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '~/utils/shadow';

const DietPlanScreen = () => {
  const TDEE = 2500;
  const proteinGoal = 150;
  const carbGoal = 300;
  const fatGoal = 80;

  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);

  // Load saved values on startup
  useEffect(() => {
    const loadData = async () => {
      const savedProtein = await AsyncStorage.getItem('protein') || '';
      const savedCarbs = await AsyncStorage.getItem('carbs') || '';
      const savedFat = await AsyncStorage.getItem('fat') || '';
      setProtein(savedProtein);
      setCarbs(savedCarbs);
      setFat(savedFat);
    };
    loadData();
  }, []);

  // Update total calories when values change
  useEffect(() => {
    const proteinCalories = (parseFloat(protein) || 0) * 4;
    const carbCalories = (parseFloat(carbs) || 0) * 4;
    const fatCalories = (parseFloat(fat) || 0) * 9;
    setTotalCalories(proteinCalories + carbCalories + fatCalories);
  }, [protein, carbs, fat]);

  // Save input values
  const saveData = async () => {
    try {
      await AsyncStorage.setItem('protein', protein);
      await AsyncStorage.setItem('carbs', carbs);
      await AsyncStorage.setItem('fat', fat);
      Alert.alert('Success', 'Your macros have been saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your data.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 pt-4 bg-[#84BDEA] px-4">
        <Text className="text-3xl font-bold text-[#142939]">Diet Plan</Text>
        <Text className="text-[#142939] mt-1">Track your daily macros</Text>

        <View className="bg-white p-4 rounded-xl mt-4" style={shadows.medium}>
          <Text className="text-xl font-bold text-[#142939]">TDEE Goal: {TDEE} kcal</Text>
          <Text className="text-lg text-gray-600 mt-1">Total Calories: {totalCalories} kcal</Text>
          <View className="h-2 bg-gray-300 rounded-full overflow-hidden mt-2">
            <View style={{ width: `${Math.min((totalCalories / TDEE) * 100, 100)}%` }} className="h-full bg-[#5FA3D6]" />
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl mt-4 " style={shadows.medium}>
          <Text className="text-lg font-bold text-[#142939]">Macronutrient Goals</Text>
          <Text className="text-md text-gray-600 mt-1">
            Protein: <Text className='font-bold text-[#5FA3D6]'>{proteinGoal}g</Text> | 
            Carbs: <Text className='font-bold text-[#5FA3D6]'>{carbGoal}g</Text> | 
            Fat: <Text className='font-bold text-[#5FA3D6]'>{fatGoal}g</Text>
          </Text>
        </View>

        <View className="bg-white p-4 rounded-xl mt-4 " style={shadows.medium}>
          <Text className="text-lg font-bold text-[#142939]">Record Intake</Text>
          {[['Protein', protein, setProtein, proteinGoal], ['Carbs', carbs, setCarbs, carbGoal], ['Fat', fat, setFat, fatGoal]].map(([label, value, setValue, goal], index) => (
            <View key={index} className="mb-3">
              <Text className="text-[#142939] font-medium">{label} (g): <Text className='text-[#5FA3D6] font-bold'>{value || 0}/{goal}g</Text></Text>
              <View className="h-2 bg-gray-300 rounded-full overflow-hidden mt-1">
                <View style={{ width: `${goal > 0 ? Math.min((parseFloat(value) || 0) / goal * 100, 100) : 0}%` }} className="h-full bg-[#5FA3D6]" />
              </View>
              <View className="flex-row items-center mt-2 bg-gray-100 rounded-lg px-3">
                <TextInput
                  className="flex-1 py-2 px-3 bg-gray-100 rounded-lg"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                  placeholder="Enter grams"
                  placeholderTextColor="#999"
                />
                {value.length > 0 && (
                  <TouchableOpacity onPress={() => setValue('')} className="ml-2">
                    <Ionicons name="close-circle" size={24} color="gray" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={saveData} className="bg-[#42779F] p-3 rounded-lg mt-4" style={shadows.large}>
          <Text className="text-white text-center font-bold">Save</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DietPlanScreen;
