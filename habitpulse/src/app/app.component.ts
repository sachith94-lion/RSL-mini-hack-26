import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly navItems = [
    { label: 'Today', path: '/today' },
    { label: 'Habits', path: '/habits' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Settings', path: '/settings' }
  ];
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  showNav(): boolean {
    return this.auth.isAuthenticated() && !this.router.url.startsWith('/login');
  }
}
