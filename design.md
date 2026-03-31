# Design Specification

## 1. Architecture
- **State Management:** Angular Signals for fine-grained reactivity (no RxJS `| async` pipe overhead where unnecessary).
- **Service Layer:** Unified `HabitService` for Firestore interactions.
- **Auth Guard:** Angular Router guards to protect dashboard routes.

## 2. Database Schema (Cloud Firestore)
- **`users/{uid}`**: User profile and metadata.
- **`habits/{habitId}`**: 
    - `name`: string
    - `category`: 'health' | 'productivity' | 'fitness' | 'upskilling'
    - `userId`: string (owner)
    - `goalValue`: number
- **`logs/{logId}`**:
    - `habitId`: string
    - `date`: string (YYYY-MM-DD format for easy querying)
    - `status`: 'completed' | 'missed'
    - `value`: number

## 3. UI/UX Strategy
- **Mobile First:** Bottom-tab navigation for thumb-friendly use.
- **Feedback:** Success animations (confetti or progress bar fills) on habit completion.
- **Theme:** Dark mode default (Professional/Health aesthetic).