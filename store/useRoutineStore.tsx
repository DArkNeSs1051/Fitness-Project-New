import { create } from "zustand";
import {
  collection,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { FIRESTORE_DB } from "../firebase";
import { Exercise } from "../types/Type";
import Toast from "react-native-toast-message";

interface RoutineStore {
  workouts: { [date: string]: { exercises: Exercise[]; completed: boolean } };
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  fetchRoutineFromFirestore: (userId: string) => Promise<void>;
  saveDayRoutine: (userId: string, date: string) => Promise<void>;
  addExercise: (userId: string, exercise: Exercise) => void;
  editExercise: (userId: string, exerciseId: string, updates: Partial<Exercise>) => void;
  deleteExercise: (userId: string, exerciseId: string) => void;
  reorderExercises: (userId: string, newExercises: Exercise[]) => void;
  setCompleted: (userId: string, completed: boolean) => void;
}

export const useRoutineStore = create<RoutineStore>((set, get) => ({
  workouts: {},
  selectedDate: "",
  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchRoutineFromFirestore: async (userId: string) => {
    try {
      const routinesRef = collection(FIRESTORE_DB, "users", userId, "routines");
      const querySnapshot = await getDocs(routinesRef);

      const fetchedRoutine: { [key: string]: { exercises: Exercise[], completed: boolean } } = {};

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        fetchedRoutine[docSnap.id] = {
          exercises: data.exercises || [],
          completed: data.completed || false
        };
      });

      set({ workouts: fetchedRoutine });
    } catch (error) {
      console.error("Error fetching routine:", error);
      Toast.show({ type: "error", text1: "Failed to load routine" });
    }
  },

  saveDayRoutine: async (userId, date) => {
  const { workouts } = get();
  try {
    const ref = doc(FIRESTORE_DB, "users", userId, "routines", date);

    // Remove undefined values 
    const cleanedData = JSON.parse(JSON.stringify(workouts[date]));

    await setDoc(ref, cleanedData, { merge: true });
  } catch (error) {
    console.error("Error saving routine:", error);
    Toast.show({ type: "error", text1: "Failed to save routine" });
  }
},


  addExercise: (userId, exercise) => {
    const { workouts, selectedDate, saveDayRoutine } = get();
    const currentWorkout = workouts[selectedDate] || { exercises: [], completed: false };
    
    const updated = {
      ...workouts,
      [selectedDate]: {
        exercises: [...currentWorkout.exercises, exercise],
        completed: currentWorkout.completed,
      },
    };
    set({ workouts: updated });
    saveDayRoutine(userId, selectedDate);
  },

  editExercise: (userId, exerciseId, updates) => {
    const { workouts, selectedDate, saveDayRoutine } = get();
    const currentWorkout = workouts[selectedDate];
    
    if (!currentWorkout) return;
    
    const updatedExercises = currentWorkout.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    );
    
    set({
      workouts: {
        ...workouts,
        [selectedDate]: {
          exercises: updatedExercises,
          completed: currentWorkout.completed,
        },
      },
    });
    saveDayRoutine(userId, selectedDate);
  },

  deleteExercise: (userId, exerciseId) => {
    const { workouts, selectedDate, saveDayRoutine } = get();
    const currentWorkout = workouts[selectedDate];
    
    if (!currentWorkout) return;
    
    const filteredExercises = currentWorkout.exercises.filter(
      (ex) => ex.id !== exerciseId
    );
    
    set({
      workouts: {
        ...workouts,
        [selectedDate]: {
          exercises: filteredExercises,
          completed: currentWorkout.completed,
        },
      },
    });
    saveDayRoutine(userId, selectedDate);
  },

  reorderExercises: (userId, newExercises) => {
    const { workouts, selectedDate, saveDayRoutine } = get();
    const currentWorkout = workouts[selectedDate];
    
    if (!currentWorkout) return;
    
    set({
      workouts: {
        ...workouts,
        [selectedDate]: {
          exercises: newExercises,
          completed: currentWorkout.completed,
        },
      },
    });
    saveDayRoutine(userId, selectedDate);
  },

  setCompleted: (userId, completed) => {
    const { workouts, selectedDate, saveDayRoutine } = get();
    const currentWorkout = workouts[selectedDate];
    
    if (!currentWorkout) {
      // If no workout exists for this date, create one
      set({
        workouts: {
          ...workouts,
          [selectedDate]: {
            exercises: [],
            completed,
          },
        },
      });
    } else {
      set({
        workouts: {
          ...workouts,
          [selectedDate]: {
            ...currentWorkout,
            completed,
          },
        },
      });
    }
    
    saveDayRoutine(userId, selectedDate);
  },
}));