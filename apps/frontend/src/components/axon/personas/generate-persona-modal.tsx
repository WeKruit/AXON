'use client';

import { FC, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { GeneratePersonaDto } from '../types';

interface GeneratePersonaModalProps {
  onClose: () => void;
  onSubmit: (data: GeneratePersonaDto) => Promise<void>;
}

const industryOptions = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Marketing',
  'Entertainment',
  'Real Estate',
  'Travel',
  'Food & Beverage',
  'Fitness',
  'Fashion',
  'Other',
];

const toneOptions = [
  'Professional',
  'Casual',
  'Friendly',
  'Authoritative',
  'Humorous',
  'Inspirational',
];

export const GeneratePersonaModal: FC<GeneratePersonaModalProps> = ({ onClose, onSubmit }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneratePersonaDto>({
    defaultValues: {
      prompt: '',
      targetAudience: '',
      industry: '',
      tone: '',
    },
  });

  const handleFormSubmit = useCallback(
    async (data: GeneratePersonaDto) => {
      setIsGenerating(true);
      try {
        await onSubmit(data);
      } finally {
        setIsGenerating(false);
      }
    },
    [onSubmit]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-newBgColorInner text-newTextColor rounded-[24px] p-[32px] w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-[24px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-[24px] font-semibold text-newTextColor">Generate Persona with AI</h2>
              <p className="text-[12px] text-textItemBlur">Describe your ideal content creator</p>
            </div>
          </div>
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

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Main Prompt */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Describe Your Persona <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('prompt', { required: 'Please describe the persona you want to create' })}
              className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors resize-none"
              placeholder="e.g., A tech-savvy entrepreneur who shares insights about startups, AI, and productivity. They're known for their practical advice and occasional witty observations."
              rows={4}
            />
            {errors.prompt && (
              <p className="text-red-500 text-xs mt-1">{errors.prompt.message}</p>
            )}
            <p className="text-xs text-textItemBlur mt-1">
              Be specific about personality traits, expertise, and content style
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Target Audience</label>
            <input
              type="text"
              {...register('targetAudience')}
              className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
              placeholder="e.g., Software developers, startup founders, tech enthusiasts"
            />
          </div>

          {/* Industry & Tone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Industry</label>
              <select
                {...register('industry')}
                className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
              >
                <option value="">Select industry</option>
                {industryOptions.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Preferred Tone</label>
              <select
                {...register('tone')}
                className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
              >
                <option value="">AI will decide</option>
                {toneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Info */}
          <div className="bg-newBgLineColor rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-purple-400 mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <p className="text-xs text-textItemBlur">
                AI will generate a complete persona including name, description, topics, demographics,
                and writing guidelines based on your input. You can edit it after generation.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-[16px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-[16px] py-[12px] bg-newBgLineColor text-newTextColor rounded-[8px] hover:bg-newBgLineColor/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Generate Persona
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
