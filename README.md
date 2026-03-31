# RSL Mini-Hack '26 - HabitPulse

HabitPulse is a mobile-first personal habit tracker built for the RSL Mini-Hack challenge.

## Implemented Features
- User login with Email + PIN (lightweight identity for hackathon flow).
- Habit CRUD with categories: Health, Fitness, Productivity, Upskilling.
- Daily checklist with completion tracking and progress sliders.
- Landing/Today summary cards with completion percentage.
- Dashboard charts:
  - 7-day consistency trend.
  - Category breakdown.
- Responsive mobile UI with bottom navigation.
- Google login with Firebase Authentication.
- Persistent data storage in Firebase Firestore (`users`, `habits`, `logs`).

## Project Structure
- Docs and hackathon specs in repo root.
- Angular app in `habitpulse/`.

## Firebase configuration
- Development: `habitpulse/src/environments/environment.ts` (`production: false`).
- Production builds replace that file with `habitpulse/src/environments/environment.prod.ts` via `angular.json` `fileReplacements`.
- Firebase is initialized on startup in `habitpulse/src/app/core/firebase.ts` (exports `firebaseApp`, `firebaseAuth`, `firestore`).
- Web API keys in these files are expected to be public; security is enforced with Firebase Security Rules in the console.

## Run Locally
```bash
cd habitpulse
npm install
npm start
```
Open [http://localhost:4200](http://localhost:4200).

## Free Hosting Options
### Option 1: Netlify (recommended)
1. Push this repo to GitHub.
2. Create a new Netlify site from the repo.
3. Set base directory: `habitpulse`
4. Build command: `npm run build`
5. Publish directory: `dist/habitpulse/browser`

`habitpulse/netlify.toml` is already configured.

### Option 2: Vercel
1. Import repo into Vercel.
2. Set root directory: `habitpulse`
3. Deploy (config is in `habitpulse/vercel.json`).

## Branching Workflow
Use the provided `branching-guidelines.md`:
- `main` for production-ready code.
- `develop` for integration.
- `feat/*` branches for each feature.

Suggested feature branches:
- `feat/auth`
- `feat/habit-crud`
- `feat/today-checklist`
- `feat/dashboard-charts`
- `feat/deployment`
