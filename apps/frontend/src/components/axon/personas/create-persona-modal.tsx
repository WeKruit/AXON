'use client';

import { FC, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { CreatePersonaDto } from '../types';

interface CreatePersonaModalProps {
  onClose: () => void;
  onSubmit: (data: CreatePersonaDto) => Promise<void>;
}

const toneOptions = [
  'Professional',
  'Casual',
  'Friendly',
  'Authoritative',
  'Humorous',
  'Inspirational',
  'Educational',
  'Conversational',
];

const styleOptions = [
  'Informative',
  'Storytelling',
  'Data-driven',
  'Opinion-based',
  'Question-driven',
  'How-to',
  'Listicle',
  'Thread-style',
];

export const CreatePersonaModal: FC<CreatePersonaModalProps> = ({ onClose, onSubmit }) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePersonaDto & { topicInput: string }>({
    defaultValues: {
      name: '',
      description: '',
      tone: 'Professional',
      style: 'Informative',
      topics: [],
      demographics: {
        age: '',
        gender: '',
        location: '',
        occupation: '',
        interests: [],
      },
      writingGuidelines: '',
      examplePosts: [],
      avoidTopics: [],
      topicInput: '',
    },
  });

  const { fields: topicFields, append: appendTopic, remove: removeTopic } = useFieldArray({
    control,
    name: 'topics' as never,
  });

  const handleFormSubmit = useCallback(
    async (data: CreatePersonaDto & { topicInput: string }) => {
      const { topicInput, ...submitData } = data;
      await onSubmit(submitData);
    },
    [onSubmit]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-newBgColorInner rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create Persona</h2>
          <button
            onClick={onClose}
            className="p-1 text-textItemBlur hover:text-newTextColor transition-colors"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                  placeholder="e.g., Tech Enthusiast"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <input
                  type="text"
                  {...register('description')}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                  placeholder="Brief description"
                />
              </div>
            </div>
          </div>

          {/* Voice & Style */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Voice & Style</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Tone <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('tone', { required: 'Tone is required' })}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                >
                  {toneOptions.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Style <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('style', { required: 'Style is required' })}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                >
                  {styleOptions.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Content Topics</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {topicFields.map((field, index) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-newBgLineColor rounded-full text-sm"
                >
                  {(field as unknown as string)}
                  <button
                    type="button"
                    onClick={() => removeTopic(index)}
                    className="text-textItemBlur hover:text-red-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                {...register('topicInput')}
                className="flex-1 px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                placeholder="Add a topic and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      appendTopic(input.value.trim() as never);
                      input.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Demographics (Optional)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Age Range</label>
                <input
                  type="text"
                  {...register('demographics.age')}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg text-sm border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                  placeholder="e.g., 25-35"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Gender</label>
                <input
                  type="text"
                  {...register('demographics.gender')}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg text-sm border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                  placeholder="Any"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Location</label>
                <input
                  type="text"
                  {...register('demographics.location')}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg text-sm border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                  placeholder="e.g., US"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Occupation</label>
                <input
                  type="text"
                  {...register('demographics.occupation')}
                  className="w-full px-3 py-2 bg-newBgLineColor rounded-lg text-sm border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
                  placeholder="e.g., Developer"
                />
              </div>
            </div>
          </div>

          {/* Writing Guidelines */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Writing Guidelines</h3>
            <textarea
              {...register('writingGuidelines')}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors resize-none"
              placeholder="Any specific rules or guidelines for writing content..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-newBgLineColor text-newTextColor rounded-lg hover:bg-newBgLineColor/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-newPrimaryColor text-white rounded-lg hover:bg-newPrimaryColor/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
