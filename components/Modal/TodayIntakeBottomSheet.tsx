import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useMemo,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useUser } from '@clerk/clerk-expo';
import { FIRESTORE_DB } from '~/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import dayjs from 'dayjs';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export type TodayIntakeBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type FoodEntry = {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  quantity: number;
  type: string;
};

const TodayIntakeBottomSheet = forwardRef<TodayIntakeBottomSheetRef>((_, ref) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);
  const { user } = useUser();
  const userId = user?.id;

  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [totals, setTotals] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetRef.current?.present();
      loadTodayIntake();
    },
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const loadTodayIntake = async () => {
    setLoading(true);
    setError('');
    setEntries([]);
    setTotals({ protein: 0, carbs: 0, fat: 0, calories: 0 });

    if (!userId) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    const today = dayjs().format('YYYY-MM-DD');
    const docRef = doc(FIRESTORE_DB, 'users', userId, 'dietlog', today);

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEntries(data.entries || []);
        setTotals({
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          calories: data.calories || 0,
        });
      } else {
        setEntries([]);
        setTotals({ protein: 0, carbs: 0, fat: 0, calories: 0 });
      }
    } catch (err) {
      console.error('Failed to load today intake:', err);
      setError('Failed to load intake.');
    } finally {
      setLoading(false);
    }
  };

  const iconFor = (category?: string) => {
  const c = (category || '').toLowerCase();

  if (c === 'grains') {
    return <FontAwesome6 name="bowl-rice" size={20} color="#5FA3D6" />;
  }
    if (c === 'manual') {
    return <FontAwesome6 name="pencil" size={20} color="#5FA3D6" />;
  }
  if (c === 'main dish') {
    return <Ionicons name="restaurant" size={20} color="#5FA3D6" />;
  }
  if (c === 'fruit') {
    return <Ionicons name="nutrition" size={20} color="#5FA3D6" />;
  }
  if (c === 'dessert') {
    return <Ionicons name="ice-cream" size={20} color="#5FA3D6" />;
  }
  return <Ionicons name="help-circle-outline" size={20} color="#5FA3D6" />;
};

    const bottomSheetHeight = SCREEN_HEIGHT * 0.9;
    const headerHeight = 180; 
    const footerHeight = entries.length > 0 ? 250 : 0; 
    const availableHeight = bottomSheetHeight - headerHeight - footerHeight - 20; 

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
      <BottomSheetView className="px-4 py-4 flex-1">
        <Text className="text-xl font-bold mb-4 text-center">Today's Food Intake</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5FA3D6" />
        ) : error ? (
          <Text className="text-center text-red-500">{error}</Text>
        ) : entries.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-center text-gray-500">No food logged for today.</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={entries}
              style={{ flex: 1, height: Math.max(availableHeight, 200) }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="mb-3 border-b pb-2 border-gray-200">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-[#142939] text-base">{item.name}</Text>
                    {iconFor(item.type)}
                  </View>
                  <Text className="text-sm text-gray-700">
                    Quantity: {item.quantity} | Calories: {item.calories.toFixed(0)} kcal
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Protein: {item.protein.toFixed(1)}g | Carbs: {item.carbs.toFixed(1)}g | Fat: {item.fat.toFixed(1)}g
                  </Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />

            <View className="bg-[#d4dde4] rounded-md p-3 mt-4">
              <Text className="text-black font-bold text-md">
                Total Protein: {totals.protein.toFixed(1)}g | Carbs: {totals.carbs.toFixed(1)}g | Fat: {totals.fat.toFixed(1)}g
              </Text>
              <Text className="text-black font-bold text-lg">
                Total Calories: {totals.calories.toFixed(0)}
              </Text>
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default TodayIntakeBottomSheet;
