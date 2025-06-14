import React, { createContext, useContext, useState } from 'react';

export type Exercise = {
  id: number;
  name: string;
  category: string;
  muscles: string[];
  equipment: string;
  description: string;
  image: string;
  hasVideo: boolean;
};

type WorkoutContextType = {
  pendingExercise: Exercise | null;
  setPendingExercise: (exercise: Exercise | null) => void;
};

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export const WorkoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [pendingExercise, setPendingExercise] = useState<Exercise | null>(null);

  return (
    <WorkoutContext.Provider value={{ pendingExercise, setPendingExercise }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkoutContext = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkoutContext must be used within a WorkoutProvider");
  return context;
};
