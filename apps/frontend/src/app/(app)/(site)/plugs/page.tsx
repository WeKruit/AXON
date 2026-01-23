import { Plugs } from '@gitroom/frontend/components/plugs/plugs';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';
export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'Postiz' : 'Gitroom'} Plugs`,
  description: '',
};
export default function Index() {
  return <Plugs />;
}
