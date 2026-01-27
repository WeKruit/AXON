'use client';

import { FC, useCallback, useState, useMemo } from 'react';
import clsx from 'clsx';
import { useAccountIntegrationMutations, useCompatibleIntegrations } from '../hooks';
import { PlatformIcon } from '../ui/platform-icon';
import { LinkIcon, UnlinkIcon, ChevronDownIcon, CheckIcon } from '../ui/icons';
import { useToaster } from '@gitroom/react/toaster/toaster';
import type { Account, Platform } from '../types';

interface AccountIntegrationLinkProps {
  account: Account;
  onUpdate: () => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

interface IntegrationOption {
  id: string;
  name: string;
  type: string;
  picture?: string;
}

export const AccountIntegrationLink: FC<AccountIntegrationLinkProps> = ({
  account,
  onUpdate,
  disabled = false,
  compact = false,
}) => {
  const toaster = useToaster();
  const { linkAccountToIntegration, unlinkAccountFromIntegration } = useAccountIntegrationMutations();
  const { data: compatibleIntegrations, isLoading: isLoadingIntegrations } = useCompatibleIntegrations(
    account.platform
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const isLinked = Boolean(account.integrationId);

  const handleLink = useCallback(
    async (integrationId: string) => {
      if (disabled || isLinking) return;
      setIsLinking(true);
      try {
        await linkAccountToIntegration(account.id, integrationId);
        await onUpdate();
        toaster.show('Account linked to integration successfully', 'success');
        setIsDropdownOpen(false);
      } catch (error) {
        toaster.show('Failed to link account to integration', 'warning');
      } finally {
        setIsLinking(false);
      }
    },
    [account.id, linkAccountToIntegration, onUpdate, disabled, isLinking, toaster]
  );

  const handleUnlink = useCallback(async () => {
    if (disabled || isLinking) return;
    setIsLinking(true);
    try {
      await unlinkAccountFromIntegration(account.id);
      await onUpdate();
      toaster.show('Account unlinked from integration', 'success');
    } catch (error) {
      toaster.show('Failed to unlink account from integration', 'warning');
    } finally {
      setIsLinking(false);
    }
  }, [account.id, unlinkAccountFromIntegration, onUpdate, disabled, isLinking, toaster]);

  const availableIntegrations = useMemo(() => {
    if (!compatibleIntegrations) return [];
    // Filter out the currently linked integration if any
    return compatibleIntegrations.filter((i) => i.id !== account.integrationId);
  }, [compatibleIntegrations, account.integrationId]);

  const hasNoCompatibleIntegrations = !isLoadingIntegrations && availableIntegrations.length === 0 && !isLinked;

  if (compact) {
    return (
      <div className="relative inline-block">
        {isLinked ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleUnlink}
              disabled={disabled || isLinking}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
                'bg-green-500/10 text-green-500 hover:bg-green-500/20',
                (disabled || isLinking) && 'opacity-50 cursor-not-allowed'
              )}
              title={`Linked to ${account.integration?.name || 'integration'}`}
            >
              {isLinking ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <LinkIcon size="sm" />
              )}
              <span className="max-w-[100px] truncate">{account.integration?.name || 'Linked'}</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={disabled || isLinking || hasNoCompatibleIntegrations}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors',
                'bg-newBgLineColor text-textItemBlur hover:text-newTextColor',
                (disabled || isLinking || hasNoCompatibleIntegrations) && 'opacity-50 cursor-not-allowed'
              )}
              title={hasNoCompatibleIntegrations ? 'No compatible integrations available' : 'Link to integration'}
            >
              {isLinking ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <UnlinkIcon size="sm" />
              )}
              <span>Not linked</span>
              {!hasNoCompatibleIntegrations && <ChevronDownIcon size="sm" />}
            </button>
            {isDropdownOpen && !hasNoCompatibleIntegrations && (
              <IntegrationDropdown
                integrations={availableIntegrations}
                isLoading={isLoadingIntegrations}
                onSelect={handleLink}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-newBgLineColor rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Integration Link</h3>
        {isLinked && (
          <button
            onClick={handleUnlink}
            disabled={disabled || isLinking}
            className={clsx(
              'text-xs text-red-500 hover:text-red-400 transition-colors',
              (disabled || isLinking) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLinking ? 'Unlinking...' : 'Unlink'}
          </button>
        )}
      </div>

      {isLinked && account.integration ? (
        <div className="p-3 bg-newBgColorInner rounded-lg">
          <div className="flex items-center gap-3">
            {account.integration.picture ? (
              <img
                src={account.integration.picture}
                alt={account.integration.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-btnPrimary/20 flex items-center justify-center">
                <PlatformIcon platform={account.integration.platform} size="md" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{account.integration.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <LinkIcon size="sm" />
                  Linked
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled || isLinking || hasNoCompatibleIntegrations}
            className={clsx(
              'w-full p-3 bg-newBgColorInner rounded-lg text-left transition-colors',
              'flex items-center justify-between',
              'border border-transparent hover:border-newTableBorder',
              (disabled || isLinking || hasNoCompatibleIntegrations) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-newBgLineColor flex items-center justify-center">
                {isLinking || isLoadingIntegrations ? (
                  <div className="w-4 h-4 border-2 border-textItemBlur border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UnlinkIcon size="md" className="text-textItemBlur" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {hasNoCompatibleIntegrations
                    ? 'No compatible integrations'
                    : isLoadingIntegrations
                    ? 'Loading integrations...'
                    : 'Select integration to link'}
                </p>
                <p className="text-xs text-textItemBlur">
                  {hasNoCompatibleIntegrations
                    ? `Add a ${account.platform} integration first`
                    : `${availableIntegrations.length} ${account.platform} integrations available`}
                </p>
              </div>
            </div>
            {!hasNoCompatibleIntegrations && !isLoadingIntegrations && (
              <ChevronDownIcon
                size="md"
                className={clsx('text-textItemBlur transition-transform', isDropdownOpen && 'rotate-180')}
              />
            )}
          </button>

          {isDropdownOpen && !hasNoCompatibleIntegrations && (
            <IntegrationDropdown
              integrations={availableIntegrations}
              isLoading={isLoadingIntegrations}
              onSelect={handleLink}
              onClose={() => setIsDropdownOpen(false)}
              fullWidth
            />
          )}
        </div>
      )}

      <p className="text-xs text-textItemBlur mt-2">
        Link this account to a Postiz integration to enable content scheduling and publishing.
      </p>
    </div>
  );
};

interface IntegrationDropdownProps {
  integrations: IntegrationOption[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  fullWidth?: boolean;
}

const IntegrationDropdown: FC<IntegrationDropdownProps> = ({
  integrations,
  isLoading,
  onSelect,
  onClose,
  fullWidth = false,
}) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={clsx(
          'absolute z-50 mt-1 bg-newBgColorInner border border-newTableBorder rounded-lg shadow-lg overflow-hidden',
          fullWidth ? 'left-0 right-0' : 'left-0 min-w-[200px]'
        )}
      >
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="w-5 h-5 border-2 border-textItemBlur border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-textItemBlur mt-2">Loading integrations...</p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="p-4 text-center text-textItemBlur text-sm">
            No integrations available
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {integrations.map((integration) => (
              <button
                key={integration.id}
                onClick={() => onSelect(integration.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-newBgLineColor transition-colors text-left"
              >
                {integration.picture ? (
                  <img
                    src={integration.picture}
                    alt={integration.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-btnPrimary/20 flex items-center justify-center">
                    <PlatformIcon platform={integration.type as Platform} size="sm" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{integration.name}</p>
                  <p className="text-xs text-textItemBlur capitalize">{integration.type}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

/**
 * Badge component to show integration link status in list views
 */
export interface IntegrationLinkBadgeProps {
  account: Account;
  size?: 'sm' | 'md';
}

export const IntegrationLinkBadge: FC<IntegrationLinkBadgeProps> = ({ account, size = 'sm' }) => {
  const isLinked = Boolean(account.integrationId);

  if (!isLinked) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 rounded-full',
          'bg-gray-500/10 text-textItemBlur',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
        )}
        title="Not linked to any integration"
      >
        <UnlinkIcon size="sm" />
        <span>Not linked</span>
      </span>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full',
        'bg-green-500/10 text-green-500',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      title={`Linked to ${account.integration?.name || 'integration'}`}
    >
      <LinkIcon size="sm" />
      <span className="max-w-[80px] truncate">{account.integration?.name || 'Linked'}</span>
    </span>
  );
};
