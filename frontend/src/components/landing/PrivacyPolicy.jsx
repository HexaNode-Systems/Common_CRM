import { useSettings } from '../../context/SettingsContext.jsx';
import LegalPageLayout from './LegalPageLayout.jsx';
import LegalSection from './LegalSection.jsx';

export default function PrivacyPolicy() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Common CRM';

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={new Date().toLocaleDateString()}>
      <LegalSection number="1" title="Information We Collect">
        {brandName} collects account information (name, email, phone), usage data, and any content
        you upload while using the platform, such as leads, orders, and documents.
      </LegalSection>

      <LegalSection number="2" title="How We Use Your Data">
        We use collected data to operate and improve the service, provide customer support,
        send transactional notifications, and maintain platform security.
      </LegalSection>

      <LegalSection number="3" title="Data Sharing">
        We do not sell your personal data. Data may be shared with trusted service providers
        (e.g. hosting, payment, communication) strictly to operate the platform.
      </LegalSection>

      <LegalSection number="4" title="Data Security">
        We use industry-standard measures including encryption and access controls to protect
        your data from unauthorized access.
      </LegalSection>

      <LegalSection number="5" title="Contact Us">
        For privacy-related queries, please reach out via the Contact page.
      </LegalSection>
    </LegalPageLayout>
  );
}