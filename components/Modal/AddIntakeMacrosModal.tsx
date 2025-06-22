import React, { forwardRef, useImperativeHandle, useRef, useState, useMemo, useCallback } from 'react';
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
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

export type AddIntakeMacrosModalRef = {
  present: () => void;
  dismiss: () => void;
};

type Props = {
  onSave: (protein: number, carbs: number, fat: number) => void;
};

export const AddIntakeMacrosModal = forwardRef<AddIntakeMacrosModalRef, Props>(({ onSave }, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);

  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Multiple snap points for resizing
  const snapPoints = useMemo(() => ['25%', '40%', '70%'], []);

  const calories =
    (parseFloat(protein) || 0) * 4 +
    (parseFloat(carbs) || 0) * 4 +
    (parseFloat(fat) || 0) * 9;

  useImperativeHandle(ref, () => ({
    present: () => {
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSave = useCallback(() => {
    onSave(parseFloat(protein) || 0, parseFloat(carbs) || 0, parseFloat(fat) || 0);
    setProtein('');
    setCarbs('');
    setFat('');
    sheetRef.current?.dismiss();
  }, [protein, carbs, fat, onSave]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1} // Start from the middle snap point (40%)
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
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Add Intake</Text>
            {[
              ['Protein (g)', protein, setProtein],
              ['Carbs (g)', carbs, setCarbs],
              ['Fat (g)', fat, setFat],
            ].map(([label, val, setter]) => (
              <View key={label} style={{ marginBottom: 12 }}>
                <Text style={{ marginBottom: 6 }}>{label}</Text>
                <TextInput
                  style={{
                    backgroundColor: '#eee',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16,
                  }}
                  keyboardType="numeric"
                  placeholder="Enter grams"
                  value={val}
                  onChangeText={setter as (text: string) => void}
                />
              </View>
            ))}
            <Text style={{ marginBottom: 16, fontWeight: '500' }}>Calories: {calories} kcal</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={{ backgroundColor: '#42779F', padding: 12, borderRadius: 10 }}
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
});
