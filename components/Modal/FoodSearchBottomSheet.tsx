import React, { useState, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

type Food = {
  name_en: string;
  name_th: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  serving_size: string;
};

type SelectedFood = Food & { quantity: number };

type Props = {
  onSelect: (foods: SelectedFood[]) => void;
};

export type FoodSearchBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

const sampleFoods: Food[] = [
  { name_en: 'Boiled Egg', name_th: 'ไข่ต้ม', protein: 7, carbs: 0, fat: 6, calories: 82, serving_size: '1 egg' },
  { name_en: 'Banana', name_th: 'กล้วย', protein: 1, carbs: 27, fat: 0.3, calories: 105, serving_size: '100 g' },
  { name_en: 'Chicken Breast', name_th: 'อกไก่ต้ม', protein: 31, carbs: 0, fat: 3.6, calories: 165, serving_size: '100 g' },
  { name_en: 'Brown Rice', name_th: 'ข้าวกล้อง', protein: 2.6, carbs: 23, fat: 0.9, calories: 111, serving_size: '1 cup' },
  { name_en: 'Apple', name_th: 'แอปเปิ้ล', protein: 0.3, carbs: 25, fat: 0.2, calories: 95, serving_size: '100 g' },
  { name_en: 'Grill CHicken Breast', name_th: 'อกไก่ย่าง', protein: 32.1, carbs: 0, fat: 3.2, calories: 157, serving_size: '100 g' },
];

const FoodSearchBottomSheet = forwardRef<FoodSearchBottomSheetRef, Props>(({ onSelect }, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
  const snapPoints = useMemo(() => ['90%'], []);

  const filteredFoods = useMemo(() => {
    return sampleFoods.filter((f) =>
      f.name_en.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const totals = useMemo(() => {
    return selectedFoods.reduce(
      (acc, food) => {
        acc.protein += food.protein * food.quantity;
        acc.carbs += food.carbs * food.quantity;
        acc.fat += food.fat * food.quantity;
        acc.calories += food.calories * food.quantity;
        return acc;
      },
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    );
  }, [selectedFoods]);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const handleSelectFood = (food: Food) => {
    setSelectedFoods((prev) => {
      const index = prev.findIndex((f) => f.name_en === food.name_en);
      if (index !== -1) {
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      } else {
        return [...prev, { ...food, quantity: 1 }];
      }
    });
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSelection = () => {
    onSelect(selectedFoods);
    setSelectedFoods([]);
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      android_keyboardInputMode="adjustResize"
      enablePanDownToClose
      enableDismissOnClose
    >
      <BottomSheetView className="px-4 py-2 flex-1">
        <Text className="text-xl font-bold mb-4 text-center">Search Food</Text>
        <TextInput
          placeholder="Search food..."
          value={search}
          onChangeText={setSearch}
          className="border p-3 rounded-md mb-4"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.name_en}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectFood(item)}
              className="py-3 px-2 border-b border-gray-200"
            >
              <View className="flex-row justify-between">
                <View>
                  <Text className="font-bold text-[#142939] text-lg">{item.name_en}</Text>
                  <Text className="font-bold text-[#142939] text-md">{item.name_th}</Text>
                </View>
                <Text className="font-bold text-[#142939] text-lg">{item.serving_size}</Text>
              </View>
              <Text className="text-gray-600 text-sm mt-1">
                Protein: {item.protein}g | Carbs: {item.carbs}g | Fat: {item.fat}g | Calories: {item.calories}
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />

        {selectedFoods.length > 0 && (
          <View className="mt-6 border-t pt-4">
            <Text className="font-bold mb-2 text-lg">Selected Foods</Text>

            {selectedFoods.map((food, index) => (
              <View key={index} className="flex-row justify-between items-center mb-2">
                <View className="flex-1">
                  <Text className="text-sm text-gray-700">
                    • {food.name_en} ({food.calories * food.quantity} kcal)
                  </Text>
                </View>

                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity
                    onPress={() => {
                      if (food.quantity === 1) {
                        handleRemoveFood(index);
                      } else {
                        setSelectedFoods(prev => {
                          const updated = [...prev];
                          updated[index].quantity -= 1;
                          return updated;
                        });
                      }
                    }}
                    className="bg-gray-300 px-2 rounded"
                  >
                    <Text className="text-lg font-bold">−</Text>
                  </TouchableOpacity>

                  <Text className="text-md font-bold w-5 text-center">{food.quantity}</Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFoods(prev => {
                        const updated = [...prev];
                        updated[index].quantity += 1;
                        return updated;
                      });
                    }}
                    className="bg-gray-300 px-2 rounded"
                  >
                    <Text className="text-lg font-bold">+</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleRemoveFood(index)} className="ml-2">
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View className="bg-[#d4dde4] rounded-md p-2 mt-2">
              <Text className="text-black font-bold text-md">
                Total Protein: {totals.protein.toFixed(1)}g | Carbs: {totals.carbs.toFixed(1)}g | Fat: {totals.fat.toFixed(1)}g
              </Text>
              <Text className="text-black font-bold text-lg">
                Total Calories: {totals.calories.toFixed(0)}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-[#5FA3D6] p-3 rounded-md mt-4"
              onPress={handleConfirmSelection}
            >
              <Text className="text-white font-bold text-center">
                Add Intake ({selectedFoods.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default FoodSearchBottomSheet;
