import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';

export type AuthState = 'initializing' | 'authenticated' | 'error';

export interface AuthStatus {
  state: AuthState;
  user: User | null;
  error: string | null;
}

export class AuthService {
  private listenerUnsubscribe: (() => void) | null = null;

  initAnonymousAuth(onStatusChange: (status: AuthStatus) => void): () => void {
    if (!isFirebaseConfigured) {
      onStatusChange({
        state: 'error',
        user: null,
        error: 'Firebase Web configuration missing in .env',
      });
      return () => {};
    }

    onStatusChange({ state: 'initializing', user: null, error: null });

    this.listenerUnsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          // User already authenticated (persisted anonymous session)
          onStatusChange({
            state: 'authenticated',
            user,
            error: null,
          });
        } else {
          // No user session found, perform anonymous sign-in
          try {
            const credential = await signInAnonymously(auth);
            onStatusChange({
              state: 'authenticated',
              user: credential.user,
              error: null,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Anonymous Authentication failed';
            console.error('Firebase Anonymous Auth Error:', err);
            onStatusChange({
              state: 'error',
              user: null,
              error: msg,
            });
          }
        }
      },
      (err) => {
        console.error('Firebase Auth State Error:', err);
        onStatusChange({
          state: 'error',
          user: null,
          error: err.message,
        });
      }
    );

    return () => {
      if (this.listenerUnsubscribe) {
        this.listenerUnsubscribe();
      }
    };
  }

  async getOrWaitForUser(): Promise<User | null> {
    if (auth.currentUser) return auth.currentUser;
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  async getIdToken(): Promise<string | null> {
    const user = await this.getOrWaitForUser();
    if (!user) return null;
    return await user.getIdToken();
  }
}

export const authService = new AuthService();
