export type ActivityLevel =
  | 'sedentary'
  | 'lightly active'
  | 'moderately active'
  | 'very active'
  | 'super active';


interface UserInput {
  gender: string;
  weight: number; // in kg
  height: number; // in cm
  age: number; // in years
  activity: ActivityLevel;
  goal: string;
}

interface MacroResult {
  tdee: number;
  adjustedTdee: number;
  protein: number; // in grams
  fat: number; // in grams
  carbs: number; // in grams
}

export function calculateTDEEAndMacros(user: UserInput): MacroResult {
  const { gender, weight, height, age, activity, goal } = user;

  // 1. Calculate BMR
  let BMR =
    gender === 'male'
      ? (13.7 * weight) + (5 * height) - (8 * age) + 66
      : (9.6 * weight) + (8 * height) - (4.7 * age) + 655;

  // 2. Apply activity multiplier
  const activityMultipliers: Record<ActivityLevel, number> = {
    'sedentary': 1.2,
    'lightly active': 1.375,
    'moderately active': 1.55,
    'very active': 1.725,
    'super active': 1.9,
  };

  const TDEE = BMR * (activityMultipliers[activity] || 1.2);

  // 3. Adjust TDEE based on goal
  let adjustedTdee = TDEE;
  if (goal === 'lose weight') adjustedTdee -= 200;
  else if (goal === 'gain muscle') adjustedTdee += 300;

  // 4. Macronutrient distribution
  // Protein per kg
  const proteinPerKg =
    goal === 'gain muscle' ? 2.2 : goal === 'lose weight' ? 2.0 : 1.8;
  const protein = Math.round(weight * proteinPerKg);
  const proteinKcal = protein * 4;

  // Fat percent
  const fatPercent = goal === 'gain muscle' ? 0.25 : 0.3;
  const fatKcal = adjustedTdee * fatPercent;
  const fat = Math.round(fatKcal / 9);

  // Carbs = remaining kcal
  const remainingKcal = adjustedTdee - (proteinKcal + fat * 9);
  const carbs = Math.round(remainingKcal / 4);

  return {
    tdee: Math.round(TDEE),
    adjustedTdee: Math.round(adjustedTdee),
    protein,
    fat,
    carbs,
  };
}
