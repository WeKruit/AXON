'use client';

import { FC, Suspense, useCallback, useState, memo } from 'react';
import Link from 'next/link';
import { useSoulDashboard, useSoulMutations, useAccountMutations } from '../hooks';
import { StatusBadge } from '../ui/status-badge';
import { PlatformIcon, PlatformBadge } from '../ui/platform-icon';
import { PurposeBadge } from '../ui/purpose-badge';
import { SoulCredentialsManager } from '../ui/soul-credentials-manager';
import { SoulAddChannelModal } from '../ui/soul-add-channel-modal';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import type { Account, CreateAccountDto, SoulStatus } from '../types';
import { AddAccountModal } from '../accounts/add-account-modal';

interface SoulDashboardProps {
  soulId: string;
}

/**
 * Soul Dashboard Component
 * Uses combined data fetching to eliminate waterfall requests (WEC-181)
 * Soul and accounts are fetched in parallel via useSoulDashboard hook
 */
export const SoulDashboardComponent: FC<SoulDashboardProps> = ({ soulId }) => {
  // Combined hook fetches soul + accounts in parallel - eliminates waterfall
  const {
    soul,
    accounts,
    isLoading,
    mutate,
  } = useSoulDashboard(soulId);
  const { updateSoul, deleteSoul } = useSoulMutations();
  const { createAccount, deleteAccount } = useAccountMutations();
  const toaster = useToaster();
  const fetchApi = useFetch();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [addChannelOrgId, setAddChannelOrgId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'accounts' | 'credentials'>('accounts');

  // Connect Channel: ensure soul-org exists, then open soul-aware Add Channel modal
  const handleConnectChannel = useCallback(async () => {
    if (!soul) return;
    try {
      let orgId = soul.soulOrgId;

      if (!orgId) {
        const res = await fetchApi(`/axon/souls/${soul.id}/ensure-org`, { method: 'POST' });
        if (!res.ok) {
          throw new Error('Failed to ensure soul org');
        }
        const updated = await res.json();
        orgId = updated.soulOrgId;
        mutate();
      }

      if (!orgId) {
        toaster.show('Failed to resolve soul organization.', 'warning');
        return;
      }

      setAddChannelOrgId(orgId);
    } catch {
      toaster.show('Failed to connect channel. Please try again.', 'warning');
    }
  }, [soul, fetchApi, toaster, mutate]);

  const handleStatusChange = useCallback(
    async (status: SoulStatus) => {
      if (!soul) return;
      try {
        await updateSoul(soul.id, { status });
        // Force revalidation bypassing deduplication
        await mutate(undefined, { revalidate: true });
        toaster.show(`Soul status updated to ${status}`, 'success');
      } catch (error) {
        toaster.show('Failed to update status', 'warning');
      }
    },
    [soul, updateSoul, mutate, toaster]
  );

  const handleAddAccount = useCallback(
    async (data: CreateAccountDto) => {
      try {
        await createAccount({ ...data, soulId });
        await mutate();
        setIsAddAccountOpen(false);
        toaster.show('Account added successfully', 'success');
      } catch (error) {
        toaster.show('Failed to add account', 'warning');
      }
    },
    [createAccount, soulId, mutate, toaster]
  );

  const handleDeleteAccount = useCallback(
    async (account: Account) => {
      const confirmed = await deleteDialog(
        `Are you sure you want to remove "${account.username}" from this soul?`,
        'Remove Account'
      );
      if (!confirmed) return;

      try {
        await deleteAccount(account.id);
        await mutate();
        toaster.show('Account removed successfully', 'success');
      } catch (error) {
        toaster.show('Failed to remove account', 'warning');
      }
    },
    [deleteAccount, mutate, toaster]
  );

  if (isLoading || !soul) {
    return <SoulDashboardSkeleton />;
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-textItemBlur mb-4">
        <Link href="/axon/souls" className="hover:text-newTextColor transition-colors">
          Souls
        </Link>
        <span>/</span>
        <span className="text-newTextColor">{soul.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
            {soul.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{soul.name}</h1>
            {soul.description && (
              <p className="text-sm text-textItemBlur mt-1">{soul.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={soul.status} />
          <select
            value={soul.status}
            onChange={(e) => handleStatusChange(e.target.value as SoulStatus)}
            className="px-3 py-1.5 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
          >
            <option value="active">Set Active</option>
            <option value="inactive">Set Inactive</option>
            <option value="warming">Set Warming</option>
            <option value="suspended">Set Suspended</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          {soul.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Accounts" value={soul.stats.totalAccounts} />
              <StatCard label="Active Accounts" value={soul.stats.activeAccounts} />
              <StatCard label="Total Posts" value={soul.stats.totalPosts} />
              <StatCard
                label="Avg Engagement"
                value={`${soul.stats.avgEngagementRate.toFixed(1)}%`}
              />
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-newTableBorder">
            <div className="flex gap-6">
              {(['accounts', 'credentials'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-btnPrimary border-b-2 border-btnPrimary'
                      : 'text-textItemBlur hover:text-newTextColor'
                  }`}
                >
                  {tab === 'accounts' ? 'Accounts & Channels' : 'API Credentials'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'accounts' && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Accounts & Channels</h2>
                <button
                onClick={handleConnectChannel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-btnPrimary text-white rounded-lg text-sm hover:bg-btnPrimary/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Channel
              </button>
              </div>

              {!accounts || accounts.length === 0 ? (
                <div className="text-center py-8 text-textItemBlur">
                  <p className="mb-2">No channels connected yet</p>
                  <button onClick={handleConnectChannel} className="text-btnPrimary hover:underline">
                    Add your first channel
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onDelete={() => handleDeleteAccount(account)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <SoulCredentialsManager soulId={soulId} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Persona */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Assigned Persona</h3>
            {soul.persona ? (
              <Link
                href={`/axon/personas/${soul.persona.id}`}
                className="block p-3 bg-newBgColorInner rounded-lg hover:bg-newBgColorInner/80 transition-colors"
              >
                <p className="font-medium">{soul.persona.name}</p>
                <p className="text-xs text-textItemBlur mt-1">
                  {soul.persona.tone} • {soul.persona.style}
                </p>
              </Link>
            ) : (
              <p className="text-sm text-textItemBlur">No persona assigned</p>
            )}
          </div>

          {/* Proxy */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Default Proxy</h3>
            {soul.proxy ? (
              <div className="p-3 bg-newBgColorInner rounded-lg">
                <p className="font-medium">{soul.proxy.name}</p>
                <p className="text-xs text-textItemBlur mt-1">
                  {soul.proxy.type} • {soul.proxy.country || 'Unknown'}
                </p>
                <StatusBadge status={soul.proxy.status} size="sm" />
              </div>
            ) : (
              <p className="text-sm text-textItemBlur">No default proxy</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/launches?soulId=${soulId}`}
                className="flex items-center gap-2 w-full p-2 text-left text-sm bg-newBgColorInner rounded-lg hover:bg-newBgColorInner/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Schedule Content
              </Link>
              <Link
                href={`/analytics?soulId=${soulId}`}
                className="flex items-center gap-2 w-full p-2 text-left text-sm bg-newBgColorInner rounded-lg hover:bg-newBgColorInner/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isAddAccountOpen && (
        <AddAccountModal
          soulId={soulId}
          onClose={() => setIsAddAccountOpen(false)}
          onSubmit={handleAddAccount}
        />
      )}

      {addChannelOrgId && (
        <SoulAddChannelModal
          soulId={soulId}
          soulOrgId={addChannelOrgId}
          onClose={() => setAddChannelOrgId(null)}
        />
      )}
    </div>
  );
};

/**
 * Skeleton loader for Soul Dashboard
 * Provides visual feedback during initial load
 */
const SoulDashboardSkeleton: FC = () => (
  <div className="flex-1 bg-newBgColorInner p-6">
    <div className="h-4 w-24 bg-newBgLineColor rounded animate-pulse mb-4" />
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-newBgLineColor animate-pulse" />
        <div>
          <div className="h-7 w-36 bg-newBgLineColor rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-newBgLineColor rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-16 bg-newBgLineColor rounded animate-pulse" />
        <div className="h-8 w-28 bg-newBgLineColor rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-newBgLineColor rounded-lg p-4 animate-pulse">
              <div className="h-8 w-12 bg-newBgColorInner rounded mb-2" />
              <div className="h-3 w-20 bg-newBgColorInner rounded" />
            </div>
          ))}
        </div>
        <div className="bg-newBgLineColor rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-20 bg-newBgColorInner rounded animate-pulse" />
            <div className="h-8 w-28 bg-newBgColorInner rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-newBgColorInner rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-newBgLineColor rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton for accounts section (used with Suspense)
 */
export const AccountsSectionSkeleton: FC = () => (
  <div className="space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-16 bg-newBgColorInner rounded-lg animate-pulse" />
    ))}
  </div>
);

const StatCard: FC<{ label: string; value: string | number }> = memo(({ label, value }) => (
  <div className="bg-newBgLineColor rounded-lg p-4">
    <p className="text-2xl font-semibold">{value}</p>
    <p className="text-xs text-textItemBlur mt-1">{label}</p>
  </div>
));

StatCard.displayName = 'StatCard';

interface AccountRowProps {
  account: Account;
  onDelete: () => void;
}

const AccountRow: FC<AccountRowProps> = memo(({ account, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-newBgColorInner rounded-lg group">
    <div className="flex items-center gap-3">
      <PlatformIcon platform={account.platform} size="md" />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{account.username}</span>
          <StatusBadge status={account.status} size="sm" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <PurposeBadge purpose={account.purpose} size="sm" />
          {account.warmupProgress !== undefined && account.warmupProgress < 100 && (
            <span className="text-xs text-textItemBlur">
              Warmup: {account.warmupProgress}%
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Link
        href={`/axon/accounts/${account.id}`}
        className="p-1.5 text-textItemBlur hover:text-newTextColor transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </Link>
      <button
        onClick={onDelete}
        className="p-1.5 text-textItemBlur hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
));

AccountRow.displayName = 'AccountRow';
