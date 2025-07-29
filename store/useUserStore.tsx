import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../firebase';

type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  birthday?: Date;
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  activity?: string;
  goal?: 'lose weight' | 'gain muscle' | 'maintain weight';
  workoutDay?: number;
  // Optional fields that might be used in ProfileScreen
  username?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type UserStore = {
  user: UserProfile | null;
  isProfileComplete: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Core actions
  setUserData: (data: Partial<UserProfile>) => void;
  clearUserData: () => void;
  
  // Firestore operations - both now take userId parameter for consistency
  loadUserDataFromFirestore: (userId: string) => Promise<void>;
  saveUserDataToFirestore: (userId: string) => Promise<void>;
  
  // Utility methods
  checkProfileCompletion: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isProfileComplete: false,
  isLoading: false,
  error: null,

  setUserData: (data) => {
    const currentUser = get().user;
    const updatedUser = { 
      ...currentUser, 
      ...data,
      updatedAt: new Date()
    } as UserProfile;
    
    set({ user: updatedUser });
    get().checkProfileCompletion();
  },

  clearUserData: () => {
    set({ 
      user: null, 
      isProfileComplete: false,
      error: null 
    });
  },

  checkProfileCompletion: () => {
    const user = get().user;
    if (!user) {
      set({ isProfileComplete: false });
      return;
    }

    const isComplete =
      !!user.firstName &&
      !!user.lastName &&
      !!user.email &&
      !!user.age &&
      !!user.birthday &&
      !!user.gender &&
      !!user.height &&
      !!user.weight &&
      !!user.level &&
      !!user.goal &&
      !!user.workoutDay;

    set({ isProfileComplete: isComplete });
  },

  setError: (error) => {
    set({ error });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  loadUserDataFromFirestore: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      
      const docRef = doc(FIRESTORE_DB, 'users', userId);
      const snapshot = await getDoc(docRef);
      
      if (snapshot.exists()) {
        const userData = { 
          id: userId, 
          ...snapshot.data(),
          // Convert Firestore timestamps back to Date objects if needed
          createdAt: snapshot.data().createdAt?.toDate?.() || snapshot.data().createdAt,
          updatedAt: snapshot.data().updatedAt?.toDate?.() || snapshot.data().updatedAt,
        } as UserProfile;
        
        get().setUserData(userData);
      } else {
        // User document doesn't exist, create a basic profile
        const newUser: UserProfile = {
          id: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set({ user: newUser });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      set({ error: 'Failed to load user data' });
    } finally {
      set({ isLoading: false });
    }
  },

  //Explicit userId parameter 
  saveUserDataToFirestore: async (userId) => {
    const { user } = get();
    if (!user) {
      set({ error: 'No user data to save' });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      const docRef = doc(FIRESTORE_DB, 'users', userId);
      const { id, ...dataToSave } = user;
      
      // Ensure updatedAt is set
      const finalData = {
        ...dataToSave,
        updatedAt: new Date(),
        // Set createdAt if it doesn't exist
        createdAt: dataToSave.createdAt || new Date()
      };
      
      await setDoc(docRef, finalData, { merge: true });
      
      // Update local state with the saved timestamp and correct ID
      set({ 
        user: { ...user, id: userId, updatedAt: finalData.updatedAt }
      });
      
    } catch (error) {
      console.error('Error saving user data:', error);
      set({ error: 'Failed to save user data' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));