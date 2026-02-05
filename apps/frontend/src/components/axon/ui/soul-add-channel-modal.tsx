'use client';

import { FC, useState, useCallback, useEffect, useMemo } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { AddProviderComponent } from '@gitroom/frontend/components/launches/add.provider.component';
import { useSoulCredentials, useSoulCredentialMutations } from '../hooks/use-axon-api';
import { getPlatformConfig } from '../config/platform-auth-config';
import { PlatformSetupGuide } from './platform-setup-guide';

interface SoulAddChannelModalProps {
  soulId: string;
  soulOrgId: string;
  onClose: () => void;
}

export const SoulAddChannelModal: FC<SoulAddChannelModalProps> = ({
  soulId,
  soulOrgId,
  onClose,
}) => {
  const fetchApi = useFetch();
  const toaster = useToaster();
  const modal = useModals();
  const { data: credentials } = useSoulCredentials(soulId);
  const { upsertCredential } = useSoulCredentialMutations();

  const [integrationData, setIntegrationData] = useState<{ social: any[]; article: any[] } | null>(null);
  const [credPrompt, setCredPrompt] = useState<{ identifier: string; name: string } | null>(null);
  const [credsSaved, setCredsSaved] = useState<{ identifier: string; name: string } | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [proxyConnecting, setProxyConnecting] = useState(false);

  const credMap = new Map((credentials || []).map((c) => [c.platform, c]));

  const backendUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin)
    : '';

  const activeConfig = useMemo(
    () => credPrompt ? getPlatformConfig(credPrompt.identifier) : null,
    [credPrompt],
  );

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Switch to soul org and fetch integrations on mount
  useEffect(() => {
    (async () => {
      try {
        const changeRes = await fetchApi('/user/change-org', {
          method: 'POST',
          body: JSON.stringify({ id: soulOrgId }),
        });
        if (!changeRes.ok) throw new Error('Failed to switch org');

        const data = await (await fetchApi('/integrations')).json();
        setIntegrationData(data);
      } catch {
        toaster.show('Failed to load integrations', 'warning');
        onClose();
      }
    })();
  }, []);

  // Open the original AXON modal once data is loaded
  useEffect(() => {
    if (!integrationData) return;

    modal.openModal({
      title: 'Add Channel',
      withCloseButton: true,
      children: (
        <AddProviderComponent
          social={integrationData.social}
          article={integrationData.article}
          onPlatformClick={async (identifier) => {
            const hasCreds = credMap.has(identifier);
            if (hasCreds) {
              return; // let the original OAuth flow continue
            }
            // No credentials — close the AXON modal, show platform-specific setup guide
            const platformName = integrationData.social.find(
              (s) => s.identifier === identifier
            )?.name ?? identifier;
            modal.closeAll();
            setCredPrompt({ identifier, name: platformName });
            setFieldValues({});
            return false; // prevent default OAuth flow
          }}
        />
      ),
      onClose: () => {
        onClose();
      },
    });
  }, [integrationData]);

  const handleSaveAndConnect = useCallback(async () => {
    if (!credPrompt || !activeConfig) return;

    // Validate required fields
    const missingRequired = activeConfig.fields
      .filter((f) => f.required && !fieldValues[f.key]?.trim())
      .map((f) => f.label);
    if (missingRequired.length > 0) {
      toaster.show(`Missing required fields: ${missingRequired.join(', ')}`, 'warning');
      return;
    }

    // Map field values to API payload
    let clientId = '';
    let clientSecret = '';
    const additionalConfig: Record<string, string> = {};

    for (const field of activeConfig.fields) {
      const value = fieldValues[field.key] || '';
      if (field.storageKey === 'clientId') {
        clientId = value;
      } else if (field.storageKey === 'clientSecret') {
        clientSecret = value;
      } else if (field.storageKey === 'additionalConfig' && field.additionalConfigKey) {
        additionalConfig[field.additionalConfigKey] = value;
      }
    }

    setSaving(true);
    try {
      const result = await upsertCredential(
        soulId,
        credPrompt.identifier,
        clientId,
        clientSecret,
        Object.keys(additionalConfig).length > 0 ? additionalConfig : undefined,
      );
      console.log('[soul-creds] save result:', result);
      setCredsSaved({ identifier: credPrompt.identifier, name: credPrompt.name });
      setCredPrompt(null);
      setSaving(false);
    } catch (err) {
      console.error('[soul-creds] save failed:', err);
      toaster.show('Failed to save credentials', 'warning');
      setSaving(false);
    }
  }, [credPrompt, activeConfig, fieldValues, soulId, upsertCredential, toaster]);

  const handleTryConnection = useCallback(async () => {
    if (!credsSaved) return;

    if (useProxy) {
      setProxyConnecting(true);
      try {
        const res = await fetchApi(`/integrations/social/${credsSaved.identifier}/proxy-connect`, {
          method: 'POST',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || 'Proxy connection failed');
        }
        const { url } = await res.json();
        window.location.href = url;
      } catch (err: any) {
        toaster.show(err?.message || 'Proxy connection not yet available', 'warning');
        setProxyConnecting(false);
      }
      return;
    }

    // Directly trigger the OAuth flow for this specific platform
    try {
      const { url, err } = await (
        await fetchApi(`/integrations/social/${credsSaved.identifier}`)
      ).json();
      if (err || !url) {
        toaster.show('Failed to generate auth URL. Check credentials.', 'warning');
        return;
      }
      window.location.href = url;
    } catch {
      toaster.show('Failed to start OAuth flow', 'warning');
    }
  }, [credsSaved, useProxy, fetchApi, toaster]);

  // Credentials saved confirmation screen
  if (credsSaved) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-newBgColor border border-newTableBorder rounded-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Credentials Saved</h2>
            <button onClick={onClose} className="text-textItemBlur hover:text-newTextColor text-xl">
              &times;
            </button>
          </div>
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-textItemBlur">
              Credentials saved for <span className="font-medium text-newTextColor">{credsSaved.name}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-textItemBlur cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={(e) => setUseProxy(e.target.checked)}
                className="rounded border-newTableBorder"
              />
              Use proxy to connect (shared app credentials)
            </label>
            <button
              onClick={handleTryConnection}
              disabled={proxyConnecting}
              className="w-full px-4 py-2 bg-btnPrimary text-white rounded-lg text-sm font-medium hover:bg-btnPrimary/90 disabled:opacity-50 transition-colors"
            >
              {proxyConnecting ? 'Connecting...' : 'Try Connection'}
            </button>
            <button
              onClick={() => {
                const config = getPlatformConfig(credsSaved.identifier);
                // Pre-fill from existing credential data if available
                const existing = credMap.get(credsSaved.identifier);
                const prefilled: Record<string, string> = {};
                if (existing) {
                  for (const field of config.fields) {
                    if (field.storageKey === 'clientId') prefilled[field.key] = existing.clientId || '';
                  }
                }
                setFieldValues(prefilled);
                setCredPrompt({ identifier: credsSaved.identifier, name: credsSaved.name });
                setCredsSaved(null);
              }}
              className="w-full px-4 py-2 bg-newBgLineColor rounded-lg text-sm hover:bg-newBgLineColor/80 transition-colors"
            >
              Edit Credentials
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-textItemBlur hover:text-newTextColor transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Platform-specific setup guide with credential form
  if (credPrompt && activeConfig) {
    const allRequiredFilled = activeConfig.fields
      .filter((f) => f.required)
      .every((f) => fieldValues[f.key]?.trim());

    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-newBgColor border border-newTableBorder rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Configure {credPrompt.name}</h2>
            <button onClick={onClose} className="text-textItemBlur hover:text-newTextColor text-xl">
              &times;
            </button>
          </div>
          <p className="text-sm text-textItemBlur mb-4">
            Follow the steps below to set up {credPrompt.name} credentials for this soul.
          </p>

          <PlatformSetupGuide
            config={activeConfig}
            fieldValues={fieldValues}
            onFieldChange={handleFieldChange}
            backendUrl={backendUrl}
          />

          <div className="flex gap-3 pt-4 mt-4 border-t border-newTableBorder">
            <button
              onClick={handleSaveAndConnect}
              disabled={saving || !allRequiredFilled}
              className="flex-1 px-4 py-2 bg-btnPrimary text-white rounded-lg text-sm font-medium hover:bg-btnPrimary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-newBgLineColor rounded-lg text-sm hover:bg-newBgLineColor/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // While loading integrations, show nothing (the AXON modal will open via useEffect)
  return null;
};
