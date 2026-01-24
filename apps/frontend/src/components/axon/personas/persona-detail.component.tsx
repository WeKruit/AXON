'use client';

import { FC, useCallback } from 'react';
import Link from 'next/link';
import { usePersona, usePersonaMutations } from '../hooks';
import { useToaster } from '@gitroom/react/toaster/toaster';
import type { UpdatePersonaDto } from '../types';

interface PersonaDetailProps {
  personaId: string;
}

export const PersonaDetailComponent: FC<PersonaDetailProps> = ({ personaId }) => {
  const { data: persona, isLoading, mutate } = usePersona(personaId);
  const { updatePersona } = usePersonaMutations();
  const toaster = useToaster();

  const handleUpdate = useCallback(
    async (data: UpdatePersonaDto) => {
      if (!persona) return;
      try {
        await updatePersona(persona.id, data);
        await mutate();
        toaster.show('Persona updated successfully', 'success');
      } catch (error) {
        toaster.show('Failed to update persona', 'warning');
      }
    },
    [persona, updatePersona, mutate, toaster]
  );

  if (isLoading || !persona) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="h-8 w-48 bg-newBgLineColor rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-48 bg-newBgLineColor rounded-lg animate-pulse" />
            <div className="h-32 bg-newBgLineColor rounded-lg animate-pulse" />
          </div>
          <div className="h-64 bg-newBgLineColor rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-textItemBlur mb-4">
        <Link href="/axon/personas" className="hover:text-newTextColor transition-colors">
          Personas
        </Link>
        <span>/</span>
        <span className="text-newTextColor">{persona.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
            {persona.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{persona.name}</h1>
              {persona.isAiGenerated && (
                <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
                  AI Generated
                </span>
              )}
            </div>
            {persona.description && (
              <p className="text-sm text-textItemBlur mt-1">{persona.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice & Style */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-4">Voice & Style</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-textItemBlur mb-1">Tone</p>
                <p className="font-medium">{persona.tone}</p>
              </div>
              <div>
                <p className="text-xs text-textItemBlur mb-1">Style</p>
                <p className="font-medium">{persona.style}</p>
              </div>
            </div>
          </div>

          {/* Topics */}
          {persona.topics && persona.topics.length > 0 && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Content Topics</h3>
              <div className="flex flex-wrap gap-2">
                {persona.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 bg-newBgColorInner rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Writing Guidelines */}
          {persona.writingGuidelines && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Writing Guidelines</h3>
              <p className="text-sm text-textItemBlur whitespace-pre-wrap">
                {persona.writingGuidelines}
              </p>
            </div>
          )}

          {/* Example Posts */}
          {persona.examplePosts && persona.examplePosts.length > 0 && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Example Posts</h3>
              <div className="space-y-3">
                {persona.examplePosts.map((post, index) => (
                  <div key={index} className="p-3 bg-newBgColorInner rounded-lg">
                    <p className="text-sm">{post}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics to Avoid */}
          {persona.avoidTopics && persona.avoidTopics.length > 0 && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Topics to Avoid</h3>
              <div className="flex flex-wrap gap-2">
                {persona.avoidTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Demographics */}
          {persona.demographics && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <h3 className="text-sm font-medium mb-4">Demographics</h3>
              <div className="space-y-3">
                {persona.demographics.age && (
                  <div>
                    <p className="text-xs text-textItemBlur">Age Range</p>
                    <p className="text-sm font-medium">{persona.demographics.age}</p>
                  </div>
                )}
                {persona.demographics.gender && (
                  <div>
                    <p className="text-xs text-textItemBlur">Gender</p>
                    <p className="text-sm font-medium">{persona.demographics.gender}</p>
                  </div>
                )}
                {persona.demographics.location && (
                  <div>
                    <p className="text-xs text-textItemBlur">Location</p>
                    <p className="text-sm font-medium">{persona.demographics.location}</p>
                  </div>
                )}
                {persona.demographics.occupation && (
                  <div>
                    <p className="text-xs text-textItemBlur">Occupation</p>
                    <p className="text-sm font-medium">{persona.demographics.occupation}</p>
                  </div>
                )}
                {persona.demographics.interests && persona.demographics.interests.length > 0 && (
                  <div>
                    <p className="text-xs text-textItemBlur mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {persona.demographics.interests.map((interest) => (
                        <span
                          key={interest}
                          className="text-xs px-2 py-0.5 bg-newBgColorInner rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Linked Souls */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-4">Linked Souls</h3>
            {persona.souls && persona.souls.length > 0 ? (
              <div className="space-y-2">
                {persona.souls.map((soul) => (
                  <Link
                    key={soul.id}
                    href={`/axon/souls/${soul.id}`}
                    className="flex items-center gap-2 p-2 bg-newBgColorInner rounded-lg hover:bg-newBgColorInner/80 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                      {soul.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{soul.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-textItemBlur">No souls using this persona</p>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-4">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-textItemBlur">Created</span>
                <span>{new Date(persona.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textItemBlur">Updated</span>
                <span>{new Date(persona.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
