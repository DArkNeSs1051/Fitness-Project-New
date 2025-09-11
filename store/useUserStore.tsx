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
  username?: string;
  createdAt?: Date;
  updatedAt?: Date;
  equipment?: string;
};

type UserStore = {
  ownerId: string | null;
  user: UserProfile | null;
  isProfileComplete: boolean;
  isLoading: boolean;
  error: string | null;
  setUserData: (data: Partial<UserProfile>) => void;
  clearUserData: () => void;
  reset: () => void;
  loadUserDataFromFirestore: (userId: string) => Promise<void>;
  saveUserDataToFirestore: (userId: string) => Promise<void>;
  checkProfileCompletion: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
};

const toMaybeDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  return undefined;
};

export const useUserStore = create<UserStore>((set, get) => ({
  ownerId: null,

  user: null,
  isProfileComplete: false,
  isLoading: false,
  error: null,

  setUserData: (data) => {
    const current = get().user ?? ({ id: '' } as UserProfile);
    const updated: UserProfile = {
      ...current,
      ...data,
      id: (data.id ?? current.id) as string,
      updatedAt: new Date(),
    };
    set({ user: updated });
    get().checkProfileCompletion();
  },

  clearUserData: () => {
    set({
      user: null,
      isProfileComplete: false,
      error: null,
    });
  },

  reset: () => {
    set({
      ownerId: null,
      user: null,
      isProfileComplete: false,
      isLoading: false,
      error: null,
    });
  },

  checkProfileCompletion: () => {
    const u = get().user;
    if (!u) {
      set({ isProfileComplete: false });
      return;
    }
    const isComplete =
      !!u.firstName &&
      !!u.lastName &&
      !!u.email &&
      !!u.age &&
      !!u.birthday &&
      !!u.gender &&
      !!u.height &&
      !!u.weight &&
      !!u.level &&
      !!u.goal &&
      !!u.workoutDay;
    set({ isProfileComplete: isComplete });
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  loadUserDataFromFirestore: async (userId) => {
    try {
      // switching users, clear data and set new ownerId
      if (get().ownerId !== userId) {
        set({ ownerId: userId, user: null });
      }

      set({ isLoading: true, error: null });

      const docRef = doc(FIRESTORE_DB, 'users', userId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const raw = snap.data() as any;
        const userData: UserProfile = {
          id: userId,
          ...raw,
          createdAt: toMaybeDate(raw.createdAt) ?? raw.createdAt,
          updatedAt: toMaybeDate(raw.updatedAt) ?? raw.updatedAt,
          birthday: toMaybeDate(raw.birthday) ?? raw.birthday,
        };
        set({ user: userData });
      } else {
        const newUser: UserProfile = {
          id: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set({ user: newUser });
      }

      get().checkProfileCompletion();
    } catch (err) {
      console.error('Error loading user data:', err);
      set({ error: 'Failed to load user data' });
    } finally {
      set({ isLoading: false });
    }
  },

  saveUserDataToFirestore: async (userId) => {
    const { user } = get();
    if (!user) {
      set({ error: 'No user data to save' });
      return;
    }
    try {
      set({ isLoading: true, error: null });

      const docRef = doc(FIRESTORE_DB, 'users', userId);

      const { id: _omit, ...rest } = user;
      const finalData = {
        ...rest,
        updatedAt: new Date(),
        createdAt: rest.createdAt ?? new Date(),
      };

      await setDoc(docRef, finalData, { merge: true });
      set({
        ownerId: userId,
        user: { ...user, id: userId, updatedAt: finalData.updatedAt },
      });

      get().checkProfileCompletion();
    } catch (err) {
      console.error('Error saving user data:', err);
      set({ error: 'Failed to save user data' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
