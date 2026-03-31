# Technical Specification

## Tech Stack
- **Frontend:** Angular 18 (Signals, Standalone Components).
- **UI:** Tailwind CSS + DaisyUI (for fast, themed components).
- **Backend/DB:** Firebase (Firestore).
- **Auth:** Firebase Authentication.
- **Charts:** Ngx-charts or Chart.js.
- **Hosting:** Firebase Hosting.

## Data Schema (Firestore)
### `users/{userId}`
- email: string
- createdAt: timestamp

### `habits/{habitId}`
- userId: string (Index)
- name: string (e.g., "Drink Water")
- category: string (Health, Fitness, etc.)
- goal: number (e.g., 8)
- unit: string (e.g., "glasses")

### `logs/{logId}`
- habitId: string
- userId: string
- date: string (YYYY-MM-DD)
- value: number (current progress)
- completed: boolean