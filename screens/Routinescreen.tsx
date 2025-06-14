import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  LogBox,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HorizontalCalendar from "../components/HorizontalCalendar/HorizontalCalendar";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Calendar } from "react-native-calendars";
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import uuid from 'react-native-uuid';
import AddExerciseModal, { AddExerciseModalRef, Exercise } from "../components/Modal/AddExerciseModal";
import EditExerciseModal, { EditExerciseModalRef } from "../components/Modal/EditExerciseModal";
import DeleteConfirmationModal, { DeleteConfirmationModalRef } from "../components/Modal/DeleteConfirmationModal";
import Toast from "react-native-toast-message";
import { shadows } from "~/utils/shadow";

LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered']);

const ITEM_HEIGHT = 35;

const RoutineScreen = () => {
  const id = uuid.v4();
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  

  const exerciseModalRef = useRef<AddExerciseModalRef>(null);
  const editExerciseModalRef = useRef<EditExerciseModalRef>(null);
  const deleteModalRef = useRef<DeleteConfirmationModalRef>(null);

  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<Exercise | null>(null);
  const [selectedExerciseForDelete, setSelectedExerciseForDelete] = useState<Exercise | null>(null);

  const [workouts, setWorkouts] = useState({
    "2025-03-05": [
      { id: "1", exercise: "Push-up", target: "Chest", reps: 10, sets: 4, rest: "1:30" },
      { id: "2", exercise: "Dumbbell Bench Press", target: "Chest", reps: 8, sets: 4, rest: "1:30" },
    ],
    "2025-03-07": [
      { id: "3", exercise: "Squat", target: "Legs", reps: 12, sets: 4, rest: "1:00" },
    ],
    "2025-03-09": [
      { id: "4", exercise: "Pull-up", target: "Back", reps: 8, sets: 3, rest: "1:30" },
    ],
  });

  const customExercises: Exercise[] = [
    { id: 'e1', exercise: 'Push-up', target: 'Chest', reps: 10, sets: 4, rest: '1:30' },
    { id: 'e2', exercise: 'Dumbbell Bench Press', target: 'Chest', reps: 8, sets: 4, rest: '1:30' },
    { id: 'e3', exercise: 'Squat', target: 'Legs', reps: 12, sets: 4, rest: '1:00' },
    { id: 'e4', exercise: 'Pull-up', target: 'Back', reps: 8, sets: 3, rest: '1:30' },
    { id: 'e5', exercise: 'Deadlift', target: 'Back', reps: 6, sets: 4, rest: '2:00' },
  ];

  const workoutDays = {
    "2025-03-05": { marked: true, dotColor: "#42779F" },
    "2025-03-07": { marked: true, dotColor: "#42779F" },
    "2025-03-09": { marked: true, dotColor: "#42779F" },
  };

  const currentWorkoutList = useMemo(() => workouts[selectedDate] || [], [selectedDate, workouts]);

  const reorderItems = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    setWorkouts(prev => {
      const currentList = [...(prev[selectedDate] || [])];
      const item = currentList.splice(fromIndex, 1)[0];
      currentList.splice(toIndex, 0, item);
      return { ...prev, [selectedDate]: currentList };
    });
  }, [selectedDate]);

  const handleSelectExercise = (exercise: Exercise) => {
    const isDuplicate = (workouts[selectedDate] || []).some(
      e => e.exercise === exercise.exercise && e.target === exercise.target
    );
    if (isDuplicate) {
      Toast.show({ type: 'error', text1: 'Duplicate Exercise', text2: 'This exercise is already in the workout' });
      return;
    }

    setWorkouts(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), { ...exercise, id: uuid.v4() }],
    }));
  };

  const handleOpenEdit = (exercise: Exercise) => {
    setSelectedExerciseForEdit(exercise);
    editExerciseModalRef.current?.present(exercise);
  };

  const handleEditExercise = (updatedExercise: Exercise) => {
    setWorkouts(prev => {
      const updated = prev[selectedDate].map(e => e.id === updatedExercise.id ? updatedExercise : e);
      return { ...prev, [selectedDate]: updated };
    });
  };

  const handleOpenDelete = (exercise: Exercise) => {
    setSelectedExerciseForDelete(exercise);
    deleteModalRef.current?.present();
  };

  const handleConfirmDelete = () => {
    if (!selectedExerciseForDelete) return;
    setWorkouts(prev => {
      const updated = prev[selectedDate].filter(e => e.id !== selectedExerciseForDelete.id);
      return { ...prev, [selectedDate]: updated };
    });
    setSelectedExerciseForDelete(null);
  };

  const openAddExerciseModal = () => {
    exerciseModalRef.current?.present();
  };

  const DraggableItem = React.memo(({ item, index }: { item: Exercise, index: number }) => {
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const zIndex = useSharedValue(0);
    
    // Key fix: Track the gesture state properly
    const gestureState = useSharedValue('IDLE'); // 'IDLE', 'STARTED', 'ACTIVE'
    const startIndex = useSharedValue(index);
    const offsetY = useSharedValue(0); // This will store the cumulative offset

    React.useEffect(() => {
      // Reset position when index changes (after reorder)
      if (gestureState.value === 'IDLE') {
        translateY.value = 0;
        offsetY.value = 0;
      }
    }, [index]);

    const panGesture = Gesture.Pan()
      .onStart(() => {
        gestureState.value = 'ACTIVE';
        startIndex.value = index;
        runOnJS(setDraggingId)(item.id);
        scale.value = withSpring(1.05);
        opacity.value = withTiming(0.8, { duration: 150 });
        zIndex.value = 1000;
      })
      .onUpdate((event) => {
        // Remove the gestureState check - always update translateY
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        const movement = event.translationY;
        const itemsMoved = Math.round(movement / ITEM_HEIGHT);
        const newIndex = Math.max(0, Math.min(startIndex.value + itemsMoved, currentWorkoutList.length - 1));
        
        if (newIndex !== startIndex.value) {
          runOnJS(reorderItems)(startIndex.value, newIndex);
        }
        
        // Reset all values
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        scale.value = withSpring(1);
        opacity.value = withTiming(1, { duration: 150 });
        zIndex.value = 0;
        offsetY.value = 0;
        gestureState.value = 'IDLE';
        
        runOnJS(setDraggingId)(null);
      })
      .onFinalize(() => {
        // Cleanup in case gesture is cancelled
        translateY.value = withSpring(0);
        scale.value = withSpring(1);
        opacity.value = withTiming(1);
        zIndex.value = 0;
        offsetY.value = 0;
        gestureState.value = 'IDLE';
        runOnJS(setDraggingId)(null);
      })
      .enabled(isEditing)
      .minDistance(0) // Activate immediately with minimal movement
      .failOffsetX([-1000, 1000]) // Don't fail on horizontal movement
      .activeOffsetY([-5, 5]); // Activate with small vertical movement

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateY: translateY.value },
          { scale: scale.value }
        ],
        opacity: opacity.value,
        zIndex: zIndex.value,
        elevation: gestureState.value === 'ACTIVE' ? 10 : 0,
      };
    });

    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[animatedStyle]} className="flex-row items-center pt-2">
          {isEditing && <Ionicons name="menu-outline" size={20} color="white" style={{ marginRight: 8 }} />}
          <Text className="text-white flex-1">{item.exercise}</Text>
          <Text className="text-white flex-1">{item.target}</Text>
          <Text className="text-white flex-[0.6] text-center">{item.reps}</Text>
          <Text className="text-white flex-[0.6] text-center">{item.sets}</Text>
          <Text className="text-white flex-[0.6] text-center">{item.rest}</Text>
          {isEditing && (
            <View className="w-12 flex-row ml-2">
              <TouchableOpacity className="mr-2" onPress={() => handleOpenEdit(item)}>
                <Ionicons name="pencil" size={20} color="#84BDEA" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleOpenDelete(item)}>
                <Ionicons name="trash" size={20} color="#E63946" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    );
  });

  return (
    <View className="flex-1 pt-4 bg-[#84BDEA]">
      <View className="px-4 pb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-[#142939]">Routine</Text>
        <TouchableOpacity onPress={() => setShowFullCalendar(!showFullCalendar)}>
          <Ionicons name="calendar" size={28} color="#142939" />
        </TouchableOpacity>
      </View>

      <View className="relative mx-4">
        {showFullCalendar && (
          <View className="absolute z-10 w-full bg-white rounded-lg p-2" style={shadows.large}>
            <Calendar
              markedDates={workoutDays}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowFullCalendar(false);
              }}
            />
          </View>
        )}
        <HorizontalCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          workoutDays={workoutDays}
        />
      </View>

      <View className="mx-4 mt-4 bg-[#42779F] rounded-lg p-4" style={shadows.medium}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white text-xl font-bold">Workout</Text>
          <TouchableOpacity
            className={`flex-row items-center p-2 rounded-[5] w-[70] ${
              isEditing ? "bg-[#98c9ee]" : "bg-[#142939]"
            }`}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons
              name="create"
              size={20}
              color={isEditing ? "#42779F" : "#73b5e8"} // darker color for non-edit mode
            />
            <Text
              className={`ml-1 font-bold ${isEditing ? "text-[#42779F]" : "text-[#73b5e8]"}`}
            >
              {isEditing ? "Done" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {currentWorkoutList.length > 0 ? (
          <ScrollView className="bg-[#315D80] rounded-lg p-3 max-h-[60vh]">
            <View className="flex-row items-center pb-2 border-b border-gray-400">
              {isEditing && <View style={{ width: 20 }} />}
              <Text className="text-white font-bold flex-1">Exercise</Text>
              <Text className="text-white font-bold flex-1">Target</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rep</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Set</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rest</Text>
              {isEditing && <View style={{ width: 50 }} />}
            </View>

            {currentWorkoutList.map((item, index) => (
              <DraggableItem key={item.id} item={item} index={index} />
            ))}
          </ScrollView>
        ) : (
          <Text className="text-white text-center mt-3 italic">
            No exercises today. Tap "Edit" to add exercise
          </Text>
        )}

        {isEditing && (
          <TouchableOpacity
            className="mt-4 bg-[#84BDEA] rounded-lg p-3 flex-row justify-center items-center"
            onPress={openAddExerciseModal}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="text-white ml-2 text-lg font-bold">Add Exercise</Text>
          </TouchableOpacity>
        )}
      </View>

      <AddExerciseModal
        ref={exerciseModalRef}
        onSelectExercise={handleSelectExercise}
        availableExercises={customExercises}
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
    </View>
  );
};

export default RoutineScreen;