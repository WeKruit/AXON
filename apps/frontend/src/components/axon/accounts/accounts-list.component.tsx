'use client';

import { FC, useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccounts, useAccountMutations, useSouls } from '../hooks';
import { StatusBadge } from '../ui/status-badge';
import { PlatformIcon } from '../ui/platform-icon';
import { PurposeBadge } from '../ui/purpose-badge';
import { IntegrationLinkBadge } from './account-integration-link';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import type { Account, AccountPurpose, Platform, AccountStatus } from '../types';

type LinkStatusFilter = 'all' | 'linked' | 'unlinked';

export const AccountsListComponent: FC = () => {
  const { data: accounts, isLoading, mutate } = useAccounts();
  const { data: souls } = useSouls();
  const { deleteAccount } = useAccountMutations();
  const toaster = useToaster();

  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
  const [filterPurpose, setFilterPurpose] = useState<AccountPurpose | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AccountStatus | 'all'>('all');
  const [filterLinkStatus, setFilterLinkStatus] = useState<LinkStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter((account) => {
      if (filterPlatform !== 'all' && account.platform !== filterPlatform) return false;
      if (filterPurpose !== 'all' && account.purpose !== filterPurpose) return false;
      if (filterStatus !== 'all' && account.status !== filterStatus) return false;
      if (filterLinkStatus === 'linked' && !account.integrationId) return false;
      if (filterLinkStatus === 'unlinked' && account.integrationId) return false;
      if (searchQuery && !account.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [accounts, filterPlatform, filterPurpose, filterStatus, filterLinkStatus, searchQuery]);

  // Calculate link stats
  const linkStats = useMemo(() => {
    if (!accounts) return { linked: 0, unlinked: 0 };
    return {
      linked: accounts.filter((a) => a.integrationId).length,
      unlinked: accounts.filter((a) => !a.integrationId).length,
    };
  }, [accounts]);

  const handleDeleteAccount = useCallback(
    async (account: Account) => {
      const confirmed = await deleteDialog(
        `Are you sure you want to delete "${account.username}"?`,
        'Delete Account'
      );
      if (!confirmed) return;

      try {
        await deleteAccount(account.id);
        // Force revalidation bypassing deduplication
        await mutate(
          (currentData) => currentData?.filter((a) => a.id !== account.id) ?? [],
          { revalidate: true }
        );
        toaster.show('Account deleted successfully', 'success');
      } catch (error) {
        toaster.show('Failed to delete account', 'warning');
      }
    },
    [deleteAccount, mutate, toaster]
  );

  const getSoulName = useCallback(
    (soulId: string) => {
      return souls?.find((s) => s.id === soulId)?.name || 'Unknown';
    },
    [souls]
  );

  if (isLoading) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-newBgLineColor rounded animate-pulse" />
        </div>
        <div className="h-12 bg-newBgLineColor rounded-lg animate-pulse mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-newBgLineColor rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Manage all platform accounts across your Souls
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor placeholder-textItemBlur rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm w-64"
        />
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value as Platform | 'all')}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
        >
          <option value="all">All Platforms</option>
          <option value="twitter">Twitter/X</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="facebook">Facebook</option>
          <option value="tiktok">TikTok</option>
          <option value="threads">Threads</option>
          <option value="bluesky">Bluesky</option>
          <option value="mastodon">Mastodon</option>
        </select>
        <select
          value={filterPurpose}
          onChange={(e) => setFilterPurpose(e.target.value as AccountPurpose | 'all')}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
        >
          <option value="all">All Purposes</option>
          <option value="content">Content</option>
          <option value="engagement">Engagement</option>
          <option value="amplification">Amplification</option>
          <option value="monitoring">Monitoring</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AccountStatus | 'all')}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="warming">Warming</option>
          <option value="suspended">Suspended</option>
          <option value="needs_verification">Needs Verification</option>
        </select>
        <select
          value={filterLinkStatus}
          onChange={(e) => setFilterLinkStatus(e.target.value as LinkStatusFilter)}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
        >
          <option value="all">All Link Status</option>
          <option value="linked">Linked</option>
          <option value="unlinked">Not Linked</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold">{accounts?.length || 0}</p>
          <p className="text-xs text-textItemBlur">Total Accounts</p>
        </div>
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold text-green-500">
            {accounts?.filter((a) => a.status === 'active').length || 0}
          </p>
          <p className="text-xs text-textItemBlur">Active</p>
        </div>
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold text-yellow-500">
            {accounts?.filter((a) => a.status === 'warming').length || 0}
          </p>
          <p className="text-xs text-textItemBlur">Warming Up</p>
        </div>
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold text-orange-500">
            {accounts?.filter((a) => a.status === 'needs_verification').length || 0}
          </p>
          <p className="text-xs text-textItemBlur">Needs Verification</p>
        </div>
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold text-red-500">
            {accounts?.filter((a) => a.status === 'suspended').length || 0}
          </p>
          <p className="text-xs text-textItemBlur">Suspended</p>
        </div>
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold text-blue-500">{linkStats.linked}</p>
          <p className="text-xs text-textItemBlur">Linked</p>
        </div>
        <div className="bg-newBgLineColor rounded-lg p-3">
          <p className="text-xl font-semibold text-textItemBlur">{linkStats.unlinked}</p>
          <p className="text-xs text-textItemBlur">Not Linked</p>
        </div>
      </div>

      {/* Accounts Table */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-16 text-textItemBlur">
          {accounts?.length === 0 ? (
            <>
              <p className="mb-2">No accounts found</p>
              <p className="text-sm">Create a Soul first, then add accounts to it</p>
            </>
          ) : (
            <p>No accounts match your filters</p>
          )}
        </div>
      ) : (
        <div className="bg-newBgLineColor rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-newBgColorInner">
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Account</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Soul</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Purpose</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Integration</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Warmup</th>
                <th className="text-right text-xs font-medium text-textItemBlur px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b border-newBgColorInner last:border-0 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={account.platform} />
                      <div>
                        <p className="font-medium">{account.username}</p>
                        {account.displayName && (
                          <p className="text-xs text-textItemBlur">{account.displayName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/axon/souls/${account.soulId}`}
                      className="text-sm text-btnPrimary hover:underline"
                    >
                      {getSoulName(account.soulId)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <PurposeBadge purpose={account.purpose} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={account.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <IntegrationLinkBadge account={account} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {account.warmupProgress !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-newBgColorInner rounded-full overflow-hidden">
                          <div
                            className="h-full bg-btnPrimary rounded-full transition-all"
                            style={{ width: `${account.warmupProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-textItemBlur">{account.warmupProgress}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-textItemBlur">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
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
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteAccount(account)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
