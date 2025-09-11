import { create } from "zustand";
import { formInterface } from "~/app/auth/question";

type FormState = {
  form: formInterface;
  setForm: (
    f:
      | Record<string, any>
      | ((prev: Record<string, any>) => Record<string, any>)
  ) => void;
};

export const useFitnessFormStore = create<FormState>((set) => ({
  form: {
    gender: "",
    age: "0",
    birthday: null,
    weight: "",
    weightUnit: "kg",
    height: "",
    heightUnit: "cm",
    level: "beginner",
    goal: "lose weight",
    equipment: "None",
    activity: "sedentary",
    updatedAt: "",
    workoutDay: 1,
    index: 1,
  },
  setForm: (f) =>
    set((state) => ({
      form: typeof f === "function" ? f(state.form) : f,
    })),
}));
