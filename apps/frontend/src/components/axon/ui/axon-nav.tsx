'use client';

import { FC, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { usePreloadFunctions } from '../hooks';

interface NavItem {
  label: string;
  href: string;
  description: string;
  preloadKey: 'souls' | 'accounts' | 'personas' | 'proxies' | 'matrix';
}

const navItems: NavItem[] = [
  {
    label: 'Souls',
    href: '/axon/souls',
    description: 'Identity containers',
    preloadKey: 'souls',
  },
  {
    label: 'Matrix',
    href: '/axon/matrix',
    description: 'Soul-Channel connections',
    preloadKey: 'matrix',
  },
  {
    label: 'Accounts',
    href: '/axon/accounts',
    description: 'Social accounts',
    preloadKey: 'accounts',
  },
  {
    label: 'Personas',
    href: '/axon/personas',
    description: 'AI personalities',
    preloadKey: 'personas',
  },
  {
    label: 'Proxies',
    href: '/axon/proxies',
    description: 'IP management',
    preloadKey: 'proxies',
  },
];

/**
 * Navigation component with tab prefetching
 * Preloads data on hover/focus for instant tab switching (WEC-183)
 * Based on bundle-preload best practice
 */
export const AxonNav: FC = () => {
  const pathname = usePathname();
  const {
    preloadSouls,
    preloadAccounts,
    preloadPersonas,
    preloadProxies,
    preloadIntegrations,
    preloadMatrixMappings,
  } = usePreloadFunctions();

  // Track which tabs have been preloaded to avoid redundant calls
  const preloadedRef = useRef<Set<string>>(new Set());

  const isActive = (href: string) => {
    if (href === '/axon/souls') {
      return pathname === '/axon' || pathname === '/axon/souls' || pathname.startsWith('/axon/souls/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handlePreload = useCallback((item: NavItem) => {
    // Skip if already preloaded or currently active
    if (preloadedRef.current.has(item.preloadKey) || isActive(item.href)) {
      return;
    }

    // Mark as preloaded
    preloadedRef.current.add(item.preloadKey);

    // Trigger preload based on tab
    switch (item.preloadKey) {
      case 'souls':
        preloadSouls();
        break;
      case 'accounts':
        preloadAccounts();
        break;
      case 'personas':
        preloadPersonas();
        break;
      case 'proxies':
        preloadProxies();
        break;
      case 'matrix':
        // Matrix needs souls, integrations, and mappings
        preloadSouls();
        preloadIntegrations();
        preloadMatrixMappings();
        break;
    }
  }, [pathname, preloadSouls, preloadAccounts, preloadPersonas, preloadProxies, preloadIntegrations, preloadMatrixMappings]);

  return (
    <nav className="bg-newBgColor border-b border-newBgLineColor">
      <div className="px-6">
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => handlePreload(item)}
              onFocus={() => handlePreload(item)}
              className={clsx(
                'px-4 py-3 text-[14px] font-medium border-b-2 transition-colors',
                isActive(item.href)
                  ? 'border-btnPrimary text-btnPrimary'
                  : 'border-transparent text-textItemBlur hover:text-newTextColor hover:border-newBgLineColor'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
