import { LaunchesComponent } from '@gitroom/frontend/components/launches/launches.component';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'AXON Calendar',
  description: '',
};
export default function Index() {
  return <LaunchesComponent />;
}
