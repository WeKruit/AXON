'use client';

import { FC, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';

interface NavItem {
  label: string;
  href: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: 'Matrix',
    href: '/axon/matrix',
    description: 'Soul-Channel connections',
  },
  {
    label: 'Souls',
    href: '/axon/souls',
    description: 'Identity containers',
  },
  {
    label: 'Personas',
    href: '/axon/personas',
    description: 'AI personalities',
  },
  {
    label: 'Proxies',
    href: '/axon/proxies',
    description: 'IP management',
  },
];

export const AxonNav: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Prefetch all AXON route bundles on mount so they're cached before user clicks
  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href);
    }
  }, [router]);

  const isActive = (href: string) => {
    if (href === '/axon/matrix') {
      return pathname === '/axon' || pathname === '/axon/matrix' || pathname.startsWith('/axon/matrix/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      // Skip if already on this route
      if (isActive(href)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router]
  );

  return (
    <nav className="bg-newBgColor border-b border-newBgLineColor relative">
      <div className="px-6">
        <div className="flex items-center">
          {/* Navigation tabs */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={(e) => handleClick(e, item.href)}
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
      </div>

      {/* Transition progress bar */}
      {isPending && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-newBgLineColor overflow-hidden">
          <div className="h-full bg-btnPrimary w-full animate-pulse" />
        </div>
      )}
    </nav>
  );
};
