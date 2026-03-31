# Implementation Tasks

## Phase 1: Setup (15m)
- [ ] **T-01:** `ng new habit-tracker --style=scss`
- [ ] **T-02:** Install Tailwind & DaisyUI: `npm install -D tailwindcss postcss autoprefixer daisyui@latest`
- [ ] **T-03:** Firebase Init: `ng add @angular/fire` (Select Auth, Firestore, Hosting).

## Phase 2: Core Logic (30m)
- [ ] **T-04:** Setup `AuthService` (login/logout/user$).
- [ ] **T-05:** Create `HabitService` using Angular Signals to manage Firestore state.
- [ ] **T-06:** Implement "Add Habit" Modal.

## Phase 3: UI & Charts (30m)
- [ ] **T-07:** Build "Today's Checklist" view.
- [ ] **T-08:** Integrate Chart.js for 7-day streak visualization.
- [ ] **T-09:** Add responsive Bottom Nav for mobile.

## Phase 4: Deploy (15m)
- [ ] **T-10:** Final styling polish (Dark mode).
- [ ] **T-11:** `ng deploy` to Firebase Hosting.
- [ ] **T-12:** Push code to GitHub.