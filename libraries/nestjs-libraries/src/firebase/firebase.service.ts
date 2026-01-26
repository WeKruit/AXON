/**
 * Firebase Admin SDK Service - WEC-131 (shared with WEC-146)
 *
 * Provides centralized access to Firebase Admin SDK services
 * including Firestore, Auth, and Storage.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  onModuleInit() {
    this.initializeApp();
  }

  private initializeApp(): void {
    // Check if already initialized
    if (admin.apps.length > 0) {
      this.app = admin.apps[0] as admin.app.App;
      this.logger.log('Using existing Firebase Admin instance');
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase configuration incomplete. Some features may be unavailable.'
      );
      return;
    }

    try {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.logger.log(`Firebase Admin initialized for project: ${projectId}`);
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin:', error);
    }
  }

  /**
   * Check if Firebase Admin is available
   */
  isAvailable(): boolean {
    return this.app !== null;
  }

  /**
   * Get the Firebase Admin app instance
   */
  getApp(): admin.app.App {
    if (!this.app) {
      throw new Error('Firebase Admin not initialized');
    }
    return this.app;
  }

  /**
   * Get Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    return this.getApp().firestore();
  }

  /**
   * Get Auth instance
   */
  getAuth(): admin.auth.Auth {
    return this.getApp().auth();
  }

  /**
   * Verify a Firebase ID token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
    try {
      return await this.getAuth().verifyIdToken(idToken);
    } catch (error) {
      this.logger.error('Failed to verify ID token:', error);
      return null;
    }
  }
}
