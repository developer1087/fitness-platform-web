// Nutrition and Diet Types for Fitness Platform

export interface NutritionProfile {
  userId: string;

  // Goals
  dailyCalorieGoal: number;
  macroGoals: MacroGoals;
  dietaryPreferences: DietaryPreference[];
  allergies: string[];
  restrictions: DietaryRestriction[];

  // Tracking Preferences
  trackMacros: boolean;
  trackMicros: boolean;
  trackWater: boolean;
  trackSupplements: boolean;

  // Settings
  mealTimings: MealTiming[];
  defaultPortionSizes: PortionSizes;

  updatedAt: Date;
}

export interface MacroGoals {
  protein: MacroTarget; // grams
  carbs: MacroTarget;   // grams
  fat: MacroTarget;     // grams
  fiber?: number;       // grams
}

export interface MacroTarget {
  grams: number;
  percentage: number; // of total calories
  calories: number;
}

export type DietaryPreference =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'paleo'
  | 'mediterranean'
  | 'low_carb'
  | 'low_fat'
  | 'intermittent_fasting'
  | 'carnivore'
  | 'flexitarian'
  | 'whole30'
  | 'dairy_free'
  | 'gluten_free';

export type DietaryRestriction =
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'soy_free'
  | 'egg_free'
  | 'shellfish_free'
  | 'halal'
  | 'kosher'
  | 'low_sodium'
  | 'low_sugar'
  | 'organic_only';

export interface MealTiming {
  meal: MealType;
  targetTime: string; // HH:MM format
  caloriePercentage: number; // % of daily calories
}

export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner'
  | 'evening_snack'
  | 'pre_workout'
  | 'post_workout';

export interface PortionSizes {
  [foodCategory: string]: {
    unit: string;
    defaultAmount: number;
  };
}

// Food and Nutrition Data
export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;

  // Nutritional Information (per 100g/100ml)
  nutrition: NutritionInfo;

  // Categories
  category: FoodCategory;
  subcategory?: string;

  // Serving Information
  servingSizes: ServingSize[];
  defaultServingSize: string;

  // Verification
  verified: boolean;
  source: 'user' | 'database' | 'usda' | 'branded';

  // Usage
  popularity: number;
  timesLogged: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionInfo {
  // Macronutrients (per 100g)
  calories: number;
  protein: number;       // grams
  carbs: number;         // grams
  fat: number;           // grams
  fiber?: number;        // grams
  sugar?: number;        // grams
  saturatedFat?: number; // grams
  transFat?: number;     // grams
  cholesterol?: number;  // mg

  // Micronutrients
  sodium?: number;       // mg
  potassium?: number;    // mg
  calcium?: number;      // mg
  iron?: number;         // mg
  vitaminA?: number;     // IU
  vitaminC?: number;     // mg
  vitaminD?: number;     // IU

  // Additional nutrients
  omega3?: number;       // grams
  caffeine?: number;     // mg
  alcohol?: number;      // grams
}

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'protein'
  | 'dairy'
  | 'nuts_seeds'
  | 'legumes'
  | 'oils_fats'
  | 'beverages'
  | 'snacks'
  | 'sweets'
  | 'condiments'
  | 'supplements'
  | 'prepared_foods'
  | 'fast_food'
  | 'alcohol';

export interface ServingSize {
  name: string;          // e.g., "1 cup", "1 medium apple"
  grams: number;         // weight in grams
  unit: string;          // "cup", "piece", "slice"
  description?: string;
}

// Meal and Food Logging
export interface MealEntry {
  id: string;
  userId: string;
  date: Date; // Date only, no time
  meal: MealType;

  // Foods
  foods: FoodEntry[];

  // Totals (calculated)
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;

  // Notes
  notes?: string;
  mood?: 'very_hungry' | 'hungry' | 'satisfied' | 'full' | 'overfull';
  cravings?: string[];

  // Social
  isPublic: boolean;
  photos?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface FoodEntry {
  id: string;
  foodId: string;
  food: Food; // Populated food data

  // Serving
  amount: number;
  unit: string;
  grams: number; // Calculated weight

  // Calculated Nutrition
  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  // Custom adjustments
  customNutrition?: Partial<NutritionInfo>;
  notes?: string;
}

// Recipes and Meal Planning
export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: RecipeCategory;

  // Preparation
  prepTime: number;      // minutes
  cookTime: number;      // minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';

  // Ingredients
  ingredients: RecipeIngredient[];

  // Instructions
  instructions: RecipeStep[];

  // Nutrition (calculated from ingredients)
  nutritionPerServing: NutritionInfo;

  // Tags
  tags: string[];
  dietaryFlags: DietaryPreference[];

  // Media
  photos: string[];
  video?: string;

  // Social
  createdBy: string; // User ID
  isPublic: boolean;
  rating: number;
  totalRatings: number;
  saves: number;

  createdAt: Date;
  updatedAt: Date;
}

export type RecipeCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'dessert'
  | 'beverage'
  | 'appetizer'
  | 'side_dish'
  | 'sauce'
  | 'protein_shake'
  | 'meal_prep';

export interface RecipeIngredient {
  foodId: string;
  food: Food;
  amount: number;
  unit: string;
  notes?: string;
  optional?: boolean;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  duration?: number; // minutes
  temperature?: number; // celsius
  notes?: string;
}

// Meal Planning
export interface MealPlan {
  id: string;
  userId: string;
  name: string;
  startDate: Date;
  endDate: Date;

  // Plan Structure
  dailyPlans: DailyMealPlan[];

  // Goals
  targetCalories: number;
  targetMacros: MacroGoals;

  // Preferences
  allowRepeats: boolean;
  includeSnacks: boolean;
  dietaryPreferences: DietaryPreference[];

  // Generation
  autoGenerated: boolean;
  generationCriteria?: MealPlanCriteria;

  createdAt: Date;
  updatedAt: Date;
}

export interface DailyMealPlan {
  date: Date;
  meals: PlannedMeal[];
  totalCalories: number;
  totalMacros: MacroGoals;
}

export interface PlannedMeal {
  meal: MealType;
  recipeId?: string;
  recipe?: Recipe;
  foods?: FoodEntry[];
  notes?: string;
  prepared: boolean;
}

export interface MealPlanCriteria {
  maxPrepTime: number;
  budgetPerServing?: number;
  avoidIngredients: string[];
  favoriteIngredients: string[];
  mealVariety: 'low' | 'medium' | 'high';
}

// Water Tracking
export interface WaterEntry {
  id: string;
  userId: string;
  date: Date;
  amount: number; // ml
  type: WaterType;
  timestamp: Date;
}

export type WaterType =
  | 'water'
  | 'sparkling_water'
  | 'tea'
  | 'coffee'
  | 'sports_drink'
  | 'other';

// Supplement Tracking
export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  type: SupplementType;
  form: SupplementForm;

  // Dosage
  servingSize: number;
  servingUnit: string;
  activeIngredients: SupplementIngredient[];

  // Usage
  recommendedDosage?: string;
  timingRecommendations?: string[];
  warnings?: string[];

  verified: boolean;
}

export type SupplementType =
  | 'protein'
  | 'creatine'
  | 'pre_workout'
  | 'post_workout'
  | 'bcaa'
  | 'multivitamin'
  | 'vitamin_d'
  | 'omega_3'
  | 'probiotics'
  | 'magnesium'
  | 'zinc'
  | 'iron'
  | 'calcium'
  | 'b_complex'
  | 'nootropic'
  | 'fat_burner'
  | 'joint_support'
  | 'sleep_aid';

export type SupplementForm =
  | 'powder'
  | 'capsule'
  | 'tablet'
  | 'liquid'
  | 'gummy'
  | 'chewable';

export interface SupplementIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface SupplementEntry {
  id: string;
  userId: string;
  supplementId: string;
  supplement: Supplement;

  // Dosage taken
  amount: number;
  unit: string;

  // Timing
  date: Date;
  timestamp: Date;
  timing: SupplementTiming;

  notes?: string;
}

export type SupplementTiming =
  | 'morning'
  | 'pre_workout'
  | 'post_workout'
  | 'with_meal'
  | 'between_meals'
  | 'evening'
  | 'before_bed';

// Nutrition Analysis and Progress
export interface NutritionProgress {
  userId: string;
  date: Date;

  // Daily Totals
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalWater: number; // ml

  // Goals Comparison
  calorieGoalMet: boolean;
  proteinGoalMet: boolean;
  carbGoalMet: boolean;
  fatGoalMet: boolean;

  // Percentages
  calorieGoalPercentage: number;
  macroDistribution: MacroDistribution;

  // Quality Metrics
  processedFoodPercentage: number;
  vegetableServings: number;
  fruitServings: number;

  // Meal Distribution
  mealDistribution: {
    [key in MealType]?: number; // calories
  };
}

export interface MacroDistribution {
  proteinPercentage: number;
  carbPercentage: number;
  fatPercentage: number;
}