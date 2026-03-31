import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
      <div class="card w-full max-w-md bg-slate-900 shadow-xl border border-slate-800">
        <div class="card-body">
          <h1 class="card-title text-2xl">HabitPulse</h1>
          <p class="text-slate-400">Login with Google or use email + PIN</p>

          <button class="btn btn-outline mt-4" [disabled]="loadingGoogle()" (click)="onGoogleLogin()">
            {{ loadingGoogle() ? 'Connecting...' : 'Continue with Google' }}
          </button>

          <div class="divider my-1">or</div>

          <label class="form-control w-full">
            <span class="label-text text-slate-300 mb-2">Email</span>
            <input class="input input-bordered bg-slate-950" type="email" [(ngModel)]="email" />
          </label>

          <label class="form-control w-full mt-3">
            <span class="label-text text-slate-300 mb-2">PIN</span>
            <input class="input input-bordered bg-slate-950" type="password" [(ngModel)]="pin" />
          </label>

          @if (error()) {
            <div class="alert alert-error mt-4"><span>{{ error() }}</span></div>
          }

          <button class="btn btn-success mt-5" (click)="onSubmit()">Continue with PIN</button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  pin = '';
  error = signal('');
  loadingGoogle = signal(false);

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  onSubmit(): void {
    this.error.set('');
    const ok = this.auth.login(this.email, this.pin);
    if (!ok) {
      this.error.set('Provide a valid email and PIN (min 4 digits).');
      return;
    }
    this.router.navigateByUrl('/today');
  }

  async onGoogleLogin(): Promise<void> {
    this.error.set('');
    this.loadingGoogle.set(true);
    const ok = await this.auth.loginWithGoogle();
    this.loadingGoogle.set(false);
    if (!ok) {
      this.error.set('Google login failed. Please try again.');
      return;
    }
    this.router.navigateByUrl('/today');
  }
}
