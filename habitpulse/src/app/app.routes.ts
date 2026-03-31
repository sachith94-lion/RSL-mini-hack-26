import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login.component';
import { TodayComponent } from './pages/today.component';
import { HabitsComponent } from './pages/habits.component';
import { DashboardComponent } from './pages/dashboard.component';
import { SettingsComponent } from './pages/settings.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  { path: 'today', component: TodayComponent, canActivate: [authGuard] },
  { path: 'habits', component: HabitsComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'today' }
];
