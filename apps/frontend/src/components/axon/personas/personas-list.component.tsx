'use client';

import { FC, useCallback, useState } from 'react';
import Link from 'next/link';
import { usePersonas, usePersonaMutations } from '../hooks';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import type { Persona, CreatePersonaDto, GeneratePersonaDto } from '../types';
import { CreatePersonaModal } from './create-persona-modal';
import { GeneratePersonaModal } from './generate-persona-modal';

export const PersonasListComponent: FC = () => {
  const { data: personas, isLoading, mutate } = usePersonas();
  const { createPersona, deletePersona, generatePersona } = usePersonaMutations();
  const toaster = useToaster();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const handleCreatePersona = useCallback(
    async (data: CreatePersonaDto) => {
      try {
        await createPersona(data);
        await mutate();
        setIsCreateModalOpen(false);
        toaster.show('Persona created successfully', 'success');
      } catch (error) {
        toaster.show('Failed to create persona', 'warning');
      }
    },
    [createPersona, mutate, toaster]
  );

  const handleGeneratePersona = useCallback(
    async (data: GeneratePersonaDto) => {
      try {
        await generatePersona(data);
        await mutate();
        setIsGenerateModalOpen(false);
        toaster.show('Persona generated successfully', 'success');
      } catch (error) {
        toaster.show('Failed to generate persona', 'warning');
      }
    },
    [generatePersona, mutate, toaster]
  );

  const handleDeletePersona = useCallback(
    async (persona: Persona) => {
      const confirmed = await deleteDialog(
        `Are you sure you want to delete "${persona.name}"?`,
        'Delete Persona'
      );
      if (!confirmed) return;

      try {
        await deletePersona(persona.id);
        await mutate();
        toaster.show('Persona deleted successfully', 'success');
      } catch (error) {
        toaster.show('Failed to delete persona', 'warning');
      }
    },
    [deletePersona, mutate, toaster]
  );

  if (isLoading) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-newBgLineColor rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-newBgLineColor rounded animate-pulse" />
            <div className="h-10 w-40 bg-newBgLineColor rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-newBgLineColor rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Define content personalities and writing styles for your Souls
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-newBgLineColor text-newTextColor rounded-lg hover:bg-newBgLineColor/80 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Manually
          </button>
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-newPrimaryColor text-white rounded-lg hover:bg-newPrimaryColor/90 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Generate with AI
          </button>
        </div>
      </div>

      {!personas || personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-newBgLineColor flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-textItemBlur"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Personas Yet</h3>
          <p className="text-sm text-textItemBlur mb-4 max-w-md">
            Personas define the voice, tone, and style of your content.
            Create one manually or let AI generate a persona based on your description.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-newBgLineColor text-newTextColor rounded-lg hover:bg-newBgLineColor/80 transition-colors"
            >
              Create Manually
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-4 py-2 bg-newPrimaryColor text-white rounded-lg hover:bg-newPrimaryColor/90 transition-colors"
            >
              Generate with AI
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onDelete={() => handleDeletePersona(persona)}
            />
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreatePersonaModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePersona}
        />
      )}

      {isGenerateModalOpen && (
        <GeneratePersonaModal
          onClose={() => setIsGenerateModalOpen(false)}
          onSubmit={handleGeneratePersona}
        />
      )}
    </div>
  );
};

interface PersonaCardProps {
  persona: Persona;
  onDelete: () => void;
}

const PersonaCard: FC<PersonaCardProps> = ({ persona, onDelete }) => {
  return (
    <Link
      href={`/axon/personas/${persona.id}`}
      className="group block bg-newBgLineColor rounded-lg p-4 hover:bg-newBgLineColor/80 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {persona.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium group-hover:text-newPrimaryColor transition-colors">
              {persona.name}
            </h3>
            <p className="text-xs text-textItemBlur">
              {persona.tone} • {persona.style}
            </p>
          </div>
        </div>
        {persona.isAiGenerated && (
          <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
            AI Generated
          </span>
        )}
      </div>

      {persona.description && (
        <p className="text-sm text-textItemBlur mb-3 line-clamp-2">{persona.description}</p>
      )}

      {/* Topics */}
      {persona.topics && persona.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {persona.topics.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="text-[10px] px-2 py-0.5 bg-newBgColorInner rounded-full text-textItemBlur"
            >
              {topic}
            </span>
          ))}
          {persona.topics.length > 4 && (
            <span className="text-[10px] text-textItemBlur">+{persona.topics.length - 4} more</span>
          )}
        </div>
      )}

      {/* Demographics preview */}
      {persona.demographics && (
        <div className="flex items-center gap-2 text-xs text-textItemBlur mb-3">
          {persona.demographics.age && <span>{persona.demographics.age}</span>}
          {persona.demographics.occupation && (
            <>
              <span>•</span>
              <span>{persona.demographics.occupation}</span>
            </>
          )}
          {persona.demographics.location && (
            <>
              <span>•</span>
              <span>{persona.demographics.location}</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-newBgColorInner">
        <span className="text-xs text-textItemBlur">
          {persona.souls?.length || 0} soul{(persona.souls?.length || 0) !== 1 ? 's' : ''} using
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-textItemBlur hover:text-red-500 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </Link>
  );
};
