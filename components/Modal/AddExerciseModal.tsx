import React, { useRef, useMemo, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';

const muscleGroups = ['Chest', 'Back', 'Arms', 'Legs', 'Core'];
const equipmentTypes = ['None', 'Dumbbell', 'Barbell', 'Machine'];

export interface Exercise {
  id: string;
  exercise: string;
  target: string;
  reps: number;
  sets: number;
  rest: string;
  muscleGroup: string;
  equipment: string;
}

export interface AddExerciseModalRef {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  onSelectExercise: (exercise: Exercise) => void;
  availableExercises?: Exercise[];
}

const AddExerciseModal = forwardRef<AddExerciseModalRef, Props>(
  ({ onSelectExercise, availableExercises = [] }, ref) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['85%'], []);

    const [search, setSearch] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

    const filteredExercises = useMemo(() => {
      return availableExercises.filter((ex) => {
        const matchesSearch = ex.exercise.toLowerCase().includes(search.toLowerCase());
        const matchesMuscle = selectedMuscle ? ex.muscleGroup === selectedMuscle : true;
        const matchesEquipment = selectedEquipment ? ex.equipment === selectedEquipment : true;
        return matchesSearch && matchesMuscle && matchesEquipment;
      });
    }, [search, selectedMuscle, selectedEquipment, availableExercises]);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetModalRef.current?.present(),
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }));

    const renderFilterChips = (items: string[], selected: string | null, onSelect: (value: string | null) => void) => (
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
        backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      >
        <BottomSheetView style={styles.container}>
          <Text style={styles.title}>Add Exercise</Text>
          <TextInput
            placeholder="Search Exercises"
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <Text style={styles.filterTitle}>Muscle Groups</Text>
          {renderFilterChips(muscleGroups, selectedMuscle, setSelectedMuscle)}

          <Text style={styles.filterTitle}>Equipment</Text>
          {renderFilterChips(equipmentTypes, selectedEquipment, setSelectedEquipment)}

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseItem}
                onPress={() => {
                  onSelectExercise(item);
                  bottomSheetModalRef.current?.dismiss();
                }}
              >
                <Text style={styles.exerciseName}>{item.exercise}</Text>
                <Text style={styles.exerciseDetails}>
                  {item.muscleGroup} | {item.equipment} | {item.reps} reps · {item.sets} sets · {item.rest} rest
                </Text>
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  searchInput: {
    borderRadius: 8,
    backgroundColor: '#eee',
    padding: 10,
    marginBottom: 12,
    color: '#000',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  chip: {
    backgroundColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#5FA3D6',
  },
  chipText: {
    color: '#fff',
    fontWeight: '500',
  },
  exerciseItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#555',
  },
});

export default AddExerciseModal;
