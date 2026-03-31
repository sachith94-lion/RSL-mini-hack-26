import { Injectable, NgZone, computed, effect, inject, signal } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { Habit, HabitCategory, HabitLog } from './models';
import { AuthService } from './auth.service';
import { firestore } from './firebase';

const HABITS_KEY = 'habitpulse:habits';
const LOGS_KEY = 'habitpulse:logs';
const LOGIN_MODE_KEY = 'habitpulse:loginMode';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly zone = inject(NgZone);

  readonly categories: HabitCategory[] = ['Health', 'Fitness', 'Productivity', 'Upskilling'];

  private readonly habitsSignal = signal<Habit[]>([]);
  private readonly logsSignal = signal<HabitLog[]>([]);
  private readonly firestoreErrorSignal = signal<string | null>(null);
  private habitsUnsubscribe?: () => void;
  private logsUnsubscribe?: () => void;

  readonly habits = computed(() => {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return [];
    return this.habitsSignal().filter((habit) => String(habit.userId) === String(userId));
  });

  readonly logs = computed(() => {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return [];
    return this.logsSignal().filter((log) => String(log.userId) === String(userId));
  });

  readonly firestoreError = computed(() => this.firestoreErrorSignal());

  readonly todayKey = computed(() => new Date().toISOString().split('T')[0]);

  readonly todayProgress = computed(() => {
    const habits = this.habits();
    if (!habits.length) return 0;
    const completeCount = habits.filter((habit) => this.isHabitDoneToday(habit.id)).length;
    return Math.round((completeCount / habits.length) * 100);
  });

  readonly weeklySeries = computed(() => {
    const days = this.lastNDates(7);
    return days.map((day) => ({
      day,
      percentage: this.completionForDate(day)
    }));
  });

  readonly categoryBreakdown = computed(() => {
    const map = new Map<HabitCategory, number>();
    for (const category of this.categories) {
      map.set(category, 0);
    }
    for (const habit of this.habits()) {
      map.set(habit.category, (map.get(habit.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  });

  constructor(private readonly auth: AuthService) {
    effect(() => {
      const user = this.auth.currentUser();
      const resolved = this.auth.authStateResolved();
      const firebaseUid = this.auth.firebaseUid();

      this.stopListeners();
      this.firestoreErrorSignal.set(null);

      if (!user) {
        this.habitsSignal.set([]);
        this.logsSignal.set([]);
        return;
      }

      if (!resolved) {
        return;
      }

      const loginMode = localStorage.getItem(LOGIN_MODE_KEY);
      if (loginMode === 'google' && firebaseUid !== user.id) {
        return;
      }

      if (this.auth.useCloudData()) {
        this.subscribeFirestore(user.id);
      } else {
        this.loadFromLocalStorage(user.id);
      }
    });
  }

  addHabit(payload: { name: string; category: HabitCategory; goal: number; unit: string }): void {
    const user = this.auth.currentUser();
    if (!user) return;

    if (localStorage.getItem(LOGIN_MODE_KEY) === 'google' && !this.auth.useCloudData()) {
      this.firestoreErrorSignal.set('Still connecting to Firebase. Please wait a moment and try again.');
      return;
    }

    if (this.auth.useCloudData()) {
      const optimisticHabit: Habit = {
        id: `tmp-${crypto.randomUUID()}`,
        userId: user.id,
        name: payload.name.trim(),
        category: payload.category,
        goal: payload.goal,
        unit: payload.unit.trim(),
        createdAt: Date.now()
      };
      this.zone.run(() => {
        this.habitsSignal.set([optimisticHabit, ...this.habitsSignal()]);
      });

      void addDoc(collection(firestore, 'habits'), {
        userId: user.id,
        name: payload.name.trim(),
        category: payload.category,
        goal: payload.goal,
        unit: payload.unit.trim(),
        createdAt: Date.now()
      })
        .then(() => {
          this.zone.run(() => {
            this.firestoreErrorSignal.set(null);
          });
        })
        .catch((error: Error) => {
          this.zone.run(() => {
            this.habitsSignal.set(this.habitsSignal().filter((habit) => habit.id !== optimisticHabit.id));
            this.firestoreErrorSignal.set(error.message);
          });
        });
      return;
    }

    const habit: Habit = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: payload.name.trim(),
      category: payload.category,
      goal: payload.goal,
      unit: payload.unit.trim(),
      createdAt: Date.now()
    };
    const all = this.readStore<Habit>(HABITS_KEY);
    this.persist(HABITS_KEY, [habit, ...all]);
    this.loadFromLocalStorage(user.id);
  }

  updateHabit(id: string, changes: Partial<Pick<Habit, 'name' | 'category' | 'goal' | 'unit'>>): void {
    if (this.auth.useCloudData()) {
      void updateDoc(doc(firestore, 'habits', id), changes).catch((error: Error) =>
        this.firestoreErrorSignal.set(error.message)
      );
      return;
    }

    const all = this.readStore<Habit>(HABITS_KEY).map((habit) =>
      habit.id === id ? { ...habit, ...changes } : habit
    );
    this.persist(HABITS_KEY, all);
    this.habitsSignal.set(all.filter((habit) => habit.userId === this.auth.currentUser()?.id));
  }

  deleteHabit(id: string): void {
    if (this.auth.useCloudData()) {
      const batch = writeBatch(firestore);
      batch.delete(doc(firestore, 'habits', id));
      for (const log of this.logsSignal().filter((item) => item.habitId === id)) {
        batch.delete(doc(firestore, 'logs', log.id));
      }
      void batch.commit().catch((error: Error) => this.firestoreErrorSignal.set(error.message));
      return;
    }

    const habits = this.readStore<Habit>(HABITS_KEY).filter((habit) => habit.id !== id);
    const logs = this.readStore<HabitLog>(LOGS_KEY).filter((log) => log.habitId !== id);
    this.persist(HABITS_KEY, habits);
    this.persist(LOGS_KEY, logs);
    const uid = this.auth.currentUser()?.id;
    if (uid) {
      this.loadFromLocalStorage(uid);
    }
  }

  markProgress(habit: Habit, value: number): void {
    const user = this.auth.currentUser();
    if (!user) return;

    const today = this.todayKey();
    const existing = this.logsSignal().find(
      (log) => log.habitId === habit.id && log.date === today && log.userId === user.id
    );
    const completed = value >= habit.goal;

    if (this.auth.useCloudData()) {
      if (existing) {
        void updateDoc(doc(firestore, 'logs', existing.id), { value, completed }).catch((error: Error) =>
          this.firestoreErrorSignal.set(error.message)
        );
        return;
      }
      void addDoc(collection(firestore, 'logs'), {
        habitId: habit.id,
        userId: user.id,
        date: today,
        value,
        completed
      }).catch((error: Error) => this.firestoreErrorSignal.set(error.message));
      return;
    }

    if (existing) {
      const all = this.readStore<HabitLog>(LOGS_KEY).map((log) =>
        log.id === existing.id ? { ...log, value, completed } : log
      );
      this.persist(LOGS_KEY, all);
      this.loadFromLocalStorage(user.id);
      return;
    }

    const log: HabitLog = {
      id: crypto.randomUUID(),
      habitId: habit.id,
      userId: user.id,
      date: today,
      value,
      completed
    };
    const all = [log, ...this.readStore<HabitLog>(LOGS_KEY)];
    this.persist(LOGS_KEY, all);
    this.loadFromLocalStorage(user.id);
  }

  valueForToday(habitId: string): number {
    const log = this.logs().find((item) => item.habitId === habitId && item.date === this.todayKey());
    return log?.value ?? 0;
  }

  isHabitDoneToday(habitId: string): boolean {
    const log = this.logs().find((item) => item.habitId === habitId && item.date === this.todayKey());
    return Boolean(log?.completed);
  }

  private subscribeFirestore(userId: string): void {
    const habitsQuery = query(collection(firestore, 'habits'), where('userId', '==', userId));
    const logsQuery = query(collection(firestore, 'logs'), where('userId', '==', userId));

    this.habitsUnsubscribe = onSnapshot(
      habitsQuery,
      (snapshot) => {
        this.zone.run(() => {
          this.firestoreErrorSignal.set(null);
          const habits = snapshot.docs.map((item) => this.mapHabitDoc(item.id, item.data()));
          this.habitsSignal.set(habits);
        });
      },
      (error) => this.zone.run(() => this.firestoreErrorSignal.set(error.message))
    );

    this.logsUnsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        this.zone.run(() => {
          this.firestoreErrorSignal.set(null);
          const logs = snapshot.docs.map((item) => this.mapLogDoc(item.id, item.data()));
          this.logsSignal.set(logs);
        });
      },
      (error) => this.zone.run(() => this.firestoreErrorSignal.set(error.message))
    );
  }

  private mapHabitDoc(id: string, data: Record<string, unknown>): Habit {
    const rawCategory = String(data['category'] ?? 'Health');
    const category =
      this.categories.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ?? 'Health';
    return {
      id,
      userId: String(data['userId'] ?? ''),
      name: String(data['name'] ?? ''),
      category,
      goal: Number(data['goal'] ?? 1),
      unit: String(data['unit'] ?? ''),
      createdAt: Number(data['createdAt'] ?? Date.now())
    };
  }

  private mapLogDoc(id: string, data: Record<string, unknown>): HabitLog {
    return {
      id,
      userId: String(data['userId'] ?? ''),
      habitId: String(data['habitId'] ?? ''),
      date: String(data['date'] ?? ''),
      value: Number(data['value'] ?? 0),
      completed: Boolean(data['completed'])
    };
  }

  private loadFromLocalStorage(userId: string): void {
    this.zone.run(() => {
      const habits = this.readStore<Habit>(HABITS_KEY).filter(
        (habit) => String(habit.userId) === String(userId)
      );
      const logs = this.readStore<HabitLog>(LOGS_KEY).filter(
        (log) => String(log.userId) === String(userId)
      );
      this.habitsSignal.set(habits);
      this.logsSignal.set(logs);
    });
  }

  private completionForDate(date: string): number {
    const habits = this.habits();
    if (!habits.length) return 0;
    const completedIds = new Set(
      this.logs()
        .filter((log) => log.date === date && log.completed)
        .map((log) => log.habitId)
    );
    return Math.round((completedIds.size / habits.length) * 100);
  }

  private lastNDates(days: number): string[] {
    const result: string[] = [];
    const now = new Date();
    for (let index = days - 1; index >= 0; index -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - index);
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  }

  private stopListeners(): void {
    this.habitsUnsubscribe?.();
    this.logsUnsubscribe?.();
    this.habitsUnsubscribe = undefined;
    this.logsUnsubscribe = undefined;
  }

  private persist<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private readStore<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }
}
