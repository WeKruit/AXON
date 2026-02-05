'use client';

import { FC, useState, useCallback } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { PLATFORM_AUTH_LIST, getPlatformConfig } from '../config/platform-auth-config';

interface Credential {
  platform: string;
  clientId: string;
  clientSecretMasked: string;
  additionalConfig?: Record<string, string>;
}

interface SoulCredentialsManagerProps {
  soulId: string;
}

export const SoulCredentialsManager: FC<SoulCredentialsManagerProps> = ({ soulId }) => {
  const fetch = useFetch();
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: credentials, mutate } = useSWR<Credential[]>(
    `/axon/souls/${soulId}/credentials`,
    async () => {
      const res = await fetch(`/axon/souls/${soulId}/credentials`);
      if (!res.ok) return [];
      return res.json();
    },
  );

  const credMap = new Map((credentials || []).map((c) => [c.platform, c]));

  const handleEdit = (platformId: string) => {
    const existing = credMap.get(platformId);
    const config = getPlatformConfig(platformId);
    const prefilled: Record<string, string> = {};
    if (existing) {
      for (const field of config.fields) {
        if (field.storageKey === 'clientId') {
          prefilled[field.key] = existing.clientId || '';
        } else if (field.storageKey === 'additionalConfig' && field.additionalConfigKey && existing.additionalConfig) {
          prefilled[field.key] = existing.additionalConfig[field.additionalConfigKey] || '';
        }
        // Don't pre-fill secrets
      }
    }
    setEditingPlatform(platformId);
    setFieldValues(prefilled);
  };

  const handleSave = useCallback(async () => {
    if (!editingPlatform) return;
    const config = getPlatformConfig(editingPlatform);

    let clientId = '';
    let clientSecret = '';
    const additionalConfig: Record<string, string> = {};

    for (const field of config.fields) {
      const value = fieldValues[field.key] || '';
      if (field.storageKey === 'clientId') clientId = value;
      else if (field.storageKey === 'clientSecret') clientSecret = value;
      else if (field.storageKey === 'additionalConfig' && field.additionalConfigKey) {
        additionalConfig[field.additionalConfigKey] = value;
      }
    }

    if (!clientId || !clientSecret) return;

    setSaving(true);
    try {
      await fetch(`/axon/souls/${soulId}/credentials/${editingPlatform}`, {
        method: 'PUT',
        body: JSON.stringify({
          clientId,
          clientSecret,
          ...(Object.keys(additionalConfig).length > 0 ? { additionalConfig } : {}),
        }),
      });
      setEditingPlatform(null);
      setFieldValues({});
      mutate();
    } finally {
      setSaving(false);
    }
  }, [editingPlatform, fieldValues, soulId, fetch, mutate]);

  const handleDelete = useCallback(async (platform: string) => {
    await fetch(`/axon/souls/${soulId}/credentials/${platform}`, {
      method: 'DELETE',
    });
    mutate();
  }, [soulId, fetch, mutate]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">OAuth App Credentials</h3>
      <p className="text-sm text-textItemBlur">
        Configure per-soul OAuth app credentials for each platform. When set, these credentials
        will be used instead of the global app credentials when connecting channels for this soul.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLATFORM_AUTH_LIST.map((platform) => {
          const cred = credMap.get(platform.identifier);
          const isEditing = editingPlatform === platform.identifier;
          const config = getPlatformConfig(platform.identifier);

          return (
            <div
              key={platform.identifier}
              className="border border-newBgLineColor rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{platform.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    cred
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {cred ? 'Configured' : 'Not Set'}
                </span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {config.fields.map((field) => (
                    <input
                      key={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={fieldValues[field.key] || ''}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full px-2 py-1.5 text-sm bg-newBgColor border border-newBgLineColor rounded"
                    />
                  ))}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1 text-xs bg-btnPrimary text-white rounded disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingPlatform(null); setFieldValues({}); }}
                      className="px-3 py-1 text-xs bg-newBgLineColor rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {cred && (
                    <span className="text-xs text-textItemBlur truncate flex-1">
                      Secret: {cred.clientSecretMasked}
                    </span>
                  )}
                  <button
                    onClick={() => handleEdit(platform.identifier)}
                    className="px-2 py-1 text-xs bg-newBgLineColor rounded hover:bg-newBgLineColor/80"
                  >
                    {cred ? 'Edit' : 'Configure'}
                  </button>
                  {cred && (
                    <button
                      onClick={() => handleDelete(platform.identifier)}
                      className="px-2 py-1 text-xs text-red-400 bg-red-500/10 rounded hover:bg-red-500/20"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
