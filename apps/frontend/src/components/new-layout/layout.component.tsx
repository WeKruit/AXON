'use client';

import React, { ReactNode, useCallback } from 'react';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
import { Plus_Jakarta_Sans } from 'next/font/google';
const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useSearchParams } from 'next/navigation';
import useSWR, { SWRConfig } from 'swr';
import { globalSwrConfig } from '@gitroom/frontend/lib/swr-config';
import { CheckPayment } from '@gitroom/frontend/components/layout/check.payment';
import { ToolTip } from '@gitroom/frontend/components/layout/top.tip';
import { ShowMediaBoxModal } from '@gitroom/frontend/components/media/media.component';
import { ShowLinkedinCompany } from '@gitroom/frontend/components/launches/helpers/linkedin.component';
import { MediaSettingsLayout } from '@gitroom/frontend/components/launches/helpers/media.settings.component';
import { Toaster } from '@gitroom/react/toaster/toaster';
import { ShowPostSelector } from '@gitroom/frontend/components/post-url-selector/post.url.selector';
import { NewSubscription } from '@gitroom/frontend/components/layout/new.subscription';
import { Support } from '@gitroom/frontend/components/layout/support';
import { ContinueProvider } from '@gitroom/frontend/components/layout/continue.provider';
import { ContextWrapper } from '@gitroom/frontend/components/layout/user.context';
import { CopilotKit } from '@copilotkit/react-core';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Impersonate } from '@gitroom/frontend/components/layout/impersonate';
import { Title } from '@gitroom/frontend/components/layout/title';
import { TopMenu } from '@gitroom/frontend/components/layout/top.menu';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { ChromeExtensionComponent } from '@gitroom/frontend/components/layout/chrome.extension.component';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { PreConditionComponent } from '@gitroom/frontend/components/layout/pre-condition.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { FirstBillingComponent } from '@gitroom/frontend/components/billing/first.billing.component';
import { SoulContextProvider } from '@gitroom/frontend/components/axon/context/soul-context';

// Lazy load GlobalSoulSwitcher to avoid fetching souls data on initial render
const GlobalSoulSwitcher = dynamic(
  () => import('@gitroom/frontend/components/axon/ui/global-soul-switcher').then(m => ({ default: m.GlobalSoulSwitcher })),
  { ssr: false }
);

// Lazy load NotificationComponent to reduce initial bundle
const LazyNotificationComponent = dynamic(
  () => import('@gitroom/frontend/components/notifications/notification.component'),
  { ssr: false }
);

const jakartaSans = Plus_Jakarta_Sans({
  weight: ['600', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

// Global loading skeleton component
const LayoutSkeleton = () => (
  <div
    className={clsx(
      'flex flex-col min-h-screen min-w-screen text-newTextColor p-[12px]',
      jakartaSans.className
    )}
  >
    <div className="flex-1 flex gap-[8px]">
      {/* Sidebar skeleton */}
      <div className="flex flex-col bg-newBgColorInner w-[80px] rounded-[12px]">
        <div className="fixed h-full w-[64px] start-[17px] flex flex-1 top-0">
          <div className="flex flex-col h-full gap-[32px] flex-1 py-[12px]">
            {/* Logo placeholder */}
            <div className="h-[40px] w-[40px] bg-newBgLineColor rounded-lg animate-pulse mx-auto" />
            {/* Menu items placeholder */}
            <div className="flex flex-col gap-[16px] px-[8px]">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-[40px] w-[40px] bg-newBgLineColor rounded-lg animate-pulse mx-auto"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 bg-newBgLineColor rounded-[12px] overflow-hidden flex flex-col gap-[1px]">
        {/* Header skeleton */}
        <div className="flex bg-newBgColorInner h-[80px] px-[20px] items-center">
          <div className="h-[28px] w-[200px] bg-newBgLineColor rounded animate-pulse" />
          <div className="flex-1" />
          <div className="flex gap-[20px]">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[24px] w-[24px] bg-newBgLineColor rounded animate-pulse"
              />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex flex-1 gap-[1px] bg-newBgColorInner p-[20px]">
          <div className="flex flex-col gap-[16px] w-full">
            <div className="h-[120px] bg-newBgLineColor rounded-lg animate-pulse" />
            <div className="h-[200px] bg-newBgLineColor rounded-lg animate-pulse" />
            <div className="h-[160px] bg-newBgLineColor rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const LayoutComponent = ({ children }: { children: ReactNode }) => {
  const fetch = useFetch();

  const { backendUrl, billingEnabled, isGeneral } = useVariables();

  // Feedback icon component attaches Sentry feedback to a top-bar icon when DSN is present
  const searchParams = useSearchParams();
  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, []);
  const { data: user, mutate, isLoading } = useSWR('/user/self', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  // Show skeleton while loading instead of blocking render
  if (isLoading || !user) return <LayoutSkeleton />;

  return (
    <SWRConfig value={globalSwrConfig}>
    <SoulContextProvider>
    <ContextWrapper user={user}>
      <CopilotKit
        credentials="include"
        runtimeUrl={backendUrl + '/copilot/chat'}
        showDevConsole={false}
      >
        <MantineWrapper>
          <ToolTip />
          <Toaster />
          <CheckPayment check={searchParams.get('check') || ''} mutate={mutate}>
            <ShowMediaBoxModal />
            <ShowLinkedinCompany />
            <MediaSettingsLayout />
            <ShowPostSelector />
            <PreConditionComponent />
            <NewSubscription />
            <ContinueProvider />
            <div
              className={clsx(
                'flex flex-col min-h-screen min-w-screen text-newTextColor p-[12px]',
                jakartaSans.className
              )}
            >
              <div>{user?.admin ? <Impersonate /> : <div />}</div>
              {user.tier === 'FREE' && isGeneral && billingEnabled ? (
                <FirstBillingComponent />
              ) : (
                <div className="flex-1 flex gap-[8px]">
                  <Support />
                  <div className="flex flex-col bg-newBgColorInner w-[80px] rounded-[12px]">
                    <div
                      className={clsx(
                        'fixed h-full w-[64px] start-[17px] flex flex-1 top-0',
                        user?.admin && 'pt-[60px] max-h-[1000px]:w-[500px]'
                      )}
                    >
                      <div className="flex flex-col h-full gap-[32px] flex-1 py-[12px]">
                        <Logo />
                        <TopMenu />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-newBgLineColor rounded-[12px] overflow-hidden flex flex-col gap-[1px] blurMe">
                    <div className="flex bg-newBgColorInner h-[80px] px-[20px] items-center">
                      <div className="text-[24px] font-[600] flex flex-1">
                        <Title />
                      </div>
                      <div className="flex gap-[20px] text-textItemBlur">
                        <OrganizationSelector />
                        <GlobalSoulSwitcher />
                        <div className="hover:text-newTextColor">
                          <ModeComponent />
                        </div>
                        <div className="w-[1px] h-[20px] bg-blockSeparator" />
                        <LanguageComponent />
                        <ChromeExtensionComponent />
                        <div className="w-[1px] h-[20px] bg-blockSeparator" />
                        <AttachToFeedbackIcon />
                        <LazyNotificationComponent />
                      </div>
                    </div>
                    <div className="flex flex-1 gap-[1px]">{children}</div>
                  </div>
                </div>
              )}
            </div>
          </CheckPayment>
        </MantineWrapper>
      </CopilotKit>
    </ContextWrapper>
    </SoulContextProvider>
    </SWRConfig>
  );
};
