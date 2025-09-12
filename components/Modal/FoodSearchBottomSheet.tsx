import React, {
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { FIRESTORE_DB } from '~/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useUser } from '@clerk/clerk-expo';

type Food = {
  name_en: string;
  name_th: string;
  protein: number;
  category: string;
  carbs: number;
  fat: number;
  calories: number;
  serving_size: string;
};

type SelectedFood = Food & { quantity: number };
type Props = { onSelect: (foods: SelectedFood[]) => void; };

export type FoodSearchBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

const categories = [
  { id: 'all', name: 'All' },
  { id: 'fruit', name: 'Fruit' },
  { id: 'main', name: 'Main Dish' },
  { id: 'grains', name: 'Grains' },
  { id: 'dessert', name: 'Dessert' },
] as const;

type Category = 'all' | 'fruit' | 'main' | 'grains' | 'dessert';

const CATEGORY_LABEL: Record<Category, string> = {
  all: 'All',
  fruit: 'Fruit',
  main: 'Main Dish',
  grains: 'Grains',
  dessert: 'Dessert',
};

const toCategoryId = (raw?: string): Exclude<Category, 'all'> | null => {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  if (norm === 'fruit') return 'fruit';
  if (norm === 'main dish') return 'main';
  if (norm === 'grains') return 'grains';
  if (norm === 'dessert') return 'dessert';
  return null;
};

const FoodSearchBottomSheet = forwardRef<FoodSearchBottomSheetRef, Props>(
  ({ onSelect }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);
    const [foods, setFoods] = useState<Food[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category>('all');

    const snapPoints = useMemo(() => ['90%'], []);
    const { user } = useUser();
    const userId = user?.id;

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    useEffect(() => {
      const fetchFoods = async () => {
        try {
          const snapshot = await getDocs(collection(FIRESTORE_DB, 'foods'));
          const data = snapshot.docs.map((doc) => doc.data() as Food);
          setFoods(data);
        } catch (err) {
          console.error('Error fetching foods:', err);
          setError('Failed to load foods.');
        } finally {
          setLoading(false);
        }
      };
      fetchFoods();
    }, []);

    const filteredFoods = useMemo(() => {
      const s = search.trim().toLowerCase();
      return foods.filter((f) => {
        const foodCatId = toCategoryId(f.category);
        const matchesCategory =
          selectedCategory === 'all' || foodCatId === selectedCategory;
        const matchesSearch =
          s === '' ||
          f.name_en?.toLowerCase().includes(s) ||
          f.name_th?.toLowerCase().includes(s);
        return matchesCategory && matchesSearch;
      });
    }, [foods, search, selectedCategory]);

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

    const handleSelectFood = (food: Food) => {
      setSelectedFoods((prev) => {
        const index = prev.findIndex((f) => f.name_en === food.name_en);
        if (index !== -1) {
          const updated = [...prev];
          updated[index].quantity += 1;
          return updated;
        }
        return [...prev, { ...food, quantity: 1 }];
      });
    };

    const handleRemoveFood = (index: number) => {
      setSelectedFoods((prev) => prev.filter((_, i) => i !== index));
    };

    const handleConfirmSelection = async () => {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      onSelect(selectedFoods);
      setSelectedFoods([]);
      sheetRef.current?.dismiss();
    };

    const Header = (
      <View className="px-4 pt-2 pb-3">
        <Text className="text-xl font-bold mb-4 text-center">Search Food</Text>
        <TextInput
          placeholder="Search food..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          className="border p-3 rounded-md mb-3"
        />
        <View className="flex-row flex-wrap mb-1">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              className={`px-3 py-2 m-1 rounded-lg ${
                selectedCategory === cat.id ? 'bg-[#5FA3D6]' : 'bg-gray-200'
              }`}
              onPress={() => setSelectedCategory(cat.id as Category)}
            >
              <Text
                className={`${
                  selectedCategory === cat.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View className="items-center my-3">
            <ActivityIndicator size="large" color="#5FA3D6" />
          </View>
        )}
        {!!error && !loading && (
          <Text className="text-red-500 text-center my-2">{error}</Text>
        )}
      </View>
    );

    const Footer =
      selectedFoods.length === 0 ? (
        <View style={{ height: 16 }} />
      ) : (
        <View className="px-4 pt-6 pb-8 border-t mt-4">
          <Text className="font-bold mb-2 text-lg">Selected Foods</Text>

          {selectedFoods.map((food, index) => (
            <View
              key={`${food.name_en}-${index}`}
              className="flex-row justify-between items-center mb-2"
            >
              <View className="flex-1">
                <Text className="text-sm text-gray-700">
                  • {food.name_en} ({(food.calories * food.quantity).toFixed(0)} kcal)
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => {
                    if (food.quantity === 1) {
                      handleRemoveFood(index);
                    } else {
                      setSelectedFoods((prev) => {
                        const updated = [...prev];
                        updated[index].quantity -= 1;
                        return updated;
                      });
                    }
                  }}
                  className="bg-gray-300 px-2 rounded mx-1"
                >
                  <Text className="text-lg font-bold">−</Text>
                </TouchableOpacity>

                <Text className="text-md font-bold w-5 text-center">
                  {food.quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedFoods((prev) => {
                      const updated = [...prev];
                      updated[index].quantity += 1;
                      return updated;
                    });
                  }}
                  className="bg-gray-300 px-2 rounded mx-1"
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
      );

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        android_keyboardInputMode="adjustResize"
        enablePanDownToClose
        enableDismissOnClose
      >
        <BottomSheetFlatList
          data={loading || error ? [] : filteredFoods}
          keyExtractor={(item) => item.name_en}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectFood(item)}
              className="py-3 px-4 border-b border-gray-200"
            >
              <View className="flex-row justify-between items-start">
                <View style={{ flexShrink: 1 }} className="pr-2">
                  <Text className="font-bold text-[#142939] text-lg" numberOfLines={2}>
                    {item.name_en}
                  </Text>
                  <Text className="font-bold text-[#142939] text-md" numberOfLines={2}>
                    {item.name_th}
                  </Text>
                  {!!item.category && (
                    <Text className="text-gray-500 text-xs mt-1">{item.category}</Text>
                  )}
                </View>
                <Text className="font-bold text-[#142939] text-lg" style={{ textAlign: 'right' }}>
                  {item.serving_size}
                </Text>
              </View>

              <Text className="text-gray-600 text-sm mt-1">
                Protein: {item.protein}g | Carbs: {item.carbs}g | Fat: {item.fat}g | Calories: {item.calories}
              </Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          ListEmptyComponent={
            !loading && !error ? (
              <Text className="text-center text-gray-500 mt-8">
                No foods found for “{search || '—'}” in {CATEGORY_LABEL[selectedCategory]}
              </Text>
            ) : null
          }
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </BottomSheetModal>
    );
  }
);

export default FoodSearchBottomSheet;
