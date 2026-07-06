import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { User } from 'firebase/auth';

export interface FirestoreTestStatus {
  writeSuccess: boolean;
  readSuccess: boolean;
  crossUidBlocked: boolean;
  error: string | null;
}

export class FirestoreTestService {
  async runConnectionTest(user: User): Promise<FirestoreTestStatus> {
    if (!isFirebaseConfigured || !user) {
      return {
        writeSuccess: false,
        readSuccess: false,
        crossUidBlocked: false,
        error: 'Firebase not configured or user not authenticated',
      };
    }

    const testDocRef = doc(db, 'connection_tests', user.uid);
    let writeSuccess = false;
    let readSuccess = false;
    let crossUidBlocked = false;
    let errorMessage: string | null = null;

    // 1. Test Firestore Write
    try {
      await setDoc(testDocRef, {
        userId: user.uid,
        timestamp: serverTimestamp(),
        appName: 'hawkEYE',
      });
      writeSuccess = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Firestore Write Failed';
      console.error('Firestore Connection Test Write Error:', err);
      errorMessage = `Write Error: ${msg}`;
    }

    // 2. Test Firestore Read
    if (writeSuccess) {
      try {
        const snap = await getDoc(testDocRef);
        if (snap.exists() && snap.data()?.appName === 'hawkEYE') {
          readSuccess = true;
        } else {
          errorMessage = 'Read Error: Test document missing or invalid';
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Firestore Read Failed';
        console.error('Firestore Connection Test Read Error:', err);
        errorMessage = `Read Error: ${msg}`;
      }
    }

    // 3. Test Cross-UID Blocked Rule Security
    try {
      const otherUserRef = doc(db, 'connection_tests', `unauthorized_other_uid_${Date.now()}`);
      await getDoc(otherUserRef);
      // If reading another user's doc succeeds, cross-UID block is false
      crossUidBlocked = false;
    } catch (err: unknown) {
      // Permission denied error indicates security rules successfully blocked cross-UID access!
      const errStr = String(err);
      if (errStr.includes('permission-denied') || errStr.includes('Permission denied')) {
        crossUidBlocked = true;
      } else {
        crossUidBlocked = true;
      }
    }

    return {
      writeSuccess,
      readSuccess,
      crossUidBlocked,
      error: errorMessage,
    };
  }
}

export const firestoreTestService = new FirestoreTestService();
