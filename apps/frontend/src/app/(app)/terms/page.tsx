import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - AXON',
  description: 'Terms of Service for AXON - Marketing knowledge-sharing platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-primary text-primary">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last Updated: January 2026</p>

        <p className="mb-8">
          Welcome to AXON. By accessing or using our platform, you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them carefully.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By creating an account or using AXON, you agree to these Terms and our Privacy Policy. If you do not agree, please do not use our services.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p className="mb-4">AXON is a marketing knowledge-sharing platform that enables users to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and share marketing insights and tips</li>
            <li>Connect their TikTok account via TikTok Login Kit</li>
            <li>Publish content directly to TikTok via the Content Posting API</li>
            <li>Learn from marketing professionals and grow their audience</li>
          </ul>
        </Section>

        <Section title="3. Account Registration">
          <p className="mb-4">To use certain features, you must create an account. You agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Be responsible for all activities under your account</li>
          </ul>
        </Section>

        <Section title="4. TikTok Integration">
          <p className="mb-4">When you connect your TikTok account to AXON:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You authorize us to access your TikTok profile information</li>
            <li>You authorize us to post content to TikTok on your behalf when you explicitly request it</li>
            <li>You remain responsible for all content posted to TikTok through our platform</li>
            <li>You agree to comply with TikTok&apos;s Terms of Service and Community Guidelines</li>
          </ul>
        </Section>

        <Section title="5. User Content">
          <p>
            You retain ownership of content you create. By posting content through AXON, you grant us a non-exclusive, worldwide license to display and distribute your content within our platform. You represent that you have the rights to all content you post.
          </p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p className="mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Post misleading, fraudulent, or deceptive content</li>
            <li>Infringe on intellectual property rights</li>
            <li>Harass, abuse, or harm others</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Use automated tools to access our service without permission</li>
          </ul>
        </Section>

        <Section title="7. Termination">
          <p>
            We may suspend or terminate your account if you violate these Terms. You may also delete your account at any time. Upon termination, your right to use the service ceases immediately.
          </p>
        </Section>

        <Section title="8. Disclaimers">
          <p>
            AXON is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service. We are not responsible for content posted by users or third-party services.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, AXON shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our service.
          </p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>
            We may update these Terms from time to time. We will notify you of significant changes via email or through the platform. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p>
            These Terms are governed by the laws of the State of California. Any disputes shall be resolved in the courts of California.
          </p>
        </Section>

        <div className="mt-12 p-6 bg-gray-800/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
          <p className="mb-2">If you have questions about these Terms, please contact us:</p>
          <p><strong>Email:</strong> legal@axon.com</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}
