type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'super_active';

type FitnessGoal = 'weight_loss' | 'maintenance' | 'muscle_gain';

interface UserInput {
  gender: 'male' | 'female';
  weight: number; // in kg
  height: number; // in cm
  age: number; // in years
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
}

interface MacroResult {
  tdee: number;
  adjustedTdee: number;
  protein: number; // in grams
  fat: number; // in grams
  carbs: number; // in grams
}

export function calculateTDEEAndMacros(user: UserInput): MacroResult {
  const { gender, weight, height, age, activityLevel, goal } = user;

  // 1. Calculate BMR
  let BMR =
    gender === 'male'
      ? (13.7 * weight) + (5 * height) - (8 * age) + 66
      : (9.6 * weight) + (8 * height) - (4.7 * age) + 655;

  // 2. Apply activity multiplier
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    super_active: 1.9,
  };

  const TDEE = BMR * (activityMultipliers[activityLevel] || 1.2);

  // 3. Adjust TDEE based on goal
  let adjustedTdee = TDEE;
  if (goal === 'weight_loss') adjustedTdee -= 200;
  else if (goal === 'muscle_gain') adjustedTdee += 300;

  // 4. Macronutrient distribution
  // Protein per kg
  const proteinPerKg =
    goal === 'muscle_gain' ? 2.2 : goal === 'weight_loss' ? 2.0 : 1.8;
  const protein = Math.round(weight * proteinPerKg);
  const proteinKcal = protein * 4;

  // Fat percent
  const fatPercent = goal === 'muscle_gain' ? 0.25 : 0.3;
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
