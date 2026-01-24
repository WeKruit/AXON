/**
 * Persona Firestore Repository - WEC-146
 *
 * Handles all Firestore operations for Persona entities.
 */

import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import {
  Persona,
  CreatePersonaInput,
  UpdatePersonaInput,
  PersonaFilter,
} from './persona.interface';

@Injectable()
export class PersonaRepository {
  private readonly logger = new Logger(PersonaRepository.name);
  private readonly collectionName = 'personas';

  constructor(private readonly firebaseService: FirebaseService) {}

  private get collection() {
    return this.firebaseService.getFirestore().collection(this.collectionName);
  }

  /**
   * Create a new persona
   */
  async create(
    organizationId: string,
    userId: string,
    input: CreatePersonaInput
  ): Promise<Persona> {
    const now = new Date();
    const docRef = this.collection.doc();

    const persona: Persona = {
      id: docRef.id,
      organizationId,
      userId,
      ...input,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set({
      ...persona,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    this.logger.log(`Created persona: ${persona.id} for org: ${organizationId}`);
    return persona;
  }

  /**
   * Get a persona by ID
   */
  async findById(id: string): Promise<Persona | null> {
    const doc = await this.collection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return this.docToPersona(doc);
  }

  /**
   * Get a persona by ID and organization (for authorization)
   */
  async findByIdAndOrganization(
    id: string,
    organizationId: string
  ): Promise<Persona | null> {
    const persona = await this.findById(id);

    if (!persona || persona.organizationId !== organizationId) {
      return null;
    }

    return persona;
  }

  /**
   * Find personas by filter
   */
  async findByFilter(filter: PersonaFilter): Promise<Persona[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (filter.organizationId) {
      query = query.where('organizationId', '==', filter.organizationId);
    }

    if (filter.userId) {
      query = query.where('userId', '==', filter.userId);
    }

    if (filter.isActive !== undefined) {
      query = query.where('isActive', '==', filter.isActive);
    }

    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => this.docToPersona(doc));
  }

  /**
   * Find all personas for an organization
   */
  async findByOrganization(organizationId: string): Promise<Persona[]> {
    return this.findByFilter({ organizationId });
  }

  /**
   * Find active personas for an organization
   */
  async findActiveByOrganization(organizationId: string): Promise<Persona[]> {
    return this.findByFilter({ organizationId, isActive: true });
  }

  /**
   * Update a persona
   */
  async update(id: string, input: UpdatePersonaInput): Promise<Persona | null> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const updateData = {
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updateData);

    this.logger.log(`Updated persona: ${id}`);
    return this.findById(id);
  }

  /**
   * Delete a persona
   */
  async delete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    await docRef.delete();
    this.logger.log(`Deleted persona: ${id}`);
    return true;
  }

  /**
   * Soft delete (deactivate) a persona
   */
  async deactivate(id: string): Promise<Persona | null> {
    return this.update(id, { isActive: false });
  }

  /**
   * Activate a persona
   */
  async activate(id: string): Promise<Persona | null> {
    return this.update(id, { isActive: true });
  }

  /**
   * Convert Firestore document to Persona
   */
  private docToPersona(
    doc: FirebaseFirestore.DocumentSnapshot
  ): Persona {
    const data = doc.data()!;
    return {
      id: doc.id,
      organizationId: data.organizationId,
      userId: data.userId,
      name: data.name,
      bio: data.bio,
      personality: data.personality,
      writingStyle: data.writingStyle,
      tone: data.tone,
      interests: data.interests || [],
      hashtags: data.hashtags || [],
      samplePosts: data.samplePosts || [],
      keywords: data.keywords || {},
      isActive: data.isActive ?? true,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }
}
