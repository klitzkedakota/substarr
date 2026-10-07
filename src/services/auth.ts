import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
];

// Resolved configuration supporting both firebase-applet-config.json and Cloudflare Pages env vars
export const resolvedFirebaseConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || firebaseConfig.projectId,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || firebaseConfig.appId,
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || firebaseConfig.authDomain,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || firebaseConfig.messagingSenderId,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || firebaseConfig.measurementId || '',
  oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || firebaseConfig.oAuthClientId,
  recaptchaSiteKey: (import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY as string) || firebaseConfig.recaptchaSiteKey || '',
};

export { firebaseConfig };

// Initialize Firebase
const app = initializeApp(resolvedFirebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
YOUTUBE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initialize auth listener. Access token is kept strictly in-memory.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Request OAuth token using Google Identity Services (GIS) Token Client.
 * This runs directly in the client without needing Firebase's iframe auth handler proxy.
 */
export const requestGoogleOAuthTokenViaGIS = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services is still loading. Please wait 2 seconds and try again.'
        )
      );
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: resolvedFirebaseConfig.oAuthClientId,
        scope: YOUTUBE_SCOPES.join(' '),
        prompt: 'consent',
        callback: (resp: any) => {
          if (resp.error) {
            reject(
              new Error(
                resp.error_description ||
                  resp.error ||
                  'Google OAuth permission was cancelled or denied.'
              )
            );
            return;
          }
          if (resp.access_token) {
            cachedAccessToken = resp.access_token;
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token received from Google.'));
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (e: any) {
      reject(e);
    }
  });
};

/**
 * Trigger Firebase Auth Sign-In with popup
 */
export const firebaseSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Failed to retrieve access token with YouTube permissions.');
  }

  cachedAccessToken = credential.accessToken;
  return { user: result.user, accessToken: cachedAccessToken };
};

/**
 * Smart Google Sign-In: Tries GIS first (recommended for client scopes), falls back to Firebase
 */
export const googleSignIn = async (): Promise<{
  accessToken: string;
  user?: User | null;
  method: 'gis' | 'firebase';
}> => {
  if (isSigningIn) {
    throw new Error('Sign-in is already in progress.');
  }

  isSigningIn = true;
  try {
    // Try Google Identity Services (GIS) first if available
    if (window.google?.accounts?.oauth2) {
      try {
        const token = await requestGoogleOAuthTokenViaGIS();
        return { accessToken: token, user: auth.currentUser, method: 'gis' };
      } catch (gisError: any) {
        console.warn('GIS Token client failed, trying Firebase popup fallback:', gisError);
        // If GIS failed due to user closing window, don't cascade silently
        if (gisError.message?.includes('denied') || gisError.message?.includes('cancelled')) {
          throw gisError;
        }
      }
    }

    // Try Firebase Auth popup
    const res = await firebaseSignIn();
    return { accessToken: res.accessToken, user: res.user, method: 'firebase' };
  } catch (err: any) {
    console.error('All Google OAuth methods failed:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve cached in-memory access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set or update cached token
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Sign out user and clear in-memory token
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
  cachedAccessToken = null;
};
