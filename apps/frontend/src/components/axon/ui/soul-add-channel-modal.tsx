'use client';

import { FC, useState, useCallback, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@gitroom/frontend/components/layout/new-modal';
import { AddProviderComponent } from '@gitroom/frontend/components/launches/add.provider.component';
import { useSoulCredentials, useSoulCredentialMutations } from '../hooks/use-axon-api';

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
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [proxyConnecting, setProxyConnecting] = useState(false);

  const credMap = new Map((credentials || []).map((c) => [c.platform, c]));

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

  // Open the original Postiz modal once data is loaded
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
              // Has credentials — let the original flow continue
              return;
            }
            // No credentials — close the Postiz modal, show credential form
            const platformName = integrationData.social.find(
              (s) => s.identifier === identifier
            )?.name ?? identifier;
            modal.closeAll();
            setCredPrompt({ identifier, name: platformName });
            setClientId('');
            setClientSecret('');
            return false; // prevent default OAuth flow
          }}
        />
      ),
      onClose: () => {
        onClose();
      },
    });

    return () => {
      // cleanup handled by modal system
    };
  }, [integrationData]);

  const handleSaveAndConnect = useCallback(async () => {
    if (!credPrompt || !clientId || !clientSecret) return;
    setSaving(true);
    try {
      const result = await upsertCredential(soulId, credPrompt.identifier, clientId, clientSecret);
      console.log('[soul-creds] save result:', result);
      // Show confirmation screen instead of reopening platform picker
      setCredsSaved({ identifier: credPrompt.identifier, name: credPrompt.name });
      setCredPrompt(null);
      setSaving(false);
    } catch (err) {
      console.error('[soul-creds] save failed:', err);
      toaster.show('Failed to save credentials', 'warning');
      setSaving(false);
    }
  }, [credPrompt, clientId, clientSecret, soulId, upsertCredential, fetchApi, modal, toaster]);

  const handleTryConnection = useCallback(async () => {
    if (!credsSaved) return;

    if (useProxy) {
      // Call the proxy-connect endpoint (TODO: backend not yet implemented)
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

    // Normal flow: directly trigger the OAuth flow for this specific platform
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
  }, [credsSaved, useProxy, fetchApi, modal, onClose, toaster]);

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

  // If showing credential prompt (no creds for platform)
  if (credPrompt) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50" onClick={onClose}>
        <div
          className="bg-newBgColor border border-newTableBorder rounded-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Configure {credPrompt.name}</h2>
            <button onClick={onClose} className="text-textItemBlur hover:text-newTextColor text-xl">
              &times;
            </button>
          </div>
          <p className="text-sm text-textItemBlur mb-4">
            This soul does not have OAuth credentials for {credPrompt.name}. Enter your app credentials to continue.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID / API Key</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter Client ID"
                className="w-full px-3 py-2 text-sm bg-newBgColorInner border border-newTableBorder rounded-lg focus:border-btnPrimary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret / API Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter Client Secret"
                className="w-full px-3 py-2 text-sm bg-newBgColorInner border border-newTableBorder rounded-lg focus:border-btnPrimary focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveAndConnect}
                disabled={saving || !clientId || !clientSecret}
                className="flex-1 px-4 py-2 bg-btnPrimary text-white rounded-lg text-sm font-medium hover:bg-btnPrimary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save & Connect'}
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
      </div>
    );
  }

  // While loading integrations, show nothing (the Postiz modal will open via useEffect)
  return null;
};
