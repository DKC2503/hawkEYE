import { signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '../config/firebase';

export class ArtisanAuthService {
  async loginWithEmail(email: string, pass: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return cred.user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }
}

export const artisanAuthService = new ArtisanAuthService();
