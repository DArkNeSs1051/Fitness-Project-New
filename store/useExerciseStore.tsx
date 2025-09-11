import { create } from 'zustand';
import { getDocs, collection } from 'firebase/firestore';
import { FIRESTORE_DB } from '../firebase';
import { ExerciseFromLibrary } from '../types/Type';

type ExerciseStore = {
  exercises: ExerciseFromLibrary[];
  fetchExercises: () => Promise<void>;
};

export const useExerciseStore = create<ExerciseStore>((set) => ({
  exercises: [],
  fetchExercises: async () => {
  const snapshot = await getDocs(collection(FIRESTORE_DB, "exercises"));
  const data = snapshot.docs.map((doc) => {
    const docData = doc.data();
    return {
      id: docData.id,
      name: docData.name,
      videoUrl: docData.videoUrl,
      image: docData.image,
      equipment: docData.equipment,
      muscleGroups: docData.muscleGroups,
      description: docData.description,
      instruction: docData.instruction,
      category: docData.category,     
      difficulty: docData.difficulty,

    };
  });
  set({ exercises: data });
},
}));