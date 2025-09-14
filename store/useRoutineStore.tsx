// store/useRoutineStore.ts
import { create } from "zustand";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { FIRESTORE_DB } from "../firebase";
import type { RoutineExercise } from "../types/Type";
import Toast from "react-native-toast-message";
import dayjs from "dayjs";

type Day = { exercises: RoutineExercise[]; completed: boolean; title?: string };

interface RoutineStore {
  ownerId: string | null;
  workouts: Record<string, Day>;
  selectedDate: string;
  loading: boolean;
  error?: string | null;
  setSelectedDate: (date: string) => void;
  reset: () => void;
  fetchRoutineFromFirestore: (userId: string) => Promise<void>;
  saveDayRoutine: (userId: string, date: string) => Promise<void>;
  addExercise: (userId: string, exercise: RoutineExercise) => void;
  editExercise: (userId: string, exerciseId: string, updates: Partial<RoutineExercise>) => void;
  deleteExercise: (userId: string, exerciseId: string) => void;
  reorderExercises: (userId: string, newExercises: RoutineExercise[]) => void;
  setCompleted: (userId: string, completed: boolean) => void;
  getCompletedDates: () => string[];
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  ownerId: null,
  workouts: {},
  selectedDate: dayjs().format("YYYY-MM-DD"),
  loading: false,
  error: null,

  setSelectedDate: (date) => set({ selectedDate: date }),

  reset: () =>
    set({
      ownerId: null,
      workouts: {},
      selectedDate: dayjs().format("YYYY-MM-DD"),
      loading: false,
      error: null,
    }),

  fetchRoutineFromFirestore: async (userId: string) => {
    try {
      const { ownerId } = get();

      // If the user changed, wipe previous user's data first
      if (ownerId && ownerId !== userId) {
        set({ workouts: {}, selectedDate: dayjs().format("YYYY-MM-DD") });
      }

      set({ ownerId: userId, loading: true, error: null });

      const routinesRef = collection(FIRESTORE_DB, "users", userId, "routines");
      const querySnapshot = await getDocs(routinesRef);

      const fetched: Record<string, Day> = {};
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<Day>;
        fetched[docSnap.id] = {
          exercises: Array.isArray(data.exercises) ? (data.exercises as RoutineExercise[]) : [],
          completed: !!data.completed,
          title: data.title || "",
        };
      });

      set({ workouts: fetched, loading: false });
    } catch (error: any) {
      console.error("Error fetching routine:", error);
      set({ loading: false, error: error?.message ?? "Failed to load routine" });
      Toast.show({ type: "error", text1: "Failed to load routine" });
    }
  },

  saveDayRoutine: async (userId, date) => {
    const { workouts } = get();
    try {
      const ref = doc(FIRESTORE_DB, "users", userId, "routines", date);
      const cleaned = JSON.parse(JSON.stringify(workouts[date] ?? { exercises: [], completed: false }));
      await setDoc(ref, cleaned, { merge: true });
    } catch (error) {
      console.error("Error saving routine:", error);
      Toast.show({ type: "error", text1: "Failed to save routine" });
    }
  },

  getCompletedDates: () => {
    const { workouts } = get();
    return Object.entries(workouts)
      .filter(([, day]) => day?.completed)
      .map(([date]) => {
        const d = dayjs(date, ["YYYY-MM-DD", "DD/MMM/YYYY"]);
        return d.isValid() ? d.format("YYYY-MM-DD") : null;
      })
      .filter((d): d is string => !!d);
  },

  addExercise: (userId, exercise) => {
    const { workouts, selectedDate, saveDayRoutine, ownerId } = get();
    if (ownerId && ownerId !== userId) {
      set({ ownerId: userId, workouts: {}, selectedDate: dayjs().format("YYYY-MM-DD") });
    }

    const prevDay: Day =
      workouts[selectedDate] ?? { exercises: [], completed: false, title: "" };

    // If this day was a Rest Day, rename it. 
    const wasRestDay =
      typeof prevDay.title === "string" && /rest\s*day/i.test(prevDay.title);

    const nextDay: Day = {
      ...prevDay,
      title: wasRestDay ? "Custom Workout" : (prevDay.title || "Custom Workout"),
      exercises: [...prevDay.exercises, exercise],
    };

    set({ workouts: { ...workouts, [selectedDate]: nextDay } });
    saveDayRoutine(userId, selectedDate);
  },


  editExercise: (userId, exerciseId, updates) => {
    const { workouts, selectedDate, saveDayRoutine, ownerId } = get();
    if (ownerId && ownerId !== userId) return;
    const day = workouts[selectedDate];
    if (!day) return;
    const updated = day.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...updates } : ex));
    set({ workouts: { ...workouts, [selectedDate]: { ...day, exercises: updated } } });
    saveDayRoutine(userId, selectedDate);
  },

  deleteExercise: (userId, exerciseId) => {
    const { workouts, selectedDate, saveDayRoutine, ownerId } = get();
    if (ownerId && ownerId !== userId) return;

    const day = workouts[selectedDate];
    if (!day) return;

    const filtered = day.exercises.filter((ex) => ex.id !== exerciseId);

    const next: Day = {
      ...day,
      exercises: filtered,
      title: filtered.length === 0 ? "Rest Day" : (day.title || "Custom Workout"),
      completed: filtered.length === 0 ? false : day.completed,
    };

    set({ workouts: { ...workouts, [selectedDate]: next } });
    saveDayRoutine(userId, selectedDate);
  },


  reorderExercises: (userId, newExercises) => {
    const { workouts, selectedDate, saveDayRoutine, ownerId } = get();
    if (ownerId && ownerId !== userId) return;
    const day = workouts[selectedDate];
    if (!day) return;
    set({ workouts: { ...workouts, [selectedDate]: { ...day, exercises: newExercises } } });
    saveDayRoutine(userId, selectedDate);
  },

  setCompleted: (userId, completed) => {
    const { workouts, selectedDate, saveDayRoutine, ownerId } = get();
    if (ownerId && ownerId !== userId) return;
    const day = workouts[selectedDate] ?? { exercises: [], completed: false };
    const next = { ...workouts, [selectedDate]: { ...day, completed } };
    set({ workouts: next });
    saveDayRoutine(userId, selectedDate);
  },
}));
