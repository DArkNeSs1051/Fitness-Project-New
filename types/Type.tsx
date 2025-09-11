// User related types
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    height?: number; 
    weight?: number; 
    age?: number;
    gender?: 'male' | 'female' | 'other';
    goalType?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_fitness';
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Workout related types
  export interface Exercise {
    category: string;
    id: string;
    name: string;
    videoUrl?: string;
    image?: string;
    equipment?: string;
    difficulty?: string;
    muscleGroups?: string[];
    description?: string;
    instruction?: string[];
  }

  export interface RoutineExercise{
    exercise: string;
    id: string;
    reps: string;
    rest: string;
    sets: string;
    target: string;
  }

  export interface ExerciseFromLibrary{
    category: string;
    id: string;
    description: string;
    difficulty: string;
    equipment: string;
    image: string;
    instruction: string[];
    muscleGroups: string[];
    name: string;
    videoUrl: string;
  }
  
  export interface ExerciseSet {
    id: string;
    exerciseId: string;
    reps?: number;
    weight?: number; 
    duration?: number; 
    restTime?: number; 
    isCompleted: boolean;
  }

  
  // Nutrition
  export interface Food {
    id: string;
    name: string;
    calories: number;
    protein: number; 
    carbs: number; 
  }