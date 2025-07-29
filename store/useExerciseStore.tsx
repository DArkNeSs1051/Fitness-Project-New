import { create } from 'zustand';
import { getDocs, collection } from 'firebase/firestore';
import { FIRESTORE_DB } from '../firebase';

type Exercise = {
  id: string;
  name: string;
  videoUrl?: string;
  instructions?: string[];
};

type ExerciseStore = {
  exercises: Exercise[];
  fetchExercises: () => Promise<void>;
};

export const useExerciseStore = create<ExerciseStore>((set) => ({
  exercises: [],
  fetchExercises: async () => {
    const snapshot = await getDocs(collection(FIRESTORE_DB, "exercises"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      ...doc.data(),
    }));
    set({ exercises: data });
  },
}));