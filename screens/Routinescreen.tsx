import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useRoutineStore } from '../store/useRoutineStore';
import { useUser } from "@clerk/clerk-expo";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import HorizontalCalendar from "../components/HorizontalCalendar/HorizontalCalendar";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Calendar } from "react-native-calendars";
import { GestureDetector, Gesture, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  FadeOutUp,
  FadeInUp,
} from "react-native-reanimated";
import uuid from 'react-native-uuid';
import AddExerciseModal from "../components/Modal/AddExerciseModal";
import EditExerciseModal from "../components/Modal/EditExerciseModal";
import DeleteConfirmationModal from "../components/Modal/DeleteConfirmationModal";
import Toast from "react-native-toast-message";
import { shadows } from "~/utils/shadow";
import { useExerciseStore } from '../store/useExerciseStore';

const ITEM_HEIGHT = 35;

// Utility function to clean data before sending to Firestore
const cleanFirestoreData = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj ?? null;

  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreData).filter((item) => item !== undefined);
  }

  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanFirestoreData(obj[key]);
    }
  }

  return cleaned;
};


// Helper function to ensure exercise has all required fields
const createSafeExercise = (exerciseFromLibrary) => {
  const timeBasedExercises = [
    'plank',
    'side plank',
  ];

  const exerciseName = (exerciseFromLibrary.name || exerciseFromLibrary.exercise || '').toLowerCase();
  const isTimeBased = timeBasedExercises.some(timeExercise => 
    exerciseName.includes(timeExercise)
  );

  // Handle string and array for target/muscleGroups
  let target = exerciseFromLibrary.target || exerciseFromLibrary.muscleGroups || [];
  
  // Ensure target is always an array
  if (typeof target === 'string') {
    target = [target];
  } else if (!Array.isArray(target)) {
    target = [];
  }

  return {
    id: uuid.v4(),
    exercise: exerciseFromLibrary.name || exerciseFromLibrary.exercise || '',
    target: target, // Now always an array
    reps: isTimeBased ? "00:30" : (exerciseFromLibrary.reps || "12"),
    sets: exerciseFromLibrary.sets || "3",
    rest: exerciseFromLibrary.rest || "01:00",
  };
};

const RoutineScreen = () => {
  const { user } = useUser();

  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState(null);
  const [selectedExerciseForDelete, setSelectedExerciseForDelete] = useState(null);
  const [loadingRoutine, setLoadingRoutine] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const didFetchRoutine = useRef(false);

  const exerciseModalRef = useRef(null);
  const editExerciseModalRef = useRef(null);
  const deleteModalRef = useRef(null);

  // Routine store
  const {
    workouts,
    selectedDate,
    setSelectedDate,
    fetchRoutineFromFirestore,
    addExercise,
    editExercise,
    deleteExercise,
    reorderExercises,
    setCompleted
  } = useRoutineStore();

  // Exercise store
  const exercises = useExerciseStore(state => state.exercises);
  const fetchExercises = useExerciseStore(state => state.fetchExercises);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dayjs().format("YYYY-MM-DD"));
    }
  }, [selectedDate, setSelectedDate]);

  useEffect(() => {
    if (!user?.id) return;
    if (didFetchRoutine.current) return;

    didFetchRoutine.current = true;

    const fetchUserRoutine = async () => {
      try {
        setLoadingRoutine(true);
        await fetchRoutineFromFirestore(user.id);
      } catch (error) {
        console.error("Error fetching routine:", error);
        Toast.show({ type: "error", text1: "Failed to load routine" });
      } finally {
        setLoadingRoutine(false);
      }
    };

    fetchUserRoutine();
  }, [user?.id, fetchRoutineFromFirestore]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        await fetchExercises();
      } catch (error) {
        console.error("Error loading exercises:", error);
        Toast.show({ type: 'error', text1: 'Failed to load exercises' });
      } finally {
        setLoadingExercises(false);
      }
    };
    loadExercises();
  }, [fetchExercises]);

  const workoutDays = useMemo(() => {
    const md = {};
    Object.entries(workouts || {}).forEach(([date, workout]) => {
      if (workout && workout.exercises && workout.exercises.length > 0) {
        md[date] = {
          marked: true,
          dotColor: workout.completed ? "#4CAF50" : "#42779F"
        };
      }
    });
    return md;
  }, [workouts]);

  const currentWorkoutList = useMemo(() => {
    const workout = workouts?.[selectedDate];
    return workout?.exercises || [];
  }, [selectedDate, workouts]);

  const isWorkoutCompleted = useMemo(() => {
    const workout = workouts?.[selectedDate];
    return workout?.completed || false;
  }, [selectedDate, workouts]);

  const positions = useSharedValue({});

  useEffect(() => {
    positions.value = Object.assign(
      {},
      ...currentWorkoutList.map((item, index) => ({ [item.id]: index }))
    );
  }, [currentWorkoutList]);

  const reorderItems = useCallback((fromId, toIndex) => {
    if (!user?.id) return;

    const list = [...currentWorkoutList];
    const fromIndex = list.findIndex(i => i.id === fromId);
    if (fromIndex === -1 || fromIndex === toIndex) return;

    const moved = list.splice(fromIndex, 1)[0];
    list.splice(toIndex, 0, moved);

    // Clean the reordered list before saving
    const cleanedList = list.map(exercise => cleanFirestoreData(exercise));
    reorderExercises(user.id, cleanedList);
  }, [currentWorkoutList, user?.id, reorderExercises]);

  const handleSelectExercise = (exerciseFromLibrary) => {
    if (!user?.id) return;

    // Check for duplicates using safe property access
    const isDuplicate = currentWorkoutList.some(e => {
    const exerciseName = e.exercise || '';
    const libraryName = exerciseFromLibrary.name || exerciseFromLibrary.exercise || '';

  return exerciseName === libraryName 
});


    if (isDuplicate) {
      return Toast.show({
        type: 'error',
        text1: 'Duplicate Exercise',
        text2: 'This exercise is already added.'
      });
    }

    // Create a safe exercise object with all required fields
    const newExercise = createSafeExercise(exerciseFromLibrary);
    
    // Clean the exercise data before adding
    const cleanedExercise = cleanFirestoreData(newExercise);
    
    try {
      addExercise(user.id, cleanedExercise);
      Toast.show({
        type: 'success',
        text1: 'Exercise Added',
        text2: 'Exercise has been added to your workout.'
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add exercise. Please try again.'
      });
    }
  };

  const handleEditExercise = (updated) => {
    if (!user?.id || !updated) return;
    
    // Ensure all required fields are present
    const safeUpdated = {
      id: updated.id,
      exercise: updated.exercise || '',
      target: updated.target || '',
      reps: updated.reps || "12",
      sets: updated.sets || "3",
      rest: updated.rest || "01:00",
    };
    
    // Clean the data before saving
    const cleanedExercise = cleanFirestoreData(safeUpdated);
    
    try {
      editExercise(user.id, updated.id, cleanedExercise);
      Toast.show({
        type: 'success',
        text1: 'Exercise Updated',
        text2: 'Exercise has been successfully updated.'
      });
    } catch (error) {
      console.error('Error editing exercise:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update exercise. Please try again.'
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedExerciseForDelete || !user?.id) return;
    
    try {
      deleteExercise(user.id, selectedExerciseForDelete.id);
      setSelectedExerciseForDelete(null);
      Toast.show({
        type: 'success',
        text1: 'Exercise Deleted',
        text2: 'Exercise has been removed from your workout.'
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete exercise. Please try again.'
      });
    }
  };

  const attemptChangeDate = (newDate) => {
    if (isEditing) {
      Toast.show({
        type: 'error',
        text1: 'Edit Mode Active',
        text2: 'Please finish editing before changing dates.',
      });
      return;
    }
    setSelectedDate(newDate);
    setIsEditing(false);
    setShowFullCalendar(false);
  };

  const handleCalendarToggle = () => {
    if (isEditing) {
      Toast.show({
        type: 'error',
        text1: 'Edit Mode Active',
        text2: 'Please finish editing before opening calendar.',
      });
      return;
    }
    setShowFullCalendar(s => !s);
  };

  // const handleCompleteWorkout = () => {
  //   if (!user?.id) return;
    
  //   try {
  //     setCompleted(user.id, !isWorkoutCompleted);
  //     Toast.show({
  //       type: 'success',
  //       text1: isWorkoutCompleted ? 'Workout Marked Incomplete' : 'Workout Completed!',
  //       text2: isWorkoutCompleted ? 'Keep going!' : 'Great job today!',
  //     });
  //   } catch (error) {
  //     console.error('Error updating workout completion:', error);
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Error',
  //       text2: 'Failed to update workout status. Please try again.'
  //     });
  //   }
  // };

  const DraggableItem = ({ item }) => {
    const offsetY = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const gesture = Gesture.Pan()
      .onBegin(() => {
        isDragging.value = true;
      })
      .onUpdate(e => {
        offsetY.value = e.translationY;
      })
      .onEnd(() => {
        const fromIndex = positions.value[item.id];
        const newIndex = Math.max(
          0,
          Math.min(
            currentWorkoutList.length - 1,
            Math.floor((fromIndex * ITEM_HEIGHT + offsetY.value) / ITEM_HEIGHT)
          )
        );

        runOnJS(reorderItems)(item.id, newIndex);
        offsetY.value = withTiming(0);
        isDragging.value = false;
      });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: offsetY.value }],
        zIndex: isDragging.value ? 10 : 0,
        opacity: withTiming(isDragging.value ? 0.9 : 1),
        scale: withTiming(isDragging.value ? 1.05 : 1),
      };
    });

    const ItemContent = () => (
      <Animated.View style={animatedStyle} className="flex-row items-center py-2">
        {isEditing && <Ionicons name="menu-outline" size={20} color="white" style={{ marginRight: 8 }} />}
        <Text className="text-white flex-1">{item.exercise || ''}</Text>
        <Text className="text-white flex-1">{item.target || ''}</Text>
        <Text className="text-white flex-[0.6] text-center">{item.reps || ''}</Text>
        <Text className="text-white flex-[0.6] text-center">{item.sets || ''}</Text>
        <Text className="text-white flex-[0.6] text-center">{item.rest || ''}</Text>
        {isEditing && (
          <View className="w-12 flex-row ml-2">
            <TouchableOpacity
              className="mr-2"
              onPress={() => {
                setSelectedExerciseForEdit(item);
                editExerciseModalRef.current?.present(item);
              }}
            >
              <Ionicons name="pencil" size={20} color="#84BDEA" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedExerciseForDelete(item);
                deleteModalRef.current?.present();
              }}
            >
              <Ionicons name="trash" size={20} color="#E63946" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );

    if (isEditing) {
      return (
        <GestureDetector gesture={gesture}>
          <ItemContent />
        </GestureDetector>
      );
    } else {
      return <ItemContent />;
    }
  };

  if (loadingRoutine) {
    return (
      <View className="flex-1 pt-4 bg-[#84BDEA] justify-center items-center">
        <Text className="text-white text-lg">Loading routine...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-4 bg-[#84BDEA]">
      {/* Header */}
      <View className="px-4 pb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-[#142939]">Routine</Text>
        <TouchableOpacity onPress={handleCalendarToggle}>
          <Ionicons name="calendar" size={28} color="#142939" />
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View className="relative mx-4">
        {showFullCalendar && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOutUp.duration(300)}
            className="absolute z-10 w-full bg-white rounded-lg p-2"
            style={shadows.large}>
            <Calendar
              markedDates={workoutDays}
              onDayPress={day => attemptChangeDate(day.dateString)}
            />
          </Animated.View>
        )}
        <HorizontalCalendar
          selectedDate={selectedDate}
          onSelectDate={attemptChangeDate}
          workoutDays={workoutDays}
        />
      </View>

      {/* Workout List and Editing */}
      <View className="mx-4 mt-4 bg-[#42779F] rounded-lg p-4" style={shadows.medium}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white text-xl font-bold">Workout</Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              className={`flex-row items-center p-2 rounded-[5] w-[70] ${isEditing ? "bg-[#98c9ee]" : "bg-[#142939]"}`}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name="create" size={20} color={isEditing ? "#42779F" : "#73b5e8"} />
              <Text className={`ml-1 font-bold ${isEditing ? "text-[#42779F]" : "text-[#73b5e8]"}`}>
                {isEditing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentWorkoutList.length > 0 ? (
          <ScrollView
           showsVerticalScrollIndicator={false}
           contentContainerStyle={{ paddingBottom: 20 }} 
           className="bg-[#315D80] rounded-lg p-3 max-h-[350]">
            <View className="flex-row items-center pb-2 border-b border-gray-400">
              {isEditing && <View style={{ width: 28 }} />}
              <Text className="text-white font-bold flex-1">Exercise</Text>
              <Text className="text-white font-bold flex-1">Target</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rep/Time</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Set</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rest</Text>
              {isEditing && <View style={{ width: 50 }} />}
            </View>

            {currentWorkoutList.map((item) => (
              <DraggableItem key={item.id} item={item} />
            ))}
          </ScrollView>
        ) : (
          <Text className="text-white text-center mt-3 italic">
            No exercises today. Tap "Edit" to add exercises
          </Text>
        )}

        {isEditing && (
          <TouchableOpacity
            className="mt-4 bg-[#84BDEA] rounded-lg p-3 flex-row justify-center items-center"
            onPress={() => {
              if (loadingExercises) {
                Toast.show({
                  type: 'info',
                  text1: 'Loading exercises, please wait...',
                });
                return;
              }
              exerciseModalRef.current?.present();
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="text-white ml-2 text-lg font-bold">Add Exercise</Text>
          </TouchableOpacity>
        )}

      </View>

      <AddExerciseModal
        ref={exerciseModalRef}
        onSelectExercise={handleSelectExercise}
        availableExercises={exercises || []}
      />
      <EditExerciseModal
        ref={editExerciseModalRef}
        exercise={selectedExerciseForEdit}
        onSave={handleEditExercise}
      />
      <DeleteConfirmationModal
        ref={deleteModalRef}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSelectedExerciseForDelete(null)}
      />
      <Toast />
    </View>
  );
};

export default RoutineScreen;