'use client';

import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const isActive = (href: string) => {
    if (href === '/axon/matrix') {
      return pathname === '/axon' || pathname === '/axon/matrix' || pathname.startsWith('/axon/matrix/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="bg-newBgColor border-b border-newBgLineColor">
      <div className="px-6">
        <div className="flex items-center">
          {/* Navigation tabs */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
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
    </nav>
  );
};
