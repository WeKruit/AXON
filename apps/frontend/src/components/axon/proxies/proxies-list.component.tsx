'use client';

import { FC, useCallback, useState, useMemo } from 'react';
import { useProxyMutations } from '../hooks/use-axon-api';
import { useAxonData, useAxonScrollPreservation } from '../context/axon-data-provider';
import { StatusBadge } from '../ui/status-badge';
import { ProxyTypeBadge } from '../ui/purpose-badge';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import type { Proxy, ProxyType, ProxyStatus, CreateProxyDto, AccountPurpose } from '../types';
import { DEFAULT_PROXY_PURPOSE_MATRIX } from '../types';
import { AddProxyModal } from './add-proxy-modal';

/**
 * ProxiesListComponent (WEC-190, WEC-193)
 *
 * Updated to use AxonDataProvider for:
 * 1. Pre-fetched data from layout level (no loading flash on tab switch)
 * 2. Preserved filter state across tab navigation
 * 3. Preserved scroll position when returning to this tab
 */
export const ProxiesListComponent: FC = () => {
  // Get data and filter state from AxonDataProvider context
  const {
    proxies: data,
    isLoadingProxies: isLoading,
    proxiesError: error,
    mutateProxies: mutate,
    filters: contextFilters,
    setProxiesFilters,
  } = useAxonData();

  const { createProxy, deleteProxy, testProxy, rotateProxy } = useProxyMutations();
  const toaster = useToaster();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testingProxyId, setTestingProxyId] = useState<string | null>(null);

  // Use filter state from context instead of local useState
  const filterType = (contextFilters.proxies.type as ProxyType | 'all' | undefined) || 'all';
  const filterStatus = (contextFilters.proxies.status as ProxyStatus | 'all' | undefined) || 'all';

  // Scroll preservation hook
  const { containerRef, handleScroll } = useAxonScrollPreservation('proxies');

  const filteredProxies = useMemo(() => {
    if (!data) return [];
    return data.filter((proxy) => {
      if (filterType !== 'all' && proxy.type !== filterType) return false;
      if (filterStatus !== 'all' && proxy.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterType, filterStatus]);

  const proxyStats = useMemo(() => {
    if (!data) return null;
    return {
      total: data.length,
      active: data.filter((p) => p.status === 'active').length,
      residential: data.filter((p) => p.type === 'residential').length,
      datacenter: data.filter((p) => p.type === 'datacenter').length,
      mobile: data.filter((p) => p.type === 'mobile').length,
      isp: data.filter((p) => p.type === 'isp').length,
      avgLatency: Math.round(
        data.filter((p) => p.latency).reduce((acc, p) => acc + (p.latency || 0), 0) /
          (data.filter((p) => p.latency).length || 1)
      ),
      avgSuccessRate:
        data.filter((p) => p.successRate).reduce((acc, p) => acc + (p.successRate || 0), 0) /
        (data.filter((p) => p.successRate).length || 1),
    };
  }, [data]);

  const handleAddProxy = useCallback(
    async (proxyData: CreateProxyDto) => {
      try {
        await createProxy(proxyData);
        await mutate();
        setIsAddModalOpen(false);
        toaster.show('Proxy added successfully', 'success');
      } catch (error) {
        toaster.show('Failed to add proxy', 'warning');
      }
    },
    [createProxy, mutate, toaster]
  );

  const handleDeleteProxy = useCallback(
    async (proxy: Proxy) => {
      const confirmed = await deleteDialog(
        `Are you sure you want to delete "${proxy.name}"?`,
        'Delete Proxy'
      );
      if (!confirmed) return;

      try {
        await deleteProxy(proxy.id);
        await mutate();
        toaster.show('Proxy deleted successfully', 'success');
      } catch (error) {
        toaster.show('Failed to delete proxy', 'warning');
      }
    },
    [deleteProxy, mutate, toaster]
  );

  const handleTestProxy = useCallback(
    async (proxy: Proxy) => {
      setTestingProxyId(proxy.id);
      try {
        const result = await testProxy(proxy.id);
        await mutate();
        if (result.success) {
          toaster.show(`Proxy test successful - Latency: ${result.latency}ms`, 'success');
        } else {
          toaster.show(`Proxy test failed: ${result.error}`, 'warning');
        }
      } catch (error) {
        toaster.show('Failed to test proxy', 'warning');
      } finally {
        setTestingProxyId(null);
      }
    },
    [testProxy, mutate, toaster]
  );

  const handleRotateProxy = useCallback(
    async (proxy: Proxy) => {
      try {
        await rotateProxy(proxy.id);
        await mutate();
        toaster.show('Proxy rotated successfully', 'success');
      } catch (error) {
        toaster.show('Failed to rotate proxy', 'warning');
      }
    },
    [rotateProxy, mutate, toaster]
  );

  const handleFilterTypeChange = useCallback(
    (value: ProxyType | 'all') => {
      setProxiesFilters({
        ...contextFilters.proxies,
        type: value === 'all' ? undefined : value,
      });
    },
    [contextFilters.proxies, setProxiesFilters]
  );

  const handleFilterStatusChange = useCallback(
    (value: ProxyStatus | 'all') => {
      setProxiesFilters({
        ...contextFilters.proxies,
        status: value === 'all' ? undefined : value,
      });
    },
    [contextFilters.proxies, setProxiesFilters]
  );

  if (isLoading) {
    return (
      <div className="flex-1 bg-newBgColorInner p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 bg-newBgLineColor rounded animate-pulse" />
          <div className="h-10 w-32 bg-newBgLineColor rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-newBgLineColor rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-newBgLineColor rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 bg-newBgColorInner p-6 overflow-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Proxy Pool</h1>
          <p className="text-sm text-textItemBlur mt-1">
            Manage your proxy infrastructure for safe account operations
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-btnPrimary text-white rounded-lg hover:bg-btnPrimary/90 transition-colors"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Proxy
        </button>
      </div>

      {/* Stats */}
      {proxyStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <StatCard label="Total Proxies" value={proxyStats.total} />
          <StatCard label="Active" value={proxyStats.active} color="green" />
          <StatCard label="Residential" value={proxyStats.residential} />
          <StatCard label="Datacenter" value={proxyStats.datacenter} />
          <StatCard label="Mobile" value={proxyStats.mobile} />
          <StatCard label="Avg Latency" value={`${proxyStats.avgLatency}ms`} />
          <StatCard
            label="Success Rate"
            value={`${proxyStats.avgSuccessRate.toFixed(1)}%`}
            color={proxyStats.avgSuccessRate >= 90 ? 'green' : 'yellow'}
          />
        </div>
      )}

      {/* Purpose Matrix */}
      <div className="bg-newBgLineColor rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium mb-4">Proxy Purpose Matrix</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(DEFAULT_PROXY_PURPOSE_MATRIX) as AccountPurpose[]).map((purpose) => (
            <div key={purpose} className="p-3 bg-newBgColorInner rounded-lg">
              <p className="text-xs text-textItemBlur mb-1 capitalize">{purpose}</p>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_PROXY_PURPOSE_MATRIX[purpose].map((type) => (
                  <ProxyTypeBadge key={type} type={type} size="sm" />
                ))}
              </div>
              <p className="text-xs text-textItemBlur mt-2">
                {
                  data?.filter(
                    (p) =>
                      DEFAULT_PROXY_PURPOSE_MATRIX[purpose].includes(p.type) &&
                      p.status === 'active'
                  ).length
                }{' '}
                available
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterType}
          onChange={(e) => handleFilterTypeChange(e.target.value as ProxyType | 'all')}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
        >
          <option value="all">All Types</option>
          <option value="residential">Residential</option>
          <option value="datacenter">Datacenter</option>
          <option value="mobile">Mobile</option>
          <option value="isp">ISP</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => handleFilterStatusChange(e.target.value as ProxyStatus | 'all')}
          className="px-3 py-2 bg-newBgColorInner text-newTextColor rounded-[8px] border border-newTableBorder focus:border-btnPrimary focus:outline-none text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="rotating">Rotating</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Proxy List */}
      {filteredProxies.length === 0 ? (
        <div className="text-center py-16 text-textItemBlur">
          {data?.length === 0 ? (
            <>
              <p className="mb-2">No proxies configured</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-btnPrimary hover:underline"
              >
                Add your first proxy
              </button>
            </>
          ) : (
            <p>No proxies match your filters</p>
          )}
        </div>
      ) : (
        <div className="bg-newBgLineColor rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-newBgColorInner">
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Proxy</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Location</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Latency</th>
                <th className="text-left text-xs font-medium text-textItemBlur px-4 py-3">Success Rate</th>
                <th className="text-right text-xs font-medium text-textItemBlur px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProxies.map((proxy) => (
                <tr key={proxy.id} className="border-b border-newBgColorInner last:border-0 group">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{proxy.name}</p>
                      <p className="text-xs text-textItemBlur">
                        {proxy.host}:{proxy.port}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ProxyTypeBadge type={proxy.type} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">
                      {proxy.country || 'Unknown'}
                      {proxy.city && `, ${proxy.city}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={proxy.status} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {proxy.latency ? (
                      <span
                        className={`text-sm ${
                          proxy.latency < 100
                            ? 'text-green-500'
                            : proxy.latency < 300
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {proxy.latency}ms
                      </span>
                    ) : (
                      <span className="text-sm text-textItemBlur">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {proxy.successRate !== undefined ? (
                      <span
                        className={`text-sm ${
                          proxy.successRate >= 95
                            ? 'text-green-500'
                            : proxy.successRate >= 80
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {proxy.successRate.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-sm text-textItemBlur">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleTestProxy(proxy)}
                        disabled={testingProxyId === proxy.id}
                        className="p-1.5 text-textItemBlur hover:text-newTextColor transition-colors disabled:opacity-50"
                        title="Test proxy"
                      >
                        {testingProxyId === proxy.id ? (
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                          </svg>
                        )}
                      </button>
                      {proxy.rotationInterval && (
                        <button
                          onClick={() => handleRotateProxy(proxy)}
                          className="p-1.5 text-textItemBlur hover:text-newTextColor transition-colors"
                          title="Rotate proxy"
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
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProxy(proxy)}
                        className="p-1.5 text-textItemBlur hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete proxy"
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

      {isAddModalOpen && (
        <AddProxyModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddProxy}
        />
      )}
    </div>
  );
};

const StatCard: FC<{ label: string; value: string | number; color?: 'green' | 'yellow' | 'red' }> = ({
  label,
  value,
  color,
}) => (
  <div className="bg-newBgLineColor rounded-lg p-3">
    <p
      className={`text-xl font-semibold ${
        color === 'green'
          ? 'text-green-500'
          : color === 'yellow'
          ? 'text-yellow-500'
          : color === 'red'
          ? 'text-red-500'
          : ''
      }`}
    >
      {value}
    </p>
    <p className="text-xs text-textItemBlur mt-0.5">{label}</p>
  </div>
);
