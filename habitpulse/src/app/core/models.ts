export type HabitCategory = 'Health' | 'Fitness' | 'Productivity' | 'Upskilling';

export interface AppUser {
  id: string;
  email: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  category: HabitCategory;
  goal: number;
  unit: string;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  value: number;
  completed: boolean;
}
