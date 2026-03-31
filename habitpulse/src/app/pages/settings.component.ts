import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  template: `
    <section class="space-y-4">
      <div class="card bg-slate-900 border border-slate-800">
        <div class="card-body p-4">
          <h2 class="card-title">Profile</h2>
          <p class="text-slate-300">{{ auth.currentUser()?.email }}</p>
          <p class="text-slate-500 text-sm">Data is stored per user profile.</p>
        </div>
      </div>

      <button class="btn btn-error btn-outline" (click)="logout()">Logout</button>
    </section>
  `
})
export class SettingsComponent {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  async logout(): Promise<void> {
    await this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
