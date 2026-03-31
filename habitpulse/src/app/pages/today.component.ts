import { Component } from '@angular/core';
import { HabitService } from '../core/habit.service';
import { DecimalPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-today',
  imports: [DecimalPipe],
  template: `
    <section class="space-y-4">
      <div class="stats shadow bg-slate-900 border border-slate-800 w-full">
        <div class="stat">
          <div class="stat-title text-slate-400">Today's Completion</div>
          <div class="stat-value text-success">{{ habitService.todayProgress() }}%</div>
        </div>
        <div class="stat">
          <div class="stat-title text-slate-400">Habits</div>
          <div class="stat-value">{{ habitService.habits().length }}</div>
        </div>
      </div>

      <div class="space-y-3">
        @for (habit of habitService.habits(); track habit.id) {
          <div class="card bg-slate-900 border border-slate-800">
            <div class="card-body p-4">
              <div class="flex justify-between items-center gap-3">
                <div>
                  <h3 class="font-semibold">{{ habit.name }}</h3>
                  <p class="text-sm text-slate-400">{{ habit.category }} - Goal: {{ habit.goal }} {{ habit.unit }}</p>
                </div>
                <div class="badge" [class.badge-success]="habitService.isHabitDoneToday(habit.id)">
                  {{ habitService.isHabitDoneToday(habit.id) ? 'Done' : 'Pending' }}
                </div>
              </div>

              <input
                class="range range-success mt-3"
                type="range"
                [min]="0"
                [max]="habit.goal"
                [value]="habitService.valueForToday(habit.id)"
                (change)="updateProgress(habit.id, $event, habit.goal)"
              />
            </div>
          </div>
        } @empty {
          <div class="alert">
            <span>No habits yet. Add one in the Habits tab.</span>
          </div>
        }
      </div>
    </section>
  `
})
export class TodayComponent {
  constructor(public readonly habitService: HabitService) {}

  updateProgress(habitId: string, event: Event, goal: number): void {
    const value = Number((event.target as HTMLInputElement).value);
    const habit = this.habitService.habits().find((item) => item.id === habitId);
    if (!habit) return;
    this.habitService.markProgress(habit, Math.min(value, goal));
  }
}
