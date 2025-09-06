import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateTDEEAndMacros } from '../../utils/calculateTDEEandMacros';
import type { ActivityLevel } from '../../utils/calculateTDEEandMacros';
import { FIRESTORE_DB } from '~/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';
import { useUserStore } from '~/store/useUserStore';

export type EditNutritionPlanBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type Props = {
  onUpdate: (tdee: number, protein: number, carbs: number, fat: number) => void;
};

type UserInput = {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activity: ActivityLevel;
  goal: 'lose weight' | 'maintain weight' | 'gain muscle';
};

const activityLevelLabels = [
  { label: 'Sedentary (Not or Barely exercise)', value: 'sedentary' },
  { label: 'Lightly Active (Exercise 1-3 days)', value: 'lightly active' },
  { label: 'Moderately Active (Exercise 3-5 days)', value: 'moderately active' },
  { label: 'Very Active (Exercise 6-7 days)', value: 'very active' },
  { label: 'Super Active (Exercise in morning and evening)', value: 'super active' },
];

const fitnessGoalLabels = [
  { label: 'Lose Weight', value: 'lose weight' },
  { label: 'Maintain Weight', value: 'maintain weight' },
  { label: 'Gain Muscle', value: 'gain muscle' },
];

const EditNutritionPlanBottomSheet = forwardRef<EditNutritionPlanBottomSheetRef, Props>(
  ({ onUpdate }, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = ['90%'];
    const { user } = useUser();
    const userId = user?.id;

    const loadUserData = useUserStore((state) => state.loadUserDataFromFirestore);
    const setUserData = useUserStore((state) => state.setUserData);

    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [activityIndex, setActivityIndex] = useState(2);
    const [goal, setGoal] = useState<'lose weight' | 'maintain weight' | 'gain muscle'>(
      'maintain weight'
    );

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    useImperativeHandle(ref, () => ({
      present: async () => {
        if (userId) {
          await loadUserData(userId);
          const latest = useUserStore.getState().user;

          if (latest) {
            setAge(latest.age?.toString() || '');
            setGender(latest.gender || 'male');
            setWeight(latest.weight?.toString() || '');
            setHeight(latest.height?.toString() || '');
            const index = activityLevelLabels.findIndex(
              (a) => a.value === latest.activity
            );
            setActivityIndex(index >= 0 ? index : 2);
            setGoal(latest.goal || 'maintain weight');
          }
        }

        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));


    const calculateAndSave = async () => {
      if (!userId) {
        Alert.alert('Error', 'User not found');
        return;
      }

      try {
        const userData: UserInput = {
          age: parseInt(age),
          gender,
          weight: parseFloat(weight),
          height: parseFloat(height),
          activity: activityLevelLabels[activityIndex].value as ActivityLevel,
          goal,
        };

        const result = calculateTDEEAndMacros(userData);

        const payload = {
          ...result,
          createdAt: new Date().toISOString(),
        };

        // Save nutrition plan
        await setDoc(doc(FIRESTORE_DB, 'users', userId, 'nutrition', 'plan'), payload);

        // Save user profile
        await setDoc(
          doc(FIRESTORE_DB, 'users', userId),
          {
            ...userData,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        // Local storage
        await AsyncStorage.setItem(
          'userNutritionProfile',
          JSON.stringify({ ...userData, activityIndex })
        );
        await AsyncStorage.setItem('nutritionGoals', JSON.stringify(result));

        setUserData(userData);

        onUpdate(result.adjustedTdee, result.protein, result.carbs, result.fat);

        bottomSheetRef.current?.dismiss();
      } catch (err) {
        console.error('Failed to save:', err);
        Alert.alert('Error', 'Failed to save profile and plan.');
      }
    };

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        enablePanDownToClose
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <BottomSheetView className="p-5">
            <Text className="text-xl font-bold mb-3">Edit Nutrition Plan</Text>

            <Text className="mb-1">Age</Text>
            <TextInput
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
              className="border px-3 py-2 rounded mb-3"
              placeholder="Enter your age"
              placeholderTextColor="#aaa"
            />

            <Text className="mb-1">Gender</Text>
            <View className="flex-row space-x-3 mb-3">
              {(['male', 'female'] as const).map((g) => (
                <TouchableOpacity key={g} onPress={() => setGender(g)}>
                  <Text
                    className={`px-4 py-2 mr-5 text-center rounded-full ${
                      gender === g ? 'bg-[#5FA3D6] text-white' : 'bg-gray-200'
                    }`}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="mb-1">Weight (kg)</Text>
            <TextInput
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              className="border px-3 py-2 rounded mb-3"
              placeholder="e.g. 70"
              placeholderTextColor="#aaa"
            />

            <Text className="mb-1">Height (cm)</Text>
            <TextInput
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
              className="border px-3 py-2 rounded mb-3"
              placeholder="e.g. 165"
              placeholderTextColor="#aaa"
            />

            <Text className="mb-1">Activity Level</Text>
            {activityLevelLabels.map((item, i) => (
              <TouchableOpacity key={item.value} onPress={() => setActivityIndex(i)} className="mb-2">
                <Text
                  className={`px-3 py-2 rounded ${
                    activityIndex === i ? 'bg-[#5FA3D6] text-white' : 'bg-gray-100'
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text className="mb-1 mt-3">Goal</Text>
            <View className="flex-row space-x-3 mb-3 flex-wrap">
              {fitnessGoalLabels.map(({ label, value }) => (
                <TouchableOpacity key={value} onPress={() => setGoal(value as any)}>
                  <Text
                    className={`px-3 py-1 mr-3 rounded-full mb-2 ${
                      goal === value ? 'bg-[#5FA3D6] text-white' : 'bg-gray-200'
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={calculateAndSave}
              className="bg-[#5FA3D6] mt-4 p-3 rounded-lg"
            >
              <Text className="text-white text-center font-bold">Calculate Nutrition Plan</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </TouchableWithoutFeedback>
      </BottomSheetModal>
    );
  }
);

export default EditNutritionPlanBottomSheet;
