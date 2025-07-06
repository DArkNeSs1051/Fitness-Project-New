import React, {
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateTDEEAndMacros } from '../../utils/calculateTDEEandMacros';

export type EditNutritionPlanBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type Props = {
  onUpdate: (
    tdee: number,
    protein: number,
    carbs: number,
    fat: number
  ) => void;
};

const activityLevelLabels = [
  { label: 'Sedentary (Not or Barely exercise)', value: 'sedentary' },
  { label: 'Lightly Active (Exercise 1-3 days)', value: 'lightly_active' },
  { label: 'Moderately Active (Exercise 3-5 days)', value: 'moderately_active' },
  { label: 'Very Active (Exercise 6-7 days)', value: 'very_active' },
  { label: 'Super Active (Exercise in morning and evening)', value: 'super_active' },
];

const fitnessGoalLabels = [
  { label: 'Weight Loss', value: 'weight_loss' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Muscle Gain', value: 'muscle_gain' },
];

const EditNutritionPlanBottomSheet = forwardRef<
  EditNutritionPlanBottomSheetRef,
  Props
>(({ onUpdate }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = ['90%'];

  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityIndex, setActivityIndex] = useState(2);
  const [goal, setGoal] = useState<'weight_loss' | 'maintenance' | 'muscle_gain'>('maintenance');

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  useEffect(() => {
    const load = async () => {
      const saved = await AsyncStorage.getItem('userNutritionProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        setAge(profile.age.toString());
        setGender(profile.gender);
        setWeight(profile.weight.toString());
        setHeight(profile.height.toString());
        setActivityIndex(profile.activityIndex);
        setGoal(profile.goal);
      }
    };
    load();
  }, []);

  const calculateAndSave = async () => {
    const user = {
      age: parseInt(age),
      gender,
      weight: parseFloat(weight),
      height: parseFloat(height),
      activityLevel: activityLevelLabels[activityIndex].value as any,
      goal,
    };

    const result = calculateTDEEAndMacros(user);

    await AsyncStorage.setItem(
      'userNutritionProfile',
      JSON.stringify({ ...user, activityIndex })
    );
    await AsyncStorage.setItem('nutritionGoals', JSON.stringify(result));

    onUpdate(result.adjustedTdee, result.protein, result.carbs, result.fat);
    bottomSheetRef.current?.close();
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
        <BottomSheetView className='p-5'>
          <Text className="text-xl font-bold mb-3">Edit Nutrition Plan</Text>

          {/* Age */}
          <Text className="mb-1">Age</Text>
          <TextInput
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            className="border px-3 py-2 rounded mb-3"
          />

          {/* Gender */}
          <Text className="mb-1">Gender</Text>
          <View className="flex-row space-x-3 mb-3">
            {['male', 'female'].map((g) => (
              <TouchableOpacity className='flex-1 mr-5' key={g} onPress={() => setGender(g as any)}>
                <Text className={`px-2 py-2 text-center rounded-full ${gender === g ? 'bg-[#5FA3D6] text-white' : 'bg-gray-200'}`}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weight */}
          <Text className="mb-1">Weight (kg)</Text>
          <TextInput
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
            className="border px-3 py-2 rounded mb-3"
          />

          {/* Height */}
          <Text className="mb-1">Height (cm)</Text>
          <TextInput
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            className="border px-3 py-2 rounded mb-3"
          />

          {/* Activity Level */}
          <Text className="mb-1">Activity Level</Text>
          {activityLevelLabels.map((item, i) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => setActivityIndex(i)}
              className="mb-2"
            >
              <Text className={`px-3 py-2 rounded ${activityIndex === i ? 'bg-[#5FA3D6] text-white' : 'bg-gray-100'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Fitness Goal */}
          <Text className="mb-1 mt-3">Goal</Text>
          <View className="flex-row space-x-3 mb-3 flex-wrap">
            {fitnessGoalLabels.map(({ label, value }) => (
              <TouchableOpacity className='mr-4' key={value} onPress={() => setGoal(value)}>
                <Text className={`px-3 py-1 rounded-full mb-2 ${goal === value ? 'bg-[#5FA3D6] text-white' : 'bg-gray-200'}`}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
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
});

export default EditNutritionPlanBottomSheet;
