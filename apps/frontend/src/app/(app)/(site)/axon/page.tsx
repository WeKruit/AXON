import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'AXON',
  description: 'AXON Identity Management',
};

export default function AxonPage() {
  // Matrix is the primary workspace - redirect to it by default
  redirect('/axon/matrix');
}
