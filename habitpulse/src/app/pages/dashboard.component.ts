import { AfterViewInit, Component, ElementRef, ViewChild, effect, inject, Injector, runInInjectionContext } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { HabitService } from '../core/habit.service';

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: 'app-dashboard',
  template: `
    <section class="space-y-4">
      @if (habitService.firestoreError()) {
        <div class="alert alert-warning">
          <span>{{ habitService.firestoreError() }}</span>
        </div>
      }

      <div class="card bg-slate-900 border border-slate-800">
        <div class="card-body p-4">
          <h2 class="card-title">7-Day Consistency</h2>
          <p class="text-sm text-slate-400 mb-2">Completion % across all habits (0–100%).</p>
          <div class="relative h-56 w-full">
            <canvas #trendCanvas></canvas>
          </div>
        </div>
      </div>

      <div class="card bg-slate-900 border border-slate-800">
        <div class="card-body p-4">
          <h2 class="card-title">Category Breakdown</h2>
          <p class="text-sm text-slate-400 mb-2">Number of habits per category.</p>
          @if (habitService.habits().length === 0) {
            <p class="text-slate-400 text-sm py-4">Add habits on the Habits tab to see this chart.</p>
          }
          <div class="relative h-64 w-full" [class.hidden]="habitService.habits().length === 0">
            <canvas #categoryCanvas></canvas>
          </div>
        </div>
      </div>
    </section>
  `
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;

  readonly habitService = inject(HabitService);
  private readonly injector = inject(Injector);
  private trendChart?: Chart;
  private categoryChart?: Chart;

  ngAfterViewInit(): void {
    this.trendChart = new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Completion %',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.2)',
            fill: true,
            tension: 0.35
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: true } },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { stepSize: 10 }
          }
        }
      }
    });

    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (!this.trendChart) return;

        const weekly = this.habitService.weeklySeries();
        const labels = weekly.map((item) => item.day.slice(5));
        const values = weekly.map((item) => item.percentage);

        this.trendChart.data.labels = labels;
        const dataset = this.trendChart.data.datasets[0];
        if (dataset && 'data' in dataset) {
          dataset.data = values;
        }
        this.trendChart.update('none');

        const breakdown = this.habitService
          .categoryBreakdown()
          .filter((item) => item.count > 0);

        if (this.habitService.habits().length === 0 || breakdown.length === 0) {
          this.categoryChart?.destroy();
          this.categoryChart = undefined;
          return;
        }

        const canvas = this.categoryCanvas.nativeElement;
        if (this.categoryChart) {
          this.categoryChart.data.labels = breakdown.map((item) => item.category);
          this.categoryChart.data.datasets = [
            {
              data: breakdown.map((item) => item.count),
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
            }
          ];
          this.categoryChart.update();
        } else {
          this.categoryChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
              labels: breakdown.map((item) => item.category),
              datasets: [
                {
                  data: breakdown.map((item) => item.count),
                  backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              plugins: { legend: { position: 'bottom' } }
            }
          });
        }
      });
    });
  }
}
