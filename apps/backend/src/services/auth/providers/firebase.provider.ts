import { ProvidersInterface } from '@gitroom/backend/services/auth/providers.interface';
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

function getFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase configuration missing. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return firebaseApp;
}

export class FirebaseProvider implements ProvidersInterface {
  generateLink(): string {
    // Firebase authentication is handled client-side
    // This method is not used for Firebase auth flow
    return '';
  }

  async getToken(idToken: string): Promise<string> {
    // For Firebase, the ID token is passed directly from the client
    // We just return it as-is since verification happens in getUser
    return idToken;
  }

  async getUser(
    idToken: string
  ): Promise<{ email: string; id: string } | false> {
    try {
      const app = getFirebaseAdmin();
      const decodedToken = await app.auth().verifyIdToken(idToken);

      if (!decodedToken.email) {
        console.error('Firebase token does not contain email');
        return false;
      }

      return {
        email: decodedToken.email,
        id: decodedToken.uid,
      };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return false;
    }
  }
}
