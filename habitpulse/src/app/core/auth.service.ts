import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AppUser } from './models';
import { firebaseAuth, firestore } from './firebase';

const USER_KEY = 'habitpulse:user';
const LOGIN_MODE_KEY = 'habitpulse:loginMode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly zone = inject(NgZone);

  private readonly currentUserSignal = signal<AppUser | null>(this.readStoredUser());
  /** Firebase Auth UID when signed in; null if signed out or PIN-only session. */
  private readonly firebaseUidSignal = signal<string | null>(firebaseAuth.currentUser?.uid ?? null);
  /** True after Firebase finishes restoring session (avoids Firestore before auth token exists). */
  private readonly authStateResolvedSignal = signal(false);

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly firebaseUid = computed(() => this.firebaseUidSignal());
  readonly authStateResolved = computed(() => this.authStateResolvedSignal());

  private readonly googleProvider = new GoogleAuthProvider();

  constructor() {
    void firebaseAuth.authStateReady().then(() => {
      this.zone.run(() => {
        const current = firebaseAuth.currentUser;
        this.firebaseUidSignal.set(current?.uid ?? null);
        if (current && !localStorage.getItem(LOGIN_MODE_KEY)) {
          localStorage.setItem(LOGIN_MODE_KEY, 'google');
        }
        this.authStateResolvedSignal.set(true);
      });
    });

    onAuthStateChanged(firebaseAuth, (user) => {
      this.zone.run(() => {
        this.firebaseUidSignal.set(user?.uid ?? null);
        if (!user) {
          return;
        }
        localStorage.setItem(LOGIN_MODE_KEY, 'google');
        const appUser = this.toAppUser(user.uid, user.email);
        this.currentUserSignal.set(appUser);
        this.persistUser(appUser);
        void this.ensureUserProfile(appUser);
      });
    });
  }

  login(email: string, pin: string): boolean {
    if (!email.trim() || pin.length < 4) {
      return false;
    }

    const user: AppUser = {
      id: this.slugifyEmail(email),
      email: email.trim().toLowerCase()
    };
    localStorage.setItem(LOGIN_MODE_KEY, 'pin');
    this.persistUser(user);
    localStorage.setItem(`${USER_KEY}:pin:${user.id}`, pin);
    this.currentUserSignal.set(user);
    return true;
  }

  async loginWithGoogle(): Promise<boolean> {
    try {
      const credential = await signInWithPopup(firebaseAuth, this.googleProvider);
      const appUser = this.toAppUser(credential.user.uid, credential.user.email);
      localStorage.setItem(LOGIN_MODE_KEY, 'google');
      this.currentUserSignal.set(appUser);
      this.persistUser(appUser);
      await this.ensureUserProfile(appUser);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth).catch(() => undefined);
    this.currentUserSignal.set(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LOGIN_MODE_KEY);
  }

  /** Use Firestore when signed in with Google and Firebase UID matches profile. PIN uses local storage only. */
  useCloudData(): boolean {
    if (!this.authStateResolvedSignal()) {
      return false;
    }
    if (localStorage.getItem(LOGIN_MODE_KEY) === 'pin') {
      return false;
    }
    const app = this.currentUser();
    const uid = this.firebaseUidSignal();
    return Boolean(app && uid && uid === app.id);
  }

  private readStoredUser(): AppUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      return null;
    }
  }

  private slugifyEmail(email: string): string {
    return email.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private toAppUser(id: string, email: string | null): AppUser {
    return {
      id,
      email: (email ?? 'unknown@user.local').trim().toLowerCase()
    };
  }

  private persistUser(user: AppUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private async ensureUserProfile(user: AppUser): Promise<void> {
    await setDoc(
      doc(firestore, 'users', user.id),
      { email: user.email, createdAt: Date.now() },
      { merge: true }
    ).catch(() => undefined);
  }
}
