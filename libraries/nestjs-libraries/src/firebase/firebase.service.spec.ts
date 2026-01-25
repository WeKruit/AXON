/**
 * Firebase Service Tests - WEC-131
 *
 * Unit tests for FirebaseService covering Firebase Admin SDK
 * initialization and service access.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseService } from './firebase.service';

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn(),
  };

  const mockAuth = {
    verifyIdToken: jest.fn(),
  };

  const mockApp = {
    firestore: jest.fn().mockReturnValue(mockFirestore),
    auth: jest.fn().mockReturnValue(mockAuth),
  };

  return {
    apps: [] as any[],
    initializeApp: jest.fn().mockReturnValue(mockApp),
    credential: {
      cert: jest.fn().mockReturnValue('mock-credential'),
    },
    app: {
      App: class MockApp {},
    },
    firestore: {
      Firestore: class MockFirestore {},
    },
    auth: {
      Auth: class MockAuth {},
    },
  };
});

describe('FirebaseService', () => {
  let service: FirebaseService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset the admin.apps array for each test
    const admin = require('firebase-admin');
    admin.apps.length = 0;

    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('onModuleInit', () => {
    it('should initialize Firebase when all config is present', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const admin = require('firebase-admin');
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: 'mock-credential',
      });
      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project',
        clientEmail: 'test@test.iam.gserviceaccount.com',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      });
    });

    it('should not initialize when project ID is missing', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const admin = require('firebase-admin');
      expect(admin.initializeApp).not.toHaveBeenCalled();
    });

    it('should not initialize when client email is missing', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      delete process.env.FIREBASE_CLIENT_EMAIL;
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const admin = require('firebase-admin');
      expect(admin.initializeApp).not.toHaveBeenCalled();
    });

    it('should not initialize when private key is missing', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      delete process.env.FIREBASE_PRIVATE_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const admin = require('firebase-admin');
      expect(admin.initializeApp).not.toHaveBeenCalled();
    });

    it('should reuse existing Firebase app when already initialized', async () => {
      const admin = require('firebase-admin');
      const existingApp = { name: 'existing' };
      admin.apps = [existingApp];

      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      expect(admin.initializeApp).not.toHaveBeenCalled();
    });

    it('should handle escaped newlines in private key', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const admin = require('firebase-admin');
      expect(admin.credential.cert).toHaveBeenCalledWith(
        expect.objectContaining({
          privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        })
      );
    });
  });

  describe('isAvailable', () => {
    it('should return true when Firebase is initialized', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when Firebase is not initialized', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('getApp', () => {
    it('should return Firebase app when initialized', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      expect(() => service.getApp()).not.toThrow();
    });

    it('should throw error when Firebase is not initialized', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      expect(() => service.getApp()).toThrow('Firebase Admin not initialized');
    });
  });

  describe('getFirestore', () => {
    it('should return Firestore instance', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const firestore = service.getFirestore();
      expect(firestore).toBeDefined();
    });
  });

  describe('getAuth', () => {
    it('should return Auth instance', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const auth = service.getAuth();
      expect(auth).toBeDefined();
    });
  });

  describe('verifyIdToken', () => {
    it('should verify valid ID token', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const mockDecodedToken = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      const auth = service.getAuth();
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      const result = await service.verifyIdToken('valid-token');

      expect(auth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockDecodedToken);
    });

    it('should return null for invalid token', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const auth = service.getAuth();
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const result = await service.verifyIdToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      const auth = service.getAuth();
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Token expired'));

      const result = await service.verifyIdToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle Firebase initialization errors gracefully', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      const admin = require('firebase-admin');
      admin.initializeApp.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [FirebaseService],
      }).compile();

      service = module.get<FirebaseService>(FirebaseService);

      // Should not throw, just log warning
      expect(service.isAvailable()).toBe(false);
    });
  });
});
