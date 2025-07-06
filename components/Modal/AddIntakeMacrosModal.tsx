import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

export type AddIntakeMacrosModalRef = {
  present: () => void;
  dismiss: () => void;
};

type Props = {
  onSave: (protein: number, carbs: number, fat: number, calories?: number) => void;
};

export const AddIntakeMacrosModal = forwardRef<AddIntakeMacrosModalRef, Props>(
  ({ onSave }, ref) => {
    const sheetRef = useRef<BottomSheetModal>(null);

    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [quantity, setQuantity] = useState(1);

    const snapPoints = useMemo(() => ['70%'], []);

    const proteinTotal = (parseFloat(protein) || 0) * quantity;
    const carbsTotal = (parseFloat(carbs) || 0) * quantity;
    const fatTotal = (parseFloat(fat) || 0) * quantity;

    const calories = proteinTotal * 4 + carbsTotal * 4 + fatTotal * 9;

    useImperativeHandle(ref, () => ({
      present: () => {
        setProtein('');
        setCarbs('');
        setFat('');
        setQuantity(1);
        sheetRef.current?.present();
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
      },
    }));

    const handleSave = useCallback(() => {
      onSave(proteinTotal, carbsTotal, fatTotal, calories);
      setProtein('');
      setCarbs('');
      setFat('');
      setQuantity(1);
      sheetRef.current?.dismiss();
    }, [proteinTotal, carbsTotal, fatTotal, calories, onSave]);

    const incrementQuantity = () => setQuantity((q) => q + 1);
    const decrementQuantity = () =>
      setQuantity((q) => (q > 1 ? q - 1 : 1));

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        index={1}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        android_keyboardInputMode="adjustResize"
      >
        <BottomSheetView>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
              style={{ padding: 20 }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                Add Intake
              </Text>

              {/* Macro Inputs */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ marginBottom: 6 }}>Protein (g)</Text>
                <TextInput
                  style={{
                    backgroundColor: '#eee',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16,
                  }}
                  keyboardType="numeric"
                  placeholder="Per quantity"
                  placeholderTextColor="#999"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>

              {/* Carbs Input */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ marginBottom: 6 }}>Carbs (g)</Text>
                <TextInput
                  style={{
                    backgroundColor: '#eee',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16,
                  }}
                  keyboardType="numeric"
                  placeholder="Per quantity"
                  placeholderTextColor="#999"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>

              {/* Fat Input */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ marginBottom: 6 }}>Fat (g)</Text>
                <TextInput
                  style={{
                    backgroundColor: '#eee',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16,
                  }}
                  keyboardType="numeric"
                  placeholder="Per quantity"
                  placeholderTextColor="#999"
                  value={fat}
                  onChangeText={setFat}
                />
              </View>

              {/* Quantity Control */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginBottom: 6 }}>Quantity</Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <TouchableOpacity
                    onPress={decrementQuantity}
                    style={{
                      backgroundColor: '#ccc',
                      padding: 10,
                      borderRadius: 8,
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', minWidth: 30, textAlign: 'center' }}>
                    {quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={incrementQuantity}
                    style={{
                      backgroundColor: '#ccc',
                      padding: 10,
                      borderRadius: 8,
                      marginLeft: 10,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ marginBottom: 16, fontWeight: '500' }}>
                Total Calories: {calories.toFixed(0)} kcal
              </Text>

              <TouchableOpacity
                onPress={handleSave}
                style={{
                  backgroundColor: '#42779F',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);
