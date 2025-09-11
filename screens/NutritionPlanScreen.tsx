import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shadows } from '~/utils/shadow';
import { AddIntakeMacrosModal, AddIntakeMacrosModalRef } from '~/components/Modal/AddIntakeMacrosModal';
import FoodSearchBottomSheet, { FoodSearchBottomSheetRef } from '~/components/Modal/FoodSearchBottomSheet';
import EditNutritionPlanBottomSheet, { EditNutritionPlanBottomSheetRef } from '~/components/Modal/EditNutritionPlanBottomSheet';
import TodayIntakeBottomSheet, {TodayIntakeBottomSheetRef} from '~/components/Modal/TodayIntakeBottomSheet';
import { FIRESTORE_DB } from '~/firebase';
import { FIREBASE_AUTH } from '~/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';

type Food = {
  name_en: string;
  name_th: string;
  category:string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const NutritionPlanScreen = () => {
  const [dailyProtein, setDailyProtein] = useState(0);
  const [dailyCarbs, setDailyCarbs] = useState(0);
  const [dailyFat, setDailyFat] = useState(0);
  const [dailyTotalCalories, setDailyTotalCalories] = useState(0);
  const [tdeeGoal, setTdeeGoal] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useUser();
  const userId = user?.id;

  const macrosmodalRef = useRef<AddIntakeMacrosModalRef>(null);
  const foodSheetRef = useRef<FoodSearchBottomSheetRef>(null);
  const editPlanRef = useRef<EditNutritionPlanBottomSheetRef>(null);
  const todaymodalref = useRef<TodayIntakeBottomSheetRef>(null);

  const openMacrosModal = () => macrosmodalRef.current?.present();
  const openSearchSheet = () => foodSheetRef.current?.present();
  const openEditSheet = () => editPlanRef.current?.present();
  const openFoodHistorty = () => todaymodalref.current?.present(); 

  const loadData = async () => {
    if (!userId || !FIREBASE_AUTH.currentUser) {
      setLoading(false);
      return;
    }

    // Only proceed if auth is ready and user matches
    if (FIREBASE_AUTH.currentUser.uid !== userId) {
      console.warn("Auth not ready or mismatched user");
      return;
    }

    setLoading(true);

  try {
    const today = getLocalDateString(); 

    const dietlogRef = doc(FIRESTORE_DB, 'users', userId, 'dietlog', today);
    const dietlogSnap = await getDoc(dietlogRef);

    if (dietlogSnap.exists()) {
      const data = dietlogSnap.data();
      setDailyProtein(data.protein ?? 0);
      setDailyCarbs(data.carbs ?? 0);
      setDailyFat(data.fat ?? 0);
      setDailyTotalCalories(data.calories ?? 0);
    } else {
        // It's a new day — reset by creating new document
        await setDoc(dietlogRef, {
          protein: 0,
          carbs: 0,
          fat: 0,
          calories: 0,
          entries: [],
          createdAt: new Date().toISOString(),
        });

        setDailyProtein(0);
        setDailyCarbs(0);
        setDailyFat(0);
        setDailyTotalCalories(0);
     }


    // Load nutrition plan (goals)
    const planRef = doc(FIRESTORE_DB, 'users', userId, 'nutrition', 'plan');
    const docSnap = await getDoc(planRef);
    if (docSnap.exists()) {
      const { adjustedTdee, protein, carbs, fat } = docSnap.data();
      setTdeeGoal(adjustedTdee);
      setProteinGoal(protein);
      setCarbGoal(carbs);
      setFatGoal(fat);
      setHasPlan(true);
    } else {
      setHasPlan(false);
      setTdeeGoal(0);
      setProteinGoal(0);
      setCarbGoal(0);
      setFatGoal(0);
    }
  } catch (error) {
    console.error('Error loading nutrition plan:', error);
    Alert.alert('Error', 'Failed to load nutrition plan');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadData();
  }, [userId]);

  const handleUpdatePlan = async (
    tdee: number,
    protein: number,
    carbs: number,
    fat: number
  ) => {
    setTdeeGoal(tdee);
    setProteinGoal(protein);
    setCarbGoal(carbs);
    setFatGoal(fat);
    setHasPlan(true);

    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    try {
      const planRef = doc(FIRESTORE_DB, 'users', userId, 'nutrition', 'plan');
      await setDoc(planRef, {
        adjustedTdee: tdee,
        protein,
        carbs,
        fat,
        createdAt: new Date().toISOString(),
      });

      await AsyncStorage.setItem('nutritionGoals', JSON.stringify({
        adjustedTdee: tdee,
        protein,
        carbs,
        fat,
      }));

      await loadData();
      Alert.alert('Saved', 'Nutrition plan has been generated!');
    } catch (error) {
      console.error('Error updating nutrition plan:', error);
      Alert.alert('Error', 'Failed to update nutrition plan');
    }
  };

const handleSaveIntake = async (
  protein: number,
  carbs: number,
  fat: number,
  calories?: number,
  name = 'Manual Intake' 
) => {
  if (!userId) {
    Alert.alert('Error', 'User not logged in');
    return;
  }

  const finalCalories = calories ?? (protein * 4 + carbs * 4 + fat * 9);
  const today = getLocalDateString();

  const intakeDocRef = doc(FIRESTORE_DB, 'users', userId, 'dietlog', today);

  try {
    const docSnap = await getDoc(intakeDocRef);
    let newProtein = protein;
    let newCarbs = carbs;
    let newFat = fat;
    let newCalories = finalCalories;
    let newEntries = [
      {
        id: `manual-${Date.now()}`,
        name,
        protein,
        carbs,
        fat,
        calories: finalCalories,
      },
    ];

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Add current totals to new totals
      newProtein += data.protein || 0;
      newCarbs += data.carbs || 0;
      newFat += data.fat || 0;
      newCalories += data.calories || 0;

      // Add previous entries and append new entry
      newEntries = [...(data.entries || []), ...newEntries];

      // Update document
      await setDoc(intakeDocRef, {
        protein: newProtein,
        carbs: newCarbs,
        fat: newFat,
        calories: newCalories,
        entries: newEntries,
      });
    } else {
      // Create new document
      await setDoc(intakeDocRef, {
        protein: newProtein,
        carbs: newCarbs,
        fat: newFat,
        calories: newCalories,
        entries: newEntries,
      });
    }

    setDailyProtein(newProtein);
    setDailyCarbs(newCarbs);
    setDailyFat(newFat);
    setDailyTotalCalories(newCalories);

    macrosmodalRef.current?.dismiss();
    Alert.alert('Saved', 'Manual intake saved!');
  } catch (error) {
    console.error('Error saving manual intake:', error);
    Alert.alert('Error', 'Failed to save manual intake');
  }
};


  const handleFoodSelect = async (foods: (Food & { quantity: number })[]) => {
  const today = getLocalDateString();

  if (!userId) {
    Alert.alert('Error', 'User not logged in');
    return;
  }

  const intakeDocRef = doc(FIRESTORE_DB, 'users', userId, 'dietlog', today);

  try {
    const docSnap = await getDoc(intakeDocRef);

    let currentProtein = 0;
    let currentCarbs = 0;
    let currentFat = 0;
    let currentCalories = 0;
    let entries: any[] = [];

    if (docSnap.exists()) {
      const data = docSnap.data();
      currentProtein = data.protein || 0;
      currentCarbs = data.carbs || 0;
      currentFat = data.fat || 0;
      currentCalories = data.calories || 0;
      entries = data.entries || [];
    }

    const newEntries = foods.map((food) => {
      const calories = food.calories * food.quantity;
      const protein = food.protein * food.quantity;
      const carbs = food.carbs * food.quantity;
      const fat = food.fat * food.quantity;

      return {
        id: `food-${Date.now()}-${food.name_en}`,
        name: food.name_en,
        type: food.category,
        protein,
        carbs,
        fat,
        calories,
        quantity: food.quantity,
      };
    });

    const totals = newEntries.reduce(
      (acc, item) => {
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        acc.calories += item.calories;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );

    await setDoc(intakeDocRef, {
      protein: currentProtein + totals.protein,
      carbs: currentCarbs + totals.carbs,
      fat: currentFat + totals.fat,
      calories: currentCalories + totals.calories,
      entries: [...entries, ...newEntries],
    });

    setDailyProtein(currentProtein + totals.protein);
    setDailyCarbs(currentCarbs + totals.carbs);
    setDailyFat(currentFat + totals.fat);
    setDailyTotalCalories(currentCalories + totals.calories);

    foodSheetRef.current?.dismiss();
    Alert.alert('Saved', 'Foods added to your intake!');
  } catch (error) {
    console.error('Error saving food intake:', error);
    Alert.alert('Error', 'Failed to save intake');
  }
};


  const resetDailyTotals = () => {
  Alert.alert('Reset Daily Totals', 'Are you sure you want to reset today\'s totals?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Reset', style: 'destructive', onPress: async () => {
        const today = getLocalDateString();
        await AsyncStorage.removeItem(`dailyTotals_${today}`);
        setDailyProtein(0);
        setDailyCarbs(0);
        setDailyFat(0);
        setDailyTotalCalories(0);

        if (!userId) {
          Alert.alert('Error', 'User not logged in');
          return;
        }

        const dietlogDocRef = doc(FIRESTORE_DB, 'users', userId, 'dietlog', today);

        try {
          //Overwrite with empty data
          await setDoc(dietlogDocRef, {
            intakes: [],
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
            totalCalories: 0,
            updatedAt: new Date().toISOString(),
          });

          Alert.alert('Reset', 'Totals and diet log have been reset');
        } catch (error) {
          console.error('Failed to reset diet log in Firestore:', error);
          Alert.alert('Error', 'Failed to reset diet log');
        }
      }
    }
  ]);
};
  const getBarColor = (value: number, goal: number) => {
    if (value > goal) return 'bg-red-500';
    if (Math.abs(value - goal) < 1) return 'bg-green-600';
    return 'bg-[#5FA3D6]';
  };

  const getTextColor = (value: number, goal: number) => {
    if (value > goal) return 'text-red-600';
    if (Math.abs(value - goal) < 1) return 'text-green-600';
    return 'text-[#5FA3D6]';
  };


  const ProgressBars = useMemo(() => (
  <View className="mt-3">
    {[
      ['Protein', dailyProtein, proteinGoal],
      ['Carbs', dailyCarbs, carbGoal],
      ['Fat', dailyFat, fatGoal]
    ].map(([label, value, goal], idx) => {
      const progressPercent = Math.min((value as number) / (goal as number) * 100, 100);
      return (
        <View key={idx} className="mb-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">{label} Progress</Text>
            {(value as number) > (goal as number) && (
              <Text className="text-xs text-red-600 font-semibold">Exceeded!</Text>
            )}
          </View>
          <View className="h-2 bg-gray-300 rounded-full overflow-hidden mt-1">
            <View
              style={{ width: `${progressPercent}%` }}
              className={`h-full ${getBarColor(value as number, goal as number)}`}
            />
          </View>
          <Text className={`text-xs mt-0.5 ${getTextColor(value as number, goal as number)}`}>
            {(value as number).toFixed(1)}g / {goal}g
          </Text>
        </View>
      );
    })}
  </View>
), [dailyProtein, dailyCarbs, dailyFat, proteinGoal, carbGoal, fatGoal]);


  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#84BDEA]">
        <ActivityIndicator size="large" color="#5FA3D6" />
        <Text className="mt-2 text-[#142939] font-semibold">Loading nutrition plan...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 py-4 bg-[#84BDEA] px-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-3xl font-bold text-[#142939]">Nutrition Plan</Text>
            <Text className="text-[#142939] mt-1">Track your daily macros</Text>
          </View>
          {hasPlan && (
            <View className='flex-row items-center'>
              <TouchableOpacity className='mr-5' onPress={openEditSheet} style={shadows.medium}>
                <Text className='font-bold'>Edit Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetDailyTotals} style={shadows.medium}>
                <Ionicons name="refresh" size={24} color="#142939" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!hasPlan && (
          <View className="flex-1 mt-20 ">
            <View className="justify-center items-center mb-6">
              <Text>You didn't have nutrition plan yet.</Text>
              <Text>Please click "Generate Button" to get you nutrition plan.</Text>
            </View>
            
            <TouchableOpacity
              onPress={openEditSheet}
              className="bg-white p-5 rounded-xl"
              style={shadows.medium}
            >
              <Text className="text-center font-bold text-[#5FA3D6] text-lg">
                Generate Your Nutrition Plan
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPlan && (
          <View className="mt-4">
            <View className="bg-white p-4 rounded-xl" style={shadows.medium}>
              <Text className="text-xl font-bold text-[#142939]">
                TDEE Goal: {tdeeGoal} kcal
              </Text>
              <View className="flex-row justify-between items-center">
                <Text className={`text-lg mt-1 ${getTextColor(dailyTotalCalories, tdeeGoal)}`}>
                  Daily Total: {dailyTotalCalories.toFixed(0)} kcal
                </Text>
                {dailyTotalCalories > tdeeGoal && (
                  <Text className="text-xs text-red-600 font-semibold">Exceeded!</Text>
                )}
              </View>
              <View className="h-2 bg-gray-300 rounded-full overflow-hidden mt-2">
                <View
                  style={{ width: `${Math.min((dailyTotalCalories / tdeeGoal) * 100, 100)}%` }}
                  className={`h-full ${getBarColor(dailyTotalCalories, tdeeGoal)}`}
                />
              </View>
              <Text className={`text-xs mt-0.5 ${getTextColor(dailyTotalCalories, tdeeGoal)}`}>
                {`${dailyTotalCalories.toFixed(0)} kcal / ${tdeeGoal} kcal`}
              </Text>
            </View>


            <View className="bg-white p-4 rounded-xl mt-4" style={shadows.medium}>
              <Text className="text-lg font-bold text-[#142939]">Daily Progress</Text>
              <Text className="text-md text-gray-600 mt-1">
                Protein: <Text className={`font-bold ${getTextColor(dailyProtein, proteinGoal)}`}>{dailyProtein.toFixed(1)}g/{proteinGoal}g</Text> |
                Carbs: <Text className={`font-bold ${getTextColor(dailyCarbs, carbGoal)}`}>{dailyCarbs.toFixed(1)}g/{carbGoal}g</Text> |{'\n'}
                Fat: <Text className={`font-bold ${getTextColor(dailyFat, fatGoal)}`}>{dailyFat.toFixed(1)}g/{fatGoal}g</Text>
              </Text>

              {ProgressBars}
            </View>

            <TouchableOpacity onPress={openSearchSheet} className="flex-row items-center justify-center bg-[#2599f2] p-3 rounded-lg mt-4" style={shadows.large}>
              <Ionicons className='mr-2' name="add" size={20} color="white" />
              <Text className="text-white text-center font-bold">Add Food</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openMacrosModal} className="flex-row items-center justify-center bg-[#42779F] p-3 rounded-lg mt-4 mb-3" style={shadows.large}>
              <Ionicons className='mr-2' name="pencil" size={20} color="white" />
              <Text className="text-white text-center font-bold">Add manual intake</Text>
            </TouchableOpacity>
            <View className="flex-row items-center justify-end mr-1">
              <TouchableOpacity onPress={openFoodHistorty} className='flex-row p-2' style={shadows.medium}>
                <Ionicons className='mr-1' name="receipt" size={20} color="#142939" />
                <Text className="text-[#142939] font-bold">History</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <AddIntakeMacrosModal ref={macrosmodalRef} onSave={handleSaveIntake} />
        <FoodSearchBottomSheet ref={foodSheetRef} onSelect={handleFoodSelect} />
        <EditNutritionPlanBottomSheet ref={editPlanRef} onUpdate={handleUpdatePlan} />
        <TodayIntakeBottomSheet ref={todaymodalref}/>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default NutritionPlanScreen;
