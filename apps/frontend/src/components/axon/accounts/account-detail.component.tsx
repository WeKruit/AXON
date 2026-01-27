'use client';

import { FC, useCallback } from 'react';
import Link from 'next/link';
import { useAccount, useAccountMutations, useSoul } from '../hooks';
import { StatusBadge } from '../ui/status-badge';
import { PlatformIcon } from '../ui/platform-icon';
import { PurposeBadge, ProxyTypeBadge } from '../ui/purpose-badge';
import { AccountIntegrationLink } from './account-integration-link';
import { useToaster } from '@gitroom/react/toaster/toaster';
import type { AccountStatus, AccountPurpose } from '../types';

interface AccountDetailProps {
  accountId: string;
}

export const AccountDetailComponent: FC<AccountDetailProps> = ({ accountId }) => {
  const { data: account, isLoading, mutate } = useAccount(accountId);
  const { data: soul } = useSoul(account?.soulId);
  const { updateAccount } = useAccountMutations();
  const toaster = useToaster();

  const handleStatusChange = useCallback(
    async (status: AccountStatus) => {
      if (!account) return;
      try {
        await updateAccount(account.id, { status });
        await mutate();
        toaster.show(`Account status updated to ${status}`, 'success');
      } catch (error) {
        toaster.show('Failed to update status', 'warning');
      }
    },
    [account, updateAccount, mutate, toaster]
  );

  const handlePurposeChange = useCallback(
    async (purpose: AccountPurpose) => {
      if (!account) return;
      try {
        await updateAccount(account.id, { purpose });
        await mutate();
        toaster.show(`Account purpose updated to ${purpose}`, 'success');
      } catch (error) {
        toaster.show('Failed to update purpose', 'warning');
      }
    },
    [account, updateAccount, mutate, toaster]
  );

  if (isLoading || !account) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="h-8 w-48 bg-newBgLineColor rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 bg-newBgLineColor rounded-lg animate-pulse" />
            <div className="h-48 bg-newBgLineColor rounded-lg animate-pulse" />
          </div>
          <div className="h-64 bg-newBgLineColor rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-newBgColorInner p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-textItemBlur mb-4">
        <Link href="/axon/accounts" className="hover:text-newTextColor transition-colors">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-newTextColor">{account.username}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-newBgLineColor flex items-center justify-center">
            <PlatformIcon platform={account.platform} size="lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{account.username}</h1>
              <StatusBadge status={account.status} />
            </div>
            {account.displayName && (
              <p className="text-sm text-textItemBlur">{account.displayName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <PurposeBadge purpose={account.purpose} size="sm" />
              {soul && (
                <Link
                  href={`/axon/souls/${soul.id}`}
                  className="text-xs text-btnPrimary hover:underline"
                >
                  Soul: {soul.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          {account.stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Followers" value={formatNumber(account.stats.followers)} />
              <StatCard label="Following" value={formatNumber(account.stats.following)} />
              <StatCard label="Posts" value={formatNumber(account.stats.posts)} />
              <StatCard label="Engagement" value={formatNumber(account.stats.engagement)} />
              <StatCard
                label="Engagement Rate"
                value={`${account.stats.engagementRate.toFixed(2)}%`}
              />
            </div>
          )}

          {/* Warmup Progress */}
          {account.warmupProgress !== undefined && account.warmupProgress < 100 && (
            <div className="bg-newBgLineColor rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">Warmup Progress</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-newBgColorInner rounded-full overflow-hidden">
                  <div
                    className="h-full bg-btnPrimary rounded-full transition-all"
                    style={{ width: `${account.warmupProgress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{account.warmupProgress}%</span>
              </div>
              <p className="text-xs text-textItemBlur mt-2">
                Account is being warmed up to avoid detection. Full activity will be enabled at 100%.
              </p>
            </div>
          )}

          {/* Activity */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
            {account.lastActivityAt ? (
              <p className="text-sm text-textItemBlur">
                Last activity: {new Date(account.lastActivityAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-sm text-textItemBlur">No activity recorded yet</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Settings */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Account Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Status</label>
                <select
                  value={account.status}
                  onChange={(e) => handleStatusChange(e.target.value as AccountStatus)}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="warming">Warming</option>
                  <option value="suspended">Suspended</option>
                  <option value="needs_verification">Needs Verification</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-textItemBlur mb-1">Purpose</label>
                <select
                  value={account.purpose}
                  onChange={(e) => handlePurposeChange(e.target.value as AccountPurpose)}
                  className="w-full px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
                >
                  <option value="content">Content Creation</option>
                  <option value="engagement">Engagement</option>
                  <option value="amplification">Amplification</option>
                  <option value="monitoring">Monitoring</option>
                </select>
              </div>
            </div>
          </div>

          {/* Proxy */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Assigned Proxy</h3>
            {account.proxy ? (
              <div className="p-3 bg-newBgColorInner rounded-lg">
                <p className="font-medium">{account.proxy.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <ProxyTypeBadge type={account.proxy.type} size="sm" />
                  <span className="text-xs text-textItemBlur">
                    {account.proxy.country || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={account.proxy.status} size="sm" />
                  {account.proxy.latency && (
                    <span className="text-xs text-textItemBlur">{account.proxy.latency}ms</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-textItemBlur">No proxy assigned</p>
            )}
          </div>

          {/* Integration Link */}
          <AccountIntegrationLink account={account} onUpdate={mutate} />

          {/* Quick Actions */}
          <div className="bg-newBgLineColor rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {account.profileUrl && (
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full p-2 text-left text-sm bg-newBgColorInner rounded-lg hover:bg-newBgColorInner/80 transition-colors"
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View Profile
                </a>
              )}
              <Link
                href={`/launches?accountId=${accountId}`}
                className="flex items-center gap-2 w-full p-2 text-left text-sm bg-newBgColorInner rounded-lg hover:bg-newBgColorInner/80 transition-colors"
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
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Schedule Content
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-newBgLineColor rounded-lg p-3">
    <p className="text-xl font-semibold">{value}</p>
    <p className="text-xs text-textItemBlur mt-0.5">{label}</p>
  </div>
);

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
