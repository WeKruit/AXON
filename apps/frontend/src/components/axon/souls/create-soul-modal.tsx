'use client';

import { FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { usePersonas, useProxies } from '../hooks';
import type { CreateSoulDto } from '../types';

interface CreateSoulModalProps {
  onClose: () => void;
  onSubmit: (data: CreateSoulDto) => Promise<void>;
}

export const CreateSoulModal: FC<CreateSoulModalProps> = ({ onClose, onSubmit }) => {
  const { data: personas } = usePersonas();
  const { data: proxies } = useProxies();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateSoulDto>({
    defaultValues: {
      name: '',
      description: '',
      personaId: '',
      proxyId: '',
    },
  });

  const handleFormSubmit = useCallback(
    async (data: CreateSoulDto) => {
      const submitData = {
        ...data,
        personaId: data.personaId || undefined,
        proxyId: data.proxyId || undefined,
      };
      await onSubmit(submitData);
    },
    [onSubmit]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-newBgColorInner rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Soul</h2>
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
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
              placeholder="Enter soul name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              {...register('description')}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors resize-none"
              placeholder="Brief description of this soul"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Persona</label>
            <select
              {...register('personaId')}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
            >
              <option value="">No persona assigned</option>
              {personas?.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-textItemBlur mt-1">
              Assign a persona to define this soul&apos;s content style
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Default Proxy</label>
            <select
              {...register('proxyId')}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
            >
              <option value="">No default proxy</option>
              {proxies?.map((proxy) => (
                <option key={proxy.id} value={proxy.id}>
                  {proxy.name} ({proxy.type} - {proxy.country || 'Unknown location'})
                </option>
              ))}
            </select>
            <p className="text-xs text-textItemBlur mt-1">
              Default proxy for accounts under this soul
            </p>
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
              {isSubmitting ? 'Creating...' : 'Create Soul'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
