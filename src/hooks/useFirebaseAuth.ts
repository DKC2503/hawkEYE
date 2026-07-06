import { useEffect, useState } from 'react';
import { authService, type AuthStatus } from '../services/authService';
import { firestoreTestService, type FirestoreTestStatus } from '../services/firestoreTestService';
import { isFirebaseConfigured } from '../config/firebase';

export interface FirebaseDiagnosticsState {
  firebaseInitialized: boolean;
  authStatus: AuthStatus;
  firestoreTestStatus: FirestoreTestStatus | null;
  testingFirestore: boolean;
}

export const useFirebaseAuth = () => {
  const [diagState, setDiagState] = useState<FirebaseDiagnosticsState>({
    firebaseInitialized: isFirebaseConfigured,
    authStatus: { state: 'initializing', user: null, error: null },
    firestoreTestStatus: null,
    testingFirestore: false,
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDiagState((prev) => ({
        ...prev,
        authStatus: { state: 'error', user: null, error: 'Firebase configuration missing in .env' },
      }));
      return;
    }

    const unsubscribe = authService.initAnonymousAuth((authStatus) => {
      setDiagState((prev) => ({
        ...prev,
        authStatus,
      }));

      // When user authenticates, run Firestore connection test
      if (authStatus.state === 'authenticated' && authStatus.user) {
        setDiagState((prev) => ({ ...prev, testingFirestore: true }));
        firestoreTestService.runConnectionTest(authStatus.user).then((testResult) => {
          setDiagState((prev) => ({
            ...prev,
            firestoreTestStatus: testResult,
            testingFirestore: false,
          }));
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return diagState;
};
