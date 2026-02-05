import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - AXON',
  description: 'Privacy Policy for AXON - How we collect, use, and protect your data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-primary text-primary">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last Updated: January 2026</p>

        <p className="mb-8">
          At AXON, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </p>

        <Section title="1. Information We Collect">
          <h3 className="font-semibold mb-2">Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Account information (name, email address)</li>
            <li>Profile information you choose to add</li>
            <li>Content you create and share on the platform</li>
            <li>Communications with us (support requests, feedback)</li>
          </ul>

          <h3 className="font-semibold mb-2">Information from TikTok</h3>
          <p className="mb-4">When you connect your TikTok account, we receive:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Your TikTok username and profile information</li>
            <li>Authorization tokens to post content on your behalf</li>
          </ul>

          <h3 className="font-semibold mb-2">Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device information (browser type, operating system)</li>
            <li>Usage data (pages visited, features used)</li>
            <li>IP address and general location</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p className="mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process your content posting requests to TikTok</li>
            <li>Send you service-related communications</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Analyze usage patterns to improve user experience</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
        </Section>

        <Section title="3. Information Sharing">
          <p className="mb-4">We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>TikTok:</strong> When you use TikTok integration features, we share necessary data to complete your requests</li>
            <li><strong>Service Providers:</strong> Third parties who help us operate our platform (hosting, analytics)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          </ul>
        </Section>

        <Section title="4. TikTok Data Usage">
          <p className="mb-4">Regarding TikTok integration:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We only access TikTok data necessary for the features you use</li>
            <li>We do not store your TikTok password</li>
            <li>You can disconnect your TikTok account at any time in Settings</li>
            <li>Upon disconnection, we revoke access tokens and stop accessing your TikTok data</li>
          </ul>
        </Section>

        <Section title="5. Data Security">
          <p>
            We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time. Some information may be retained as required by law or for legitimate business purposes.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p className="mb-4">Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Delete your personal information</li>
            <li>Export your data in a portable format</li>
            <li>Opt out of certain data processing</li>
          </ul>
        </Section>

        <Section title="8. Cookies and Tracking">
          <p>
            We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage. You can control cookies through your browser settings, though some features may not function properly without them.
          </p>
        </Section>

        <Section title="9. Children&apos;s Privacy">
          <p>
            AXON is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If we learn we have collected such information, we will delete it promptly.
          </p>
        </Section>

        <Section title="10. International Data Transfers">
          <p>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the platform. Your continued use after changes indicates acceptance of the updated policy.
          </p>
        </Section>

        <div className="mt-12 p-6 bg-gray-800/50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
          <p className="mb-4">If you have questions about this Privacy Policy or our data practices, please contact us:</p>
          <p><strong>Email:</strong> privacy@axon.com</p>
          <p className="mt-4 text-sm text-gray-400">
            For California residents: You may have additional rights under the CCPA. Contact us for more information.
          </p>
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
