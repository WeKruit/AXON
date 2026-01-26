'use client';

import { FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import type { CreateProxyDto, ProxyType } from '../types';

interface AddProxyModalProps {
  onClose: () => void;
  onSubmit: (data: CreateProxyDto) => Promise<void>;
}

const proxyTypes: { value: ProxyType; label: string; description: string }[] = [
  {
    value: 'residential',
    label: 'Residential',
    description: 'Real residential IPs - best for content creation and high-trust activities',
  },
  {
    value: 'datacenter',
    label: 'Datacenter',
    description: 'High-speed datacenter IPs - ideal for monitoring and bulk operations',
  },
  {
    value: 'mobile',
    label: 'Mobile',
    description: 'Mobile carrier IPs - excellent for engagement activities',
  },
  {
    value: 'isp',
    label: 'ISP',
    description: 'Static ISP IPs - good for long-running sessions',
  },
];

export const AddProxyModal: FC<AddProxyModalProps> = ({ onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProxyDto>({
    defaultValues: {
      name: '',
      type: 'residential',
      host: '',
      port: 8080,
      username: '',
      password: '',
      country: '',
      city: '',
      isp: '',
      rotationInterval: undefined,
    },
  });

  const handleFormSubmit = useCallback(
    async (data: CreateProxyDto) => {
      await onSubmit(data);
    },
    [onSubmit]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-newBgColorInner text-newTextColor rounded-[24px] p-[32px] w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-[24px]">
          <h2 className="text-[24px] font-semibold text-newTextColor">Add Proxy</h2>
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
              placeholder="e.g., US Residential #1"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Proxy Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {proxyTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-start gap-3 p-3 rounded-lg bg-newBgLineColor cursor-pointer hover:bg-newBgLineColor/80 transition-colors"
                >
                  <input
                    type="radio"
                    value={type.value}
                    {...register('type', { required: 'Type is required' })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{type.label}</p>
                    <p className="text-xs text-textItemBlur">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Connection Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-textItemBlur mb-1">
                  Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('host', { required: 'Host is required' })}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="proxy.example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">
                  Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('port', {
                    required: 'Port is required',
                    valueAsNumber: true,
                    min: 1,
                    max: 65535,
                  })}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="8080"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Username</label>
                <input
                  type="text"
                  {...register('username')}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-textItemBlur">Location (Optional)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Country</label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="e.g., US"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">City</label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="e.g., New York"
                />
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">ISP</label>
                <input
                  type="text"
                  {...register('isp')}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] text-sm border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
                  placeholder="e.g., Comcast"
                />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Rotation Interval (minutes)</label>
            <input
              type="number"
              {...register('rotationInterval', { valueAsNumber: true })}
              className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none transition-colors"
              placeholder="Leave empty for no rotation"
            />
            <p className="text-xs text-textItemBlur mt-1">
              Set how often the proxy should rotate to a new IP (if supported)
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
            >
              {isSubmitting ? 'Adding...' : 'Add Proxy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
