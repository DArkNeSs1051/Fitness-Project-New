import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
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
  FadeOutUp,
  FadeInUp,
} from "react-native-reanimated";
import uuid from 'react-native-uuid';
import AddExerciseModal, { AddExerciseModalRef, Exercise } from "../components/Modal/AddExerciseModal";
import EditExerciseModal, { EditExerciseModalRef } from "../components/Modal/EditExerciseModal";
import DeleteConfirmationModal, { DeleteConfirmationModalRef } from "../components/Modal/DeleteConfirmationModal";
import Toast from "react-native-toast-message";
import { shadows } from "~/utils/shadow";


const ITEM_HEIGHT = 35;

const RoutineScreen = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<Exercise | null>(null);
  const [selectedExerciseForDelete, setSelectedExerciseForDelete] = useState<Exercise | null>(null);

  const exerciseModalRef = useRef<AddExerciseModalRef>(null);
  const editExerciseModalRef = useRef<EditExerciseModalRef>(null);
  const deleteModalRef = useRef<DeleteConfirmationModalRef>(null);

  const [workouts, setWorkouts] = useState<{ [key: string]: Exercise[] }>({
    "2025-03-05": [ { id: "1", exercise: "Push-up", target: "Chest", reps: 10, sets: 4, rest: "1:30" }],
    "2025-03-06": [{ id: "2", exercise: "Dumbbell Bench Press", target: "Chest", reps: 8, sets: 4, rest: "1:30" } ],
    "2025-03-07": [ { id: "3", exercise: "Squat", target: "Legs", reps: 12, sets: 4, rest: "1:00" } ],
    "2025-03-09": [ { id: "4", exercise: "Pull-up", target: "Back", reps: 8, sets: 3, rest: "1:30" } ],
  });

  const customExercises: Exercise[] = [
    { id: 'e1', exercise: 'Push-up', target: 'Chest', reps: 10, sets: 4, rest: '1:30' },
    { id: 'e2', exercise: 'Dumbbell Bench Press', target: 'Chest', reps: 8, sets: 4, rest: '1:30' },
    { id: 'e3', exercise: 'Squat', target: 'Legs', reps: 12, sets: 4, rest: '1:00' },
    { id: 'e4', exercise: 'Pull-up', target: 'Back', reps: 8, sets: 3, rest: '1:30' },
    { id: 'e5', exercise: 'Deadlift', target: 'Back', reps: 6, sets: 4, rest: '2:00' },
  ];

  const workoutDays = useMemo(() => {
    const md: any = {};
    Object.entries(workouts).forEach(([date, list]) => {
      if (list.length > 0) md[date] = { marked: true, dotColor: "#42779F" };
    });
    return md;
  }, [workouts]);

  const currentWorkoutList = useMemo(() => workouts[selectedDate] || [], [selectedDate, workouts]);

   const positions = useSharedValue<{ [key: string]: number }>({});

  useEffect(() => {
    positions.value = Object.assign(
      {},
      ...currentWorkoutList.map((item, index) => ({ [item.id]: index }))
    );
  }, [currentWorkoutList]);

  const reorderItems = useCallback((fromId: string, toIndex: number) => {
    setWorkouts(prev => {
      const list = [...(prev[selectedDate] || [])];
      const fromIndex = list.findIndex(i => i.id === fromId);
      if (fromIndex === -1 || fromIndex === toIndex) return prev;
      const moved = list.splice(fromIndex, 1)[0];
      list.splice(toIndex, 0, moved);
      return { ...prev, [selectedDate]: list };
    });
  }, [selectedDate]);

  const handleSelectExercise = (exercise: Exercise) => {
    const dup = (workouts[selectedDate] || []).some(e =>
      e.exercise === exercise.exercise && e.target === exercise.target
    );
    if (dup) {
      return Toast.show({ type: 'error', text1: 'Duplicate Exercise', text2: 'This exercise is already added.' });
    }
    setWorkouts(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), { ...exercise, id: uuid.v4() }],
    }));
  };

  const handleEditExercise = (updated: Exercise) => {
    setWorkouts(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map(e => e.id === updated.id ? updated : e),
    }));
  };

  const handleConfirmDelete = () => {
    if (!selectedExerciseForDelete) return;
    setWorkouts(prev => ({
      ...prev,
      [selectedDate]: prev[selectedDate].filter(e => e.id !== selectedExerciseForDelete.id),
    }));
    setSelectedExerciseForDelete(null);
  };

  const attemptChangeDate = (newDate: string) => {
    // Prevent date change if user is in edit mode
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

  // Prevent calendar toggle if in edit mode
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
  

  const DraggableItem = ({ item }: { item: Exercise }) => {
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
        const newIndex = Math.max(0, Math.min(
          currentWorkoutList.length - 1,
          Math.floor((fromIndex * ITEM_HEIGHT + offsetY.value) / ITEM_HEIGHT)
        ));

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


    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedStyle} className="flex-row items-center py-2">
          {isEditing && <Ionicons name="menu-outline" size={20} color="white" style={{ marginRight: 8 }} />}
          <Text className="text-white flex-1">{item.exercise}</Text>
          <Text className="text-white flex-1">{item.target}</Text>
          <Text className="text-white flex-[0.6] text-center">{item.reps}</Text>
          <Text className="text-white flex-[0.6] text-center">{item.sets}</Text>
          <Text className="text-white flex-[0.6] text-center">{item.rest}</Text>
          {isEditing && (
            <View className="w-12 flex-row ml-2">
              <TouchableOpacity className="mr-2" onPress={() => { setSelectedExerciseForEdit(item); editExerciseModalRef.current?.present(item); }}>
                <Ionicons name="pencil" size={20} color="#84BDEA" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSelectedExerciseForDelete(item); deleteModalRef.current?.present(); }}>
                <Ionicons name="trash" size={20} color="#E63946" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <View className="flex-1 pt-4 bg-[#84BDEA]">
      <View className="px-4 pb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-[#142939]">Routine</Text>
        <TouchableOpacity onPress={handleCalendarToggle}>
          <Ionicons name="calendar" size={28} color="#142939" />
        </TouchableOpacity>
      </View>

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

      <View className="mx-4 mt-4 bg-[#42779F] rounded-lg p-4" style={shadows.medium}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white text-xl font-bold">Workout</Text>
          <TouchableOpacity
            className={`flex-row items-center p-2 rounded-[5] w-[70] ${isEditing ? "bg-[#98c9ee]" : "bg-[#142939]"}`}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons name="create" size={20} color={isEditing ? "#42779F" : "#73b5e8"} />
            <Text className={`ml-1 font-bold ${isEditing ? "text-[#42779F]" : "text-[#73b5e8]"}`}>{isEditing ? "Done" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {currentWorkoutList.length > 0 ? (
          <View className="bg-[#315D80] rounded-lg p-3 max-h-[60vh]">
            <View className="flex-row items-center pb-2 border-b border-gray-400">
              {isEditing && <View style={{ width: 20 }}/> }
              <Text className="text-white font-bold flex-1">Exercise</Text>
              <Text className="text-white font-bold flex-1">Target</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rep</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Set</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rest</Text>
              {isEditing && <View style={{ width: 50 }}/>}
            </View>

            {currentWorkoutList.map((item, idx) => (
              <DraggableItem key={item.id} item={item} index={idx}/>
            ))}
          </View>
        ) : (
          <Text className="text-white text-center mt-3 italic">No exercises today. Tap "Edit" to add exercise</Text>
        )}

        {isEditing && (
          <TouchableOpacity className="mt-4 bg-[#84BDEA] rounded-lg p-3 flex-row justify-center items-center"
            onPress={() => exerciseModalRef.current?.present()}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text className="text-white ml-2 text-lg font-bold">Add Exercise</Text>
          </TouchableOpacity>
        )}
      </View>

      <AddExerciseModal ref={exerciseModalRef} onSelectExercise={handleSelectExercise} availableExercises={customExercises} />
      <EditExerciseModal ref={editExerciseModalRef} exercise={selectedExerciseForEdit} onSave={handleEditExercise} />
      <DeleteConfirmationModal ref={deleteModalRef} onConfirm={handleConfirmDelete} onCancel={() => setSelectedExerciseForDelete(null)} />
      <Toast />
    </View>
  );
};

export default RoutineScreen;