import { Metadata } from 'next';
import { PlatformAnalytics } from '@gitroom/frontend/components/platform-analytics/platform.analytics';
export const metadata: Metadata = {
  title: `AXON Analytics`,
  description: '',
};
export default function Index() {
  return <PlatformAnalytics />;
}
