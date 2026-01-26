/**
 * Persona Interface - WEC-146
 *
 * Defines the data structures for AI-powered personas.
 */

export interface PersonaKeywords {
  industry?: string;
  role?: string;
  personality?: string[];
  interests?: string[];
  writingStyle?: string;
  tone?: string;
}

export interface Persona {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  bio: string;
  personality: string;
  writingStyle: string;
  tone: string;
  interests: string[];
  hashtags: string[];
  samplePosts: string[];
  keywords: PersonaKeywords;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonaInput {
  name: string;
  bio: string;
  personality: string;
  writingStyle: string;
  tone: string;
  interests: string[];
  hashtags: string[];
  samplePosts: string[];
  keywords: PersonaKeywords;
}

export interface UpdatePersonaInput {
  name?: string;
  bio?: string;
  personality?: string;
  writingStyle?: string;
  tone?: string;
  interests?: string[];
  hashtags?: string[];
  samplePosts?: string[];
  keywords?: PersonaKeywords;
  isActive?: boolean;
}

export interface PersonaFilter {
  organizationId?: string;
  userId?: string;
  isActive?: boolean;
}
