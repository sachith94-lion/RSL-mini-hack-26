import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HabitService } from '../core/habit.service';
import { HabitCategory } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-habits',
  imports: [FormsModule],
  template: `
    <section class="space-y-5">
      @if (uiError()) {
        <div class="alert alert-warning">
          <span>{{ uiError() }}</span>
        </div>
      }

      @if (habitService.firestoreError()) {
        <div class="alert alert-warning">
          <span>{{ habitService.firestoreError() }}</span>
        </div>
      }

      <div class="card bg-slate-900 border border-slate-800">
        <div class="card-body p-4">
          <h2 class="card-title text-lg">Add Habit</h2>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input class="input input-bordered bg-slate-950" [(ngModel)]="name" placeholder="Habit name" />
            <input class="input input-bordered bg-slate-950" [(ngModel)]="unit" placeholder="Unit (e.g. glasses)" />
            <select class="select select-bordered bg-slate-950" [(ngModel)]="category">
              @for (item of habitService.categories; track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
            <input class="input input-bordered bg-slate-950" type="number" min="1" [(ngModel)]="goal" placeholder="Goal" />
          </div>
          <button class="btn btn-success mt-4" (click)="addHabit()">Save Habit</button>
        </div>
      </div>

      <div class="space-y-2">
        @for (habit of habitService.habits(); track habit.id) {
          <div class="card bg-slate-900 border border-slate-800">
            <div class="card-body p-4 flex-row justify-between items-center">
              <div>
                <h3 class="font-medium">{{ habit.name }}</h3>
                <p class="text-sm text-slate-400">{{ habit.category }} | {{ habit.goal }} {{ habit.unit }}</p>
              </div>
              <button class="btn btn-sm btn-error btn-outline" (click)="habitService.deleteHabit(habit.id)">
                Delete
              </button>
            </div>
          </div>
        } @empty {
          <p class="text-slate-400">No habits available.</p>
        }
      </div>
    </section>
  `
})
export class HabitsComponent {
  name = '';
  unit = 'times';
  goal = 1;
  category: HabitCategory = 'Health';
  uiError = signal('');

  constructor(public readonly habitService: HabitService) {}

  addHabit(): void {
    this.uiError.set('');
    if (!this.name.trim()) {
      this.uiError.set('Please enter a habit name.');
      return;
    }
    if (!this.unit.trim()) {
      this.uiError.set('Please enter a unit (e.g. times, minutes, glasses).');
      return;
    }
    if (this.goal < 1) {
      this.uiError.set('Goal must be at least 1.');
      return;
    }
    this.habitService.addHabit({
      name: this.name,
      unit: this.unit,
      goal: this.goal,
      category: this.category
    });
    this.name = '';
    this.unit = 'times';
    this.goal = 1;
    this.category = 'Health';
  }
}
