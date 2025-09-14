import React, { useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ExerciseFromLibrary } from '~/types/Type'; 

const muscle = ['Chest', 'Back', 'Arms', 'Legs', 'Core', 'Shoulders','Full Body'];
const equipmentTypes = ['None', 'Dumbbell'];


export type RoutineExercise = {
  id: string;
  exercise: string;
  target: string[];  
  reps: string;      
  sets: string;      
  rest: string;      
  equipment?: string;
};

export interface AddExerciseModalRef {
  present: () => void;
  dismiss: () => void;
}

type Props = {
  onSelectExercise: (exercise: RoutineExercise) => void;
  availableExercises?: ExerciseFromLibrary[];
};

const timeBasedNames = ['plank', 'side plank'];

function libToRoutine(lib: ExerciseFromLibrary): RoutineExercise {
  const name = lib.name ?? '';
  const isTime = timeBasedNames.some(t => name.toLowerCase().includes(t));
  const target = Array.isArray(lib.muscleGroups) ? lib.muscleGroups : (lib.muscleGroups ? [String(lib.muscleGroups)] : []);

  return {
    id: lib.id,
    exercise: name,
    target,
    reps: isTime ? '00:30' : '12',
    sets: '3',
    rest: '01:00',
  };
}

const AddExerciseModal = forwardRef<AddExerciseModalRef, Props>(
  ({ onSelectExercise, availableExercises = [] }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['85%'], []);

    const [search, setSearch] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

    const filteredExercises = useMemo(() => {
      const q = search.toLowerCase();
      return (availableExercises ?? []).filter((ex) => {
        const name = (ex.name ?? '').toLowerCase();
        const groups = Array.isArray(ex.muscleGroups) ? ex.muscleGroups : [];
        const equipment = ex.equipment ?? 'None';

        const matchesSearch = q === '' || name.includes(q);
        const matchesMuscle = selectedMuscle ? groups.includes(selectedMuscle) : true;
        const matchesEquipment = selectedEquipment ? equipment === selectedEquipment : true;

        return matchesSearch && matchesMuscle && matchesEquipment;
      });
    }, [search, selectedMuscle, selectedEquipment, availableExercises]);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetModalRef.current?.present(),
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }));

    const renderFilterChips = (
      items: string[],
      selected: string | null,
      onSelect: (value: string | null) => void
    ) => (
      <View style={styles.chipContainer}>
        <TouchableOpacity
          style={[styles.chip, selected === null && styles.chipSelected]}
          onPress={() => onSelect(null)}
        >
          <Text style={styles.chipText}>All</Text>
        </TouchableOpacity>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, selected === item && styles.chipSelected]}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.chipText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Add Exercise</Text>

          <TextInput
            placeholder="Search Exercises"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <Text style={styles.filterTitle}>Muscle Groups</Text>
          {renderFilterChips(muscle, selectedMuscle, setSelectedMuscle)}

          <Text style={styles.filterTitle}>Equipment</Text>
          {renderFilterChips(equipmentTypes, selectedEquipment, setSelectedEquipment)}

          {filteredExercises.map((item) => {
            const preview = libToRoutine(item); 
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.exerciseItem}
                onPress={() => {
                  onSelectExercise(preview);      
                  bottomSheetModalRef.current?.dismiss();
                }}
              >
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseDetails}>
                  {(preview.target ?? []).join(', ')} | {preview.equipment ?? 'None'} | {preview.reps} reps · {preview.sets} sets · {preview.rest} rest
                </Text>
              </TouchableOpacity>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#000' },
  searchInput: { borderRadius: 8, backgroundColor: '#eee', padding: 10, marginBottom: 12, color: '#000' },
  filterTitle: { fontSize: 14, fontWeight: '600', marginTop: 12, color: '#333' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  chip: { backgroundColor: '#ccc', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#5FA3D6' },
  chipText: { color: '#fff', fontWeight: '500' },
  exerciseItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#000' },
  exerciseDetails: { fontSize: 14, color: '#555' },
});

export default AddExerciseModal;
