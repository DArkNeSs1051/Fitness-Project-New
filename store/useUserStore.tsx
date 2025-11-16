import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
  _unsub?: () => void;
  listenUserDoc: (userId: string) => void;
  stopListen: () => void;

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

const toNum = (v: any): number | undefined => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
};

const normalizeUser = (userId: string, raw: any): UserProfile => ({
  id: userId,
  ...raw,
  age: toNum(raw?.age),
  height: toNum(raw?.height),
  weight: toNum(raw?.weight),
  workoutDay: toNum(raw?.workoutDay ?? raw?.day),
  createdAt: toMaybeDate(raw?.createdAt) ?? raw?.createdAt,
  updatedAt: toMaybeDate(raw?.updatedAt) ?? raw?.updatedAt,
  birthday: toMaybeDate(raw?.birthday) ?? raw?.birthday,
});

export const useUserStore = create<UserStore>((set, get) => ({
  ownerId: null,
  user: null,
  isProfileComplete: false,
  isLoading: false,
  error: null,


  listenUserDoc: (userId) => {
    const prev = get()._unsub;
    if (prev) prev();

    set({ ownerId: userId, isLoading: true, error: null });

    const ref = doc(FIRESTORE_DB, 'users', userId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = normalizeUser(userId, snap.data());
          set({ user: data, isLoading: false });
          get().checkProfileCompletion();
        } else {
          const newUser: UserProfile = {
            id: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set({ user: newUser, isLoading: false });
        }
      },
      (err) => {
        console.error('Realtime user listener error:', err);
        set({ error: 'Failed to listen user data', isLoading: false });
      }
    );

    set({ _unsub: unsub });
  },

  stopListen: () => {
    const prev = get()._unsub;
    if (prev) prev();
    set({ _unsub: undefined });
  },

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
    const prev = get()._unsub;
    if (prev) prev();
    set({
      ownerId: null,
      user: null,
      isProfileComplete: false,
      isLoading: false,
      error: null,
      _unsub: undefined,
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
      if (get().ownerId !== userId) {
        set({ ownerId: userId, user: null });
      }
      set({ isLoading: true, error: null });

      const docRef = doc(FIRESTORE_DB, 'users', userId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        set({ user: normalizeUser(userId, snap.data()) });
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
        age: toNum(rest.age),
        height: toNum(rest.height),
        weight: toNum(rest.weight),
        workoutDay: toNum((rest as any).workoutDay ?? (rest as any).day),
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
