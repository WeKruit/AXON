import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  Firestore,
  CollectionReference,
  DocumentReference,
  Query,
  WhereFilterOp,
  OrderByDirection,
  WriteBatch,
  Transaction,
} from 'firebase-admin/firestore';

export interface FirestoreQueryOptions {
  where?: Array<{
    field: string;
    operator: WhereFilterOp;
    value: unknown;
  }>;
  orderBy?: Array<{
    field: string;
    direction?: OrderByDirection;
  }>;
  limit?: number;
  offset?: number;
  startAfter?: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: admin.firestore.DocumentSnapshot;
}

@Injectable()
export class FirestoreService implements OnModuleInit {
  private db: Firestore;
  private readonly logger = new Logger(FirestoreService.name);
  private initialized = false;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    if (this.initialized) {
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase configuration missing. Firestore features will be disabled. ' +
          'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
      return;
    }

    try {
      // Check if Firebase app already exists (from auth provider)
      const existingApps = admin.apps;
      if (existingApps.length > 0) {
        this.db = existingApps[0].firestore();
      } else {
        const app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.db = app.firestore();
      }
      this.initialized = true;
      this.logger.log('Firestore initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firestore', error);
      throw error;
    }
  }

  getDb(): Firestore {
    if (!this.db) {
      throw new Error('Firestore not initialized. Check Firebase configuration.');
    }
    return this.db;
  }

  collection<T = admin.firestore.DocumentData>(path: string): CollectionReference<T> {
    return this.getDb().collection(path) as CollectionReference<T>;
  }

  doc<T = admin.firestore.DocumentData>(path: string): DocumentReference<T> {
    return this.getDb().doc(path) as DocumentReference<T>;
  }

  async get<T>(docRef: DocumentReference<T>): Promise<T | null> {
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as T;
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    const docRef = this.doc<T>(`${collection}/${id}`);
    return this.get(docRef);
  }

  async create<T extends { id?: string }>(
    collection: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    customId?: string
  ): Promise<T> {
    const collectionRef = this.collection<T>(collection);
    const now = admin.firestore.Timestamp.now();
    const docData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    if (customId) {
      const docRef = collectionRef.doc(customId);
      await docRef.set(docData);
      return { id: customId, ...docData } as T;
    }

    const docRef = await collectionRef.add(docData);
    return { id: docRef.id, ...docData } as T;
  }

  async update<T>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = this.doc(`${collection}/${id}`);
    const updateData = {
      ...data,
      updatedAt: admin.firestore.Timestamp.now(),
    };
    await docRef.update(updateData);
  }

  async delete(collection: string, id: string): Promise<void> {
    const docRef = this.doc(`${collection}/${id}`);
    await docRef.delete();
  }

  async softDelete(collection: string, id: string): Promise<void> {
    await this.update(collection, id, {
      deletedAt: admin.firestore.Timestamp.now(),
    });
  }

  async query<T>(
    collection: string,
    options: FirestoreQueryOptions = {}
  ): Promise<T[]> {
    try {
      let query: Query<T> = this.collection<T>(collection);

      // Apply where clauses
      if (options.where) {
        for (const condition of options.where) {
          query = query.where(condition.field, condition.operator, condition.value);
        }
      }

      // Apply orderBy
      if (options.orderBy) {
        for (const order of options.orderBy) {
          query = query.orderBy(order.field, order.direction || 'asc');
        }
      }

      // Apply offset
      if (options.offset) {
        query = query.offset(options.offset);
      }

      // Apply startAfter for cursor-based pagination
      if (options.startAfter) {
        query = query.startAfter(options.startAfter);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
    } catch (error: any) {
      // Handle collection not found or other Firestore errors gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        this.logger.warn(`Collection '${collection}' not found, returning empty array`);
        return [];
      }
      throw error;
    }
  }

  async queryPaginated<T>(
    collection: string,
    options: FirestoreQueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    try {
      const limit = options.limit || 20;
      let query: Query<T> = this.collection<T>(collection);

      // Apply where clauses
      if (options.where) {
        for (const condition of options.where) {
          query = query.where(condition.field, condition.operator, condition.value);
        }
      }

      // Apply orderBy
      if (options.orderBy) {
        for (const order of options.orderBy) {
          query = query.orderBy(order.field, order.direction || 'asc');
        }
      }

      // Apply startAfter for cursor-based pagination
      if (options.startAfter) {
        query = query.startAfter(options.startAfter);
      }

      // Fetch one extra to check if there are more
      query = query.limit(limit + 1);

      const snapshot = await query.get();
      const hasMore = snapshot.docs.length > limit;
      const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
      const lastDoc = docs.length > 0 ? docs[docs.length - 1] : undefined;

      return {
        data: docs.map((doc) => ({ id: doc.id, ...doc.data() } as T)),
        hasMore,
        lastDoc,
      };
    } catch (error: any) {
      // Handle collection not found or other Firestore errors gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        this.logger.warn(`Collection '${collection}' not found, returning empty result`);
        return { data: [], hasMore: false, lastDoc: undefined };
      }
      throw error;
    }
  }

  async count(collection: string, options: Omit<FirestoreQueryOptions, 'limit' | 'offset'> = {}): Promise<number> {
    try {
      let query: Query = this.collection(collection);

      if (options.where) {
        for (const condition of options.where) {
          query = query.where(condition.field, condition.operator, condition.value);
        }
      }

      const snapshot = await query.count().get();
      return snapshot.data().count;
    } catch (error: any) {
      // Handle collection not found gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        this.logger.warn(`Collection '${collection}' not found, returning 0`);
        return 0;
      }
      throw error;
    }
  }

  async exists(collection: string, id: string): Promise<boolean> {
    const docRef = this.doc(`${collection}/${id}`);
    const snapshot = await docRef.get();
    return snapshot.exists;
  }

  batch(): WriteBatch {
    return this.getDb().batch();
  }

  async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    return this.getDb().runTransaction(updateFunction);
  }

  async batchWrite<T extends { id?: string }>(
    collection: string,
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      id?: string;
      data?: Partial<T>;
    }>
  ): Promise<void> {
    const batch = this.batch();
    const collectionRef = this.collection<T>(collection);
    const now = admin.firestore.Timestamp.now();

    for (const op of operations) {
      if (op.type === 'create' && op.data) {
        const docRef = op.id ? collectionRef.doc(op.id) : collectionRef.doc();
        const docData = {
          ...op.data,
          createdAt: now,
          updatedAt: now,
        } as unknown as T;
        batch.set(docRef, docData);
      } else if (op.type === 'update' && op.id && op.data) {
        const docRef = collectionRef.doc(op.id);
        batch.update(docRef, { ...op.data, updatedAt: now });
      } else if (op.type === 'delete' && op.id) {
        const docRef = collectionRef.doc(op.id);
        batch.delete(docRef);
      }
    }

    await batch.commit();
  }

  // Utility to convert Firestore Timestamps to Date objects
  timestampToDate(timestamp: admin.firestore.Timestamp): Date {
    return timestamp.toDate();
  }

  // Utility to create a Firestore Timestamp from a Date
  dateToTimestamp(date: Date): admin.firestore.Timestamp {
    return admin.firestore.Timestamp.fromDate(date);
  }

  // Generate a new document ID without creating the document
  generateId(collection: string): string {
    return this.collection(collection).doc().id;
  }
}
