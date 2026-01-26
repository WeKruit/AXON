import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Postiz - AXON',
  description: 'AXON Identity Management',
};

export default function AxonPage() {
  redirect('/axon/souls');
}
