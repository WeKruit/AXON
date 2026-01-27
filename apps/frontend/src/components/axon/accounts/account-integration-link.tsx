'use client';

import { FC, useCallback, useState } from 'react';
import clsx from 'clsx';
import { useCompatibleIntegrations, useAccountIntegrationMutations } from '../hooks';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { PlatformIcon } from '../ui/platform-icon';
import type { Platform, AccountIntegration } from '../types';

interface AccountIntegrationLinkProps {
  accountId: string;
  platform: Platform;
  currentIntegration?: AccountIntegration | null;
  onLinkChange?: () => void;
  disabled?: boolean;
}

export const AccountIntegrationLink: FC<AccountIntegrationLinkProps> = ({
  accountId,
  platform,
  currentIntegration,
  onLinkChange,
  disabled = false,
}) => {
  const { data: compatibleIntegrations, isLoading: isLoadingIntegrations } =
    useCompatibleIntegrations(platform);
  const { linkAccountToIntegration, unlinkAccountFromIntegration } =
    useAccountIntegrationMutations();
  const toaster = useToaster();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string>(
    currentIntegration?.id || ''
  );

  const handleLink = useCallback(async () => {
    if (!selectedIntegrationId || isProcessing || disabled) return;

    setIsProcessing(true);
    try {
      await linkAccountToIntegration(accountId, selectedIntegrationId);
      toaster.show('Account linked to integration successfully', 'success');
      onLinkChange?.();
    } catch (error) {
      toaster.show('Failed to link account to integration', 'warning');
    } finally {
      setIsProcessing(false);
    }
  }, [
    accountId,
    selectedIntegrationId,
    isProcessing,
    disabled,
    linkAccountToIntegration,
    onLinkChange,
    toaster,
  ]);

  const handleUnlink = useCallback(async () => {
    if (!currentIntegration || isProcessing || disabled) return;

    setIsProcessing(true);
    try {
      await unlinkAccountFromIntegration(accountId);
      setSelectedIntegrationId('');
      toaster.show('Account unlinked from integration', 'success');
      onLinkChange?.();
    } catch (error) {
      toaster.show('Failed to unlink account from integration', 'warning');
    } finally {
      setIsProcessing(false);
    }
  }, [
    accountId,
    currentIntegration,
    isProcessing,
    disabled,
    unlinkAccountFromIntegration,
    onLinkChange,
    toaster,
  ]);

  const isLinked = !!currentIntegration;
  const hasCompatibleIntegrations =
    compatibleIntegrations && compatibleIntegrations.length > 0;

  if (isLoadingIntegrations) {
    return (
      <div className="p-3 bg-newBgColorInner rounded-lg">
        <div className="h-4 w-32 bg-newBgLineColor rounded animate-pulse mb-2" />
        <div className="h-10 bg-newBgLineColor rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current Link Status */}
      {isLinked && (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            {currentIntegration.picture ? (
              <img
                src={currentIntegration.picture}
                alt={currentIntegration.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-newBgLineColor flex items-center justify-center">
                <PlatformIcon platform={currentIntegration.platform} size="sm" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{currentIntegration.name}</p>
              <p className="text-xs text-blue-400">Linked Integration</p>
            </div>
          </div>
          <button
            onClick={handleUnlink}
            disabled={isProcessing || disabled}
            className={clsx(
              'px-3 py-1.5 text-xs rounded-lg transition-colors',
              'bg-red-500/10 text-red-400 hover:bg-red-500/20',
              (isProcessing || disabled) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? 'Unlinking...' : 'Unlink'}
          </button>
        </div>
      )}

      {/* Link Selection */}
      {!isLinked && (
        <div className="space-y-2">
          {hasCompatibleIntegrations ? (
            <>
              <label className="block text-xs text-textItemBlur">
                Link to a {platform} channel
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedIntegrationId}
                  onChange={(e) => setSelectedIntegrationId(e.target.value)}
                  disabled={isProcessing || disabled}
                  className={clsx(
                    'flex-1 px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder',
                    'focus:border-btnPrimary focus:outline-none transition-colors text-sm',
                    (isProcessing || disabled) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <option value="">Select integration...</option>
                  {compatibleIntegrations.map((integration) => (
                    <option key={integration.id} value={integration.id}>
                      {integration.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLink}
                  disabled={!selectedIntegrationId || isProcessing || disabled}
                  className={clsx(
                    'px-4 py-2 bg-btnPrimary text-white rounded-[8px] text-sm transition-colors',
                    'hover:bg-btnPrimary/90',
                    (!selectedIntegrationId || isProcessing || disabled) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isProcessing ? 'Linking...' : 'Link'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 bg-newBgColorInner rounded-lg text-center">
              <p className="text-sm text-textItemBlur">
                No {platform} integrations available
              </p>
              <p className="text-xs text-textItemBlur mt-1">
                Connect a {platform} channel in Integrations to link this account
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-textItemBlur">
        {isLinked
          ? 'This account is linked to a channel and can publish content directly.'
          : 'Link this account to a connected channel to enable direct publishing.'}
      </p>
    </div>
  );
};

/**
 * Compact link indicator for list views
 */
interface IntegrationLinkIndicatorProps {
  integration?: AccountIntegration | null;
  showLabel?: boolean;
}

export const IntegrationLinkIndicator: FC<IntegrationLinkIndicatorProps> = ({
  integration,
  showLabel = false,
}) => {
  const isLinked = !!integration;

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
        isLinked
          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
          : 'bg-newBgLineColor text-textItemBlur'
      )}
      title={
        isLinked
          ? `Linked to ${integration.name}`
          : 'Not linked to any integration'
      }
    >
      {isLinked ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {showLabel && <span>{integration.name}</span>}
          {!showLabel && <span>Linked</span>}
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
            <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
            <line x1="8" y1="2" x2="2" y2="8" />
            <line x1="22" y1="16" x2="16" y2="22" />
          </svg>
          <span>Unlinked</span>
        </>
      )}
    </div>
  );
};
