import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRoutineStore } from "../store/useRoutineStore";
import { useUser } from "@clerk/clerk-expo";
import HorizontalCalendar from "../components/HorizontalCalendar/HorizontalCalendar";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Calendar } from "react-native-calendars";
import { GestureDetector, Gesture, ScrollView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  FadeOutUp,
  FadeInUp,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { shadows } from "~/utils/shadow";
import { useExerciseStore } from "../store/useExerciseStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddExerciseModal, {
  AddExerciseModalRef,
  type RoutineExercise,
} from "../components/Modal/AddExerciseModal";
import EditExerciseModal, {
  type EditExerciseModalRef,
} from "../components/Modal/EditExerciseModal";
import DeleteConfirmationModal from "../components/Modal/DeleteConfirmationModal";

const ITEM_HEIGHT = 35;

type DayWorkout = {
  exercises: RoutineExercise[];
  completed?: boolean;
};

type WorkoutsMap = Record<string, DayWorkout>;

// clean data before sending to Firestore
const cleanFirestoreData = (obj: any): any => {
  if (obj === null || typeof obj !== "object") return obj ?? null;

  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreData).filter((item) => item !== undefined);
  }

  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanFirestoreData(obj[key]);
    }
  }

  return cleaned;
};

type DeleteModalRef = { present: () => void; dismiss: () => void };

const RoutineScreen = () => {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  // Routine store
  const {
    workouts: workoutsRaw,
    selectedDate,
    setSelectedDate,
    fetchRoutineFromFirestore,
    addExercise,
    editExercise,
    deleteExercise,
    reorderExercises,
  } = useRoutineStore();

  const workouts = (workoutsRaw as unknown as WorkoutsMap) ?? {};

  // Exercise store
  const exercises = useExerciseStore((state) => state.exercises);
  const fetchExercises = useExerciseStore((state) => state.fetchExercises);

  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExerciseForDelete, setSelectedExerciseForDelete] = useState<RoutineExercise | null>(null);
  const [loadingRoutine, setLoadingRoutine] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const didFetchRoutine = useRef(false);

  const exerciseModalRef = useRef<AddExerciseModalRef>(null);
  const editExerciseModalRef = useRef<EditExerciseModalRef>(null);
  const deleteModalRef = useRef<DeleteModalRef>(null);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dayjs().format("YYYY-MM-DD"));
    }
  }, [selectedDate, setSelectedDate]);

  useEffect(() => {
    if (!user?.id || didFetchRoutine.current) return;
    didFetchRoutine.current = true;

    const fetchUserRoutine = async () => {
      setLoadingRoutine(true);
      try {
        await fetchRoutineFromFirestore(user.id);
      } catch (error) {
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
        Toast.show({ type: "error", text1: "Failed to load exercises" });
      } finally {
        setLoadingExercises(false);
      }
    };
    loadExercises();
  }, [fetchExercises]);

  const dateKey = selectedDate ?? "";

  const currentWorkoutList: RoutineExercise[] = useMemo(() => {
    return workouts?.[dateKey]?.exercises ?? [];
  }, [workouts, dateKey]);

  const isWorkoutCompleted: boolean = useMemo(() => {
    return workouts?.[dateKey]?.completed ?? false;
  }, [workouts, dateKey]);

  const workoutDays = useMemo(() => {
    const md: Record<string, { marked: boolean; dotColor: string }> = {};
    const today = dayjs();

    Object.entries(workouts).forEach(([date, workout]) => {
      const workoutDate = dayjs(date);
      const hasExercises = !!workout?.exercises?.length;

      if (hasExercises) {
        let dotColor = "#42779F";
        if (workoutDate.isBefore(today, "day")) {
          dotColor = workout.completed ? "#4CAF50" : "#FFA07A";
        }
        md[date] = { marked: true, dotColor };
      }
    });

    return md;
  }, [workouts]);

  const showSkippedOverlay =
    dayjs(dateKey).isBefore(dayjs(), "day") &&
    !isWorkoutCompleted &&
    currentWorkoutList.length > 0;

  const showCompletedOverlay =
    dayjs(dateKey).isBefore(dayjs(), "day") && isWorkoutCompleted;

  const positions = useSharedValue<Record<string, number>>({});

  useEffect(() => {
    positions.value = Object.assign(
      {},
      ...currentWorkoutList.map((item, index) => ({ [item.id]: index }))
    );
  }, [currentWorkoutList, positions]);

  const reorderItems = useCallback(
    (fromId: string, toIndex: number) => {
      if (!user?.id) return;

      const list = [...currentWorkoutList];
      const fromIndex = list.findIndex((i) => i.id === fromId);
      if (fromIndex === -1 || fromIndex === toIndex) return;

      const moved = list.splice(fromIndex, 1)[0];
      list.splice(toIndex, 0, moved);

      const cleanedList = list.map((exercise) => cleanFirestoreData(exercise));
      reorderExercises(user.id, cleanedList);
    },
    [currentWorkoutList, user?.id, reorderExercises]
  );

  const handleSelectExercise = (routineItem: RoutineExercise) => {
    if (!user?.id) return;

    const isDuplicate = currentWorkoutList.some(
      (e) => (e.exercise || "") === routineItem.exercise
    );
    if (isDuplicate) {
      return Toast.show({
        type: "error",
        text1: "Duplicate Exercise",
        text2: "This exercise is already added.",
      });
    }

    const cleaned = cleanFirestoreData(routineItem);
    try {
      addExercise(user.id, cleaned);
      Toast.show({
        type: "success",
        text1: "Exercise Added",
        text2: "Exercise has been added to your workout.",
      });
    } catch (err) {
      console.error("Error adding exercise:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add exercise. Please try again.",
      });
    }
  };

  const handleEditExercise = (updated: any) => {
    if (!user?.id || !updated) return;

    // Normalize target to string[]
    const normalizedTarget = Array.isArray(updated.target)
      ? updated.target
      : updated.target
        ? [updated.target]
        : [];

    const safeUpdated: RoutineExercise = {
      id: String(updated.id),
      exercise: String(updated.exercise ?? ""),
      target: normalizedTarget,
      reps: String(updated.reps ?? "12"),
      sets: String(updated.sets ?? "3"),
      rest: String(updated.rest ?? "01:00"),
    };

    const cleanedExercise = cleanFirestoreData(safeUpdated);

    try {
      editExercise(user.id, safeUpdated.id, cleanedExercise);
      Toast.show({
        type: "success",
        text1: "Exercise Updated",
        text2: "Exercise has been successfully updated.",
      });
    } catch (error) {
      console.error("Error editing exercise:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update exercise. Please try again.",
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedExerciseForDelete || !user?.id) return;

    try {
      deleteExercise(user.id, selectedExerciseForDelete.id);
      setSelectedExerciseForDelete(null);
      Toast.show({
        type: "success",
        text1: "Exercise Deleted",
        text2: "Exercise has been removed from your workout.",
      });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete exercise. Please try again.",
      });
    }
  };

  const attemptChangeDate = (newDate: string) => {
    if (isEditing) {
      Toast.show({
        type: "error",
        text1: "Edit Mode Active",
        text2: "Please finish editing before changing dates.",
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
        type: "error",
        text1: "Edit Mode Active",
        text2: "Please finish editing before opening calendar.",
      });
      return;
    }
    setShowFullCalendar((s) => !s);
  };

  const DraggableItem = ({ item }: { item: RoutineExercise }) => {
    const offsetY = useSharedValue(0);
    const isDragging = useSharedValue(false);

    const gesture = Gesture.Pan()
      .onBegin(() => {
        isDragging.value = true;
      })
      .onUpdate((e) => {
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
        {isEditing && (
          <Ionicons
            name="menu-outline"
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
        )}
        <Text className="text-white flex-1">{item.exercise || ""}</Text>
        <Text className="text-white flex-1">
          {Array.isArray(item.target) ? item.target.join(", ") : item.target || ""}
        </Text>
        <Text className="text-white flex-[0.6] text-center">{String(item.reps ?? "")}</Text>
        <Text className="text-white flex-[0.6] text-center">{String(item.sets ?? "")}</Text>
        <Text className="text-white flex-[0.6] text-center">{String(item.rest ?? "")}</Text>
        {isEditing && (
          <View className="w-12 flex-row ml-2">
            <TouchableOpacity
              className="mr-2"
              onPress={() => {
                // Open edit modal via ref (it accepts the exercise via present())
                editExerciseModalRef.current?.present({
                  id: item.id,
                  exercise: item.exercise,
                  target: Array.isArray(item.target) ? item.target.join(", ") : String(item.target ?? ""),
                  reps: typeof item.reps === "number" ? item.reps : String(item.reps ?? "12"),
                  sets: Number(item.sets ?? 1),
                  rest: String(item.rest ?? "01:00"),
                } as any);
              }}
            >
              <Ionicons name="pencil" size={20} color="#84BDEA" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSelectedExerciseForDelete(item);
                setTimeout(() => {
                  deleteModalRef.current?.present();
                }, 0);
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
            style={shadows.large}
          >
            <Calendar
              markedDates={workoutDays}
              onDayPress={(day) => attemptChangeDate(day.dateString)}
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
              className={`flex-row items-center p-2 rounded-[5] w-[70] ${isEditing ? "bg-[#98c9ee]" : "bg-[#142939]"
                }`}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons
                name="create"
                size={20}
                color={isEditing ? "#42779F" : "#73b5e8"}
              />
              <Text
                className={`ml-1 font-bold ${isEditing ? "text-[#42779F]" : "text-[#73b5e8]"
                  }`}
              >
                {isEditing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentWorkoutList.length > 0 ? (
          <View className="bg-[#315D80] rounded-lg p-3 max-h-[350]">
            <View className="flex-row items-center pb-2 border-b border-gray-400">
              {isEditing && <View style={{ width: 28 }} />}
              <Text className="text-white font-bold flex-1">Exercise</Text>
              <Text className="text-white font-bold flex-1">Target</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rep/Time</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Set</Text>
              <Text className="text-white font-bold flex-[0.6] text-center">Rest</Text>
              {isEditing && <View style={{ width: 50 }} />}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentWorkoutList.map((item) => (
                <DraggableItem key={item.id} item={item} />
              ))}
            </ScrollView>
          </View>
        ) : (
          <Text className="text-white text-center mt-3 italic">
            No exercises today. Tap "Edit" to add exercises
          </Text>
        )}

        {/* Skipped Workout Overlay */}
        {showSkippedOverlay && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(112, 82, 59, 0.752)",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <View className="bg-[#fca910] p-5 rounded-[12]">
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                Workout not completed
              </Text>
              <Text
                style={{
                  color: "white",
                  fontSize: 14,
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                Let's stay consistent
              </Text>
            </View>
          </View>
        )}

        {showCompletedOverlay && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(39, 123, 41, 0.6)",
              borderRadius: 8,
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <View className="bg-[#45b520] p-5 rounded-[12]">
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
                Workout completed 🎉
              </Text>
              <Text style={{ color: "white", fontSize: 14, marginTop: 4 }}>
                Great job! Keep it up!
              </Text>
            </View>
          </View>
        )}

        {isEditing && (
          <TouchableOpacity
            className="mt-4 bg-[#84BDEA] rounded-lg p-3 flex-row justify-center items-center"
            onPress={() => {
              if (loadingExercises) {
                Toast.show({
                  type: "info",
                  text1: "Loading exercises, please wait...",
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

      <EditExerciseModal ref={editExerciseModalRef} onSave={handleEditExercise} />

      <DeleteConfirmationModal
        ref={deleteModalRef as any}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSelectedExerciseForDelete(null)}
      />

      <Toast />
    </View>
  );
};

export default RoutineScreen;
