'use client';

import { FC, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useProxies } from '../hooks';
import { PlatformIcon } from '../ui/platform-icon';
import type { CreateAccountDto, Platform, AccountPurpose, ProxyType } from '../types';
import { DEFAULT_PROXY_PURPOSE_MATRIX } from '../types';

interface AddAccountModalProps {
  soulId: string;
  onClose: () => void;
  onSubmit: (data: CreateAccountDto) => Promise<void>;
}

const platforms: { value: Platform; label: string }[] = [
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'threads', label: 'Threads' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'mastodon', label: 'Mastodon' },
];

const purposes: { value: AccountPurpose; label: string; description: string; recommendedProxy: ProxyType[] }[] = [
  {
    value: 'content',
    label: 'Content Creation',
    description: 'Primary account for publishing original content',
    recommendedProxy: DEFAULT_PROXY_PURPOSE_MATRIX.content,
  },
  {
    value: 'engagement',
    label: 'Engagement',
    description: 'Interacts with other users, comments, likes',
    recommendedProxy: DEFAULT_PROXY_PURPOSE_MATRIX.engagement,
  },
  {
    value: 'amplification',
    label: 'Amplification',
    description: 'Reposts and amplifies existing content',
    recommendedProxy: DEFAULT_PROXY_PURPOSE_MATRIX.amplification,
  },
  {
    value: 'monitoring',
    label: 'Monitoring',
    description: 'Monitors trends and competitor activity',
    recommendedProxy: DEFAULT_PROXY_PURPOSE_MATRIX.monitoring,
  },
];

export const AddAccountModal: FC<AddAccountModalProps> = ({ soulId, onClose, onSubmit }) => {
  const { data: proxies } = useProxies();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountDto>({
    defaultValues: {
      soulId,
      platform: 'twitter',
      username: '',
      displayName: '',
      purpose: 'content',
      proxyId: '',
    },
  });

  const selectedPurpose = watch('purpose');
  const recommendedProxyTypes = purposes.find((p) => p.value === selectedPurpose)?.recommendedProxy || [];

  const handleFormSubmit = useCallback(
    async (data: CreateAccountDto) => {
      const submitData = {
        ...data,
        proxyId: data.proxyId || undefined,
      };
      await onSubmit(submitData);
    },
    [onSubmit]
  );

  const filteredProxies = proxies?.filter(
    (proxy) => proxy.status === 'active' && recommendedProxyTypes.includes(proxy.type)
  );

  const otherProxies = proxies?.filter(
    (proxy) => proxy.status === 'active' && !recommendedProxyTypes.includes(proxy.type)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-newBgColorInner rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Account</h2>
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
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Platform <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {platforms.map((platform) => (
                <label
                  key={platform.value}
                  className="relative cursor-pointer"
                >
                  <input
                    type="radio"
                    value={platform.value}
                    {...register('platform', { required: 'Platform is required' })}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-newBgLineColor peer-checked:bg-newPrimaryColor/20 peer-checked:ring-2 peer-checked:ring-newPrimaryColor transition-all">
                    <PlatformIcon platform={platform.value} size="lg" />
                    <span className="text-[10px]">{platform.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('username', { required: 'Username is required' })}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
              placeholder="@username"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <input
              type="text"
              {...register('displayName')}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
              placeholder="Display name (optional)"
            />
          </div>

          {/* Purpose Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Account Purpose <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {purposes.map((purpose) => (
                <label
                  key={purpose.value}
                  className="flex items-start gap-3 p-3 rounded-lg bg-newBgLineColor cursor-pointer hover:bg-newBgLineColor/80 transition-colors"
                >
                  <input
                    type="radio"
                    value={purpose.value}
                    {...register('purpose', { required: 'Purpose is required' })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{purpose.label}</p>
                    <p className="text-xs text-textItemBlur">{purpose.description}</p>
                    <p className="text-xs text-textItemBlur mt-1">
                      Recommended proxies: {purpose.recommendedProxy.join(', ')}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Proxy Selection */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Proxy</label>
            <select
              {...register('proxyId')}
              className="w-full px-3 py-2 bg-newBgLineColor rounded-lg border border-transparent focus:border-newPrimaryColor focus:outline-none transition-colors"
            >
              <option value="">Auto-select based on purpose</option>
              {filteredProxies && filteredProxies.length > 0 && (
                <optgroup label="Recommended for this purpose">
                  {filteredProxies.map((proxy) => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.name} ({proxy.type} - {proxy.country || 'Unknown'})
                    </option>
                  ))}
                </optgroup>
              )}
              {otherProxies && otherProxies.length > 0 && (
                <optgroup label="Other available proxies">
                  {otherProxies.map((proxy) => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.name} ({proxy.type} - {proxy.country || 'Unknown'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-xs text-textItemBlur mt-1">
              Based on your selected purpose, we recommend using {recommendedProxyTypes.join(' or ')} proxies
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
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
