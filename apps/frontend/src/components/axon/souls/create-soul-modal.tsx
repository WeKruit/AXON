'use client';

import { FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { usePersonas, useProxies } from '../hooks';
import { Modal } from '../ui/modal';
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
    <Modal isOpen={true} onClose={onClose} title="Create New Soul">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label htmlFor="soul-name" className="block text-[14px] font-medium mb-[6px] text-newTextColor">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="soul-name"
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-[16px] py-[10px] bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
            placeholder="Enter soul name"
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'soul-name-error' : undefined}
          />
          {errors.name && (
            <p id="soul-name-error" className="text-red-400 text-[12px] mt-1" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="soul-description" className="block text-[14px] font-medium mb-[6px] text-newTextColor">
            Description
          </label>
          <textarea
            id="soul-description"
            {...register('description')}
            className="w-full px-[16px] py-[10px] bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors resize-none"
            placeholder="Brief description of this soul"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="soul-persona" className="block text-[14px] font-medium mb-[6px] text-newTextColor">
            Persona
          </label>
          <select
            id="soul-persona"
            {...register('personaId')}
            className="w-full px-[16px] py-[10px] bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
            aria-describedby="soul-persona-help"
          >
            <option value="">No persona assigned</option>
            {personas?.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.name}
              </option>
            ))}
          </select>
          <p id="soul-persona-help" className="text-[12px] text-textItemBlur mt-1">
            Assign a persona to define this soul&apos;s content style
          </p>
        </div>

        <div>
          <label htmlFor="soul-proxy" className="block text-[14px] font-medium mb-[6px] text-newTextColor">
            Default Proxy
          </label>
          <select
            id="soul-proxy"
            {...register('proxyId')}
            className="w-full px-[16px] py-[10px] bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
            aria-describedby="soul-proxy-help"
          >
            <option value="">No default proxy</option>
            {proxies?.map((proxy) => (
              <option key={proxy.id} value={proxy.id}>
                {proxy.name} ({proxy.type} - {proxy.country || 'Unknown location'})
              </option>
            ))}
          </select>
          <p id="soul-proxy-help" className="text-[12px] text-textItemBlur mt-1">
            Default proxy for accounts under this soul
          </p>
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
            disabled={isSubmitting}
            className="flex-1 px-[16px] py-[12px] bg-btnPrimary text-white rounded-[8px] hover:bg-btnPrimary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Soul'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
