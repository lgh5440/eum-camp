import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const CLOUD_EVENT_ID =
  import.meta.env.VITE_FIREBASE_EVENT_ID?.trim() || 'youth-retreat-2026';

export const cloudSyncEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

export const firebaseApp: FirebaseApp | null = cloudSyncEnabled
  ? initializeApp(firebaseConfig)
  : null;

export const firestoreDb: Firestore | null = firebaseApp
  ? getFirestore(firebaseApp)
  : null;

export const firebaseAuth: Auth | null = firebaseApp
  ? getAuth(firebaseApp)
  : null;

let authReadyPromise: Promise<void> | null = null;

export type FirebaseAuthStatus = 'idle' | 'pending' | 'ready' | 'failed' | 'disabled';

interface FirebaseAuthState {
  status: FirebaseAuthStatus;
  errorCode?: string;
  errorMessage?: string;
}

let authState: FirebaseAuthState = {
  status: cloudSyncEnabled ? 'idle' : 'disabled',
};

const authListeners = new Set<(state: FirebaseAuthState) => void>();

function setAuthState(next: FirebaseAuthState): void {
  authState = next;
  authListeners.forEach(listener => listener(next));
}

export function getFirebaseAuthState(): FirebaseAuthState {
  return authState;
}

export function subscribeFirebaseAuthState(
  listener: (state: FirebaseAuthState) => void,
): () => void {
  authListeners.add(listener);
  listener(authState);
  return () => {
    authListeners.delete(listener);
  };
}

export function ensureFirebaseAuth(): Promise<void> {
  if (!firebaseAuth) {
    setAuthState({ status: 'disabled' });
    return Promise.resolve();
  }
  if (firebaseAuth.currentUser) {
    if (authState.status !== 'ready') setAuthState({ status: 'ready' });
    return Promise.resolve();
  }
  if (!authReadyPromise) {
    setAuthState({ status: 'pending' });
    authReadyPromise = signInAnonymously(firebaseAuth)
      .then(() => {
        setAuthState({ status: 'ready' });
        return undefined;
      })
      .catch((error: { code?: string; message?: string }) => {
        authReadyPromise = null;
        setAuthState({
          status: 'failed',
          errorCode: error?.code,
          errorMessage: error?.message,
        });
        throw error;
      });
  }
  return authReadyPromise;
}
