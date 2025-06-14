// src/types/index.ts

// User related types
export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    height?: number; // in cm
    weight?: number; // in kg
    age?: number;
    gender?: 'male' | 'female' | 'other';
    goalType?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_fitness';
    activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Workout related types
  export interface Exercise {
    id: string;
    name: string;
    description: string;
    instructions: string[];
    videoUrl?: string;
    imageUrl?: string;
    category: 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'full_body';
    equipment: string[];
    muscles: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }
  
  export interface ExerciseSet {
    id: string;
    exerciseId: string;
    reps?: number;
    weight?: number; // in kg
    duration?: number; // in seconds
    distance?: number; // in meters
    restTime?: number; // in seconds
    isCompleted: boolean;
  }
  
  export interface WorkoutExercise {
    id: string;
    exerciseId: string;
    exercise?: Exercise;
    order: number;
    sets: ExerciseSet[];
    notes?: string;
  }
  
  export interface Workout {
    id: string;
    name: string;
    description?: string;
    exercises: WorkoutExercise[];
    duration: number; // in minutes
    caloriesBurned?: number;
    date: Date;
    isCompleted: boolean;
    userId: string;
  }
  
  export interface WorkoutRoutine {
    id: string;
    name: string;
    description?: string;
    days: {
      dayOfWeek: number; // 0-6 (Sunday-Saturday)
      workout?: Workout;
      isRestDay: boolean;
    }[];
    userId: string;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  }
  
  // Nutrition related types
  export interface Food {
    id: string;
    name: string;
    calories: number;
    protein: number; // in grams
    carbs: number; // in grams
  }