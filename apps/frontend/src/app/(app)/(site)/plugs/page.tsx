import { Plugs } from '@gitroom/frontend/components/plugs/plugs';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: `AXON Plugs`,
  description: '',
};
export default function Index() {
  return <Plugs />;
}
