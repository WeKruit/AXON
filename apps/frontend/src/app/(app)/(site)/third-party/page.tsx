import { ThirdPartyComponent } from '@gitroom/frontend/components/third-parties/third-party.component';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'AXON Integrations',
  description: '',
};
export default function Index() {
  return <ThirdPartyComponent />;
}
