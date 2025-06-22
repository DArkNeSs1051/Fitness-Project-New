// Full DietPlanScreen with modular FoodSearchBottomSheet
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, ScrollView, Text, Keyboard, TouchableWithoutFeedback, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shadows } from '~/utils/shadow';
import { AddIntakeMacrosModal, AddIntakeMacrosModalRef } from '~/components/Modal/AddIntakeMacrosModal';
import FoodSearchBottomSheet, { FoodSearchBottomSheetRef } from '~/components/Modal/FoodSearchBottomSheet';

const TDEE = 2500;
const proteinGoal = 150;
const carbGoal = 300;
const fatGoal = 80;

const DietPlanScreen = () => {
  const [dailyProtein, setDailyProtein] = useState(0);
  const [dailyCarbs, setDailyCarbs] = useState(0);
  const [dailyFat, setDailyFat] = useState(0);
  const [dailyTotalCalories, setDailyTotalCalories] = useState(0);

  const modalRef = useRef<AddIntakeMacrosModalRef>(null);
  const foodSheetRef = useRef<FoodSearchBottomSheetRef>(null);

  const openModal = () => modalRef.current?.present();
  const openSearchSheet = () => foodSheetRef.current?.present(); 
;

  useEffect(() => {
    const loadData = async () => {
      const today = new Date().toDateString();
      const saved = await AsyncStorage.getItem(`dailyTotals_${today}`);
      if (saved) {
        const { protein, carbs, fat, calories } = JSON.parse(saved);
        setDailyProtein(protein || 0);
        setDailyCarbs(carbs || 0);
        setDailyFat(fat || 0);
        setDailyTotalCalories(calories || 0);
      }
    };
    loadData();
  }, []);

  const handleSaveIntake = async (protein: number, carbs: number, fat: number) => {
    const calories = protein * 4 + carbs * 4 + fat * 9;
    const today = new Date().toDateString();
    const timestamp = new Date().toISOString();

    const newDailyProtein = dailyProtein + protein;
    const newDailyCarbs = dailyCarbs + carbs;
    const newDailyFat = dailyFat + fat;
    const newDailyCalories = dailyTotalCalories + calories;

    await AsyncStorage.setItem(`dailyTotals_${today}`, JSON.stringify({
      protein: newDailyProtein,
      carbs: newDailyCarbs,
      fat: newDailyFat,
      calories: newDailyCalories
    }));

    setDailyProtein(newDailyProtein);
    setDailyCarbs(newDailyCarbs);
    setDailyFat(newDailyFat);
    setDailyTotalCalories(newDailyCalories);

    modalRef.current?.dismiss();
    Alert.alert('Saved', 'Macro intake saved!');
  };

const handleFoodSelect = (foods: (Food & { quantity: number })[]) => {
  const totalProtein = foods.reduce((sum, f) => sum + (f.protein * f.quantity || 0), 0);
  const totalCarbs = foods.reduce((sum, f) => sum + (f.carbs * f.quantity || 0), 0);
  const totalFat = foods.reduce((sum, f) => sum + (f.fat * f.quantity || 0), 0);
  const totalCalories = foods.reduce((sum, f) => sum + (f.calories * f.quantity || 0), 0);

  handleSaveIntake(totalProtein, totalCarbs, totalFat, totalCalories);
  foodSheetRef.current?.dismiss();
};


  const resetDailyTotals = () => {
    Alert.alert('Reset Daily Totals', 'Are you sure you want to reset today\'s totals?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          const today = new Date().toDateString();
          await AsyncStorage.removeItem(`dailyTotals_${today}`);
          setDailyProtein(0);
          setDailyCarbs(0);
          setDailyFat(0);
          setDailyTotalCalories(0);
          Alert.alert('Reset', 'Totals have been reset');
        }
      }
    ]);
  };

  const ProgressBars = useMemo(() => (
    <View className="mt-3">
      {[
        ['Protein', dailyProtein, proteinGoal],
        ['Carbs', dailyCarbs, carbGoal],
        ['Fat', dailyFat, fatGoal]
      ].map(([label, value, goal], idx) => (
        <View key={idx} className="mb-2">
          <Text className="text-sm text-gray-600">{label} Progress</Text>
          <View className="h-2 bg-gray-300 rounded-full overflow-hidden mt-1">
            <View style={{ width: `${Math.min((value as number) / (goal as number) * 100, 100)}%` }} className="h-full bg-[#5FA3D6]" />
          </View>
        </View>
      ))}
    </View>
  ), [dailyProtein, dailyCarbs, dailyFat]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 py-4 bg-[#84BDEA] px-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-[#142939]">Diet Plan</Text>
            <Text className="text-[#142939] mt-1">Track your daily macros</Text>
          </View>
          <TouchableOpacity onPress={resetDailyTotals}>
            <Ionicons name="refresh" size={24} color="#142939" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
          <View className="bg-white p-4 rounded-xl" style={shadows.medium}>
            <Text className="text-xl font-bold text-[#142939]">TDEE Goal: {TDEE} kcal</Text>
            <Text className="text-lg text-gray-600 mt-1">Daily Total: {dailyTotalCalories.toFixed(0)} kcal</Text>
            <View className="h-2 bg-gray-300 rounded-full overflow-hidden mt-2">
              <View style={{ width: `${Math.min((dailyTotalCalories / TDEE) * 100, 100)}%` }} className="h-full bg-[#5FA3D6]" />
            </View>
          </View>

          <View className="bg-white p-4 rounded-xl mt-4" style={shadows.medium}>
            <Text className="text-lg font-bold text-[#142939]">Daily Progress</Text>
            <Text className="text-md text-gray-600 mt-1">
              Protein: <Text className='font-bold text-[#5FA3D6]'>{dailyProtein.toFixed(1)}g/{proteinGoal}g</Text> |
              Carbs: <Text className='font-bold text-[#5FA3D6]'>{dailyCarbs.toFixed(1)}g/{carbGoal}g</Text> |
              Fat: <Text className='font-bold text-[#5FA3D6]'>{dailyFat.toFixed(1)}g/{fatGoal}g</Text>
            </Text>
            {ProgressBars}
          </View>

          <TouchableOpacity onPress={() => {/* CalorieMama logic here */}} className="flex-row items-center justify-center bg-[##2599f2] p-3 rounded-lg mt-4" style={shadows.large}>
            <Ionicons className='mr-2' name="camera" size={20} color="white" />
            <Text className="text-white text-center font-bold">Scan with CalorieMama</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={openSearchSheet} className="flex-row items-center justify-center bg-[#42779F] p-3 rounded-lg mt-4 mb-10" style={shadows.large}>
            <Ionicons className='mr-2' name="add" size={20} color="white" />
            <Text className="text-white text-center font-bold">Add Food</Text>
          </TouchableOpacity>
        </ScrollView>

        <AddIntakeMacrosModal ref={modalRef} onSave={handleSaveIntake} />
        <FoodSearchBottomSheet ref={foodSheetRef} onSelect={handleFoodSelect} />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default DietPlanScreen;
