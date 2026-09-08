import { useSettings } from '../../context/SettingsContext.jsx';
import LegalPageLayout from './LegalPageLayout.jsx';
import LegalSection from './LegalSection.jsx';

export default function TermsAndConditions() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Common CRM';

  return (
    <LegalPageLayout title="Terms and Conditions" lastUpdated={new Date().toLocaleDateString()}>
      <LegalSection number="1" title="Acceptance of Terms">
        By accessing or using {brandName}, you agree to be bound by these Terms and Conditions.
      </LegalSection>

      <LegalSection number="2" title="Use of Service">
        You agree to use the platform only for lawful business purposes and not to misuse,
        reverse-engineer, or disrupt the service.
      </LegalSection>

      <LegalSection number="3" title="Account Responsibility">
        You are responsible for maintaining the confidentiality of your login credentials and
        all activity under your account.
      </LegalSection>

      <LegalSection number="4" title="Payments & Subscriptions">
        Applicable fees, billing cycles, and renewal terms are as communicated at the time of
        purchase or upgrade.
      </LegalSection>

      <LegalSection number="5" title="Limitation of Liability">
        {brandName} is provided "as is" without warranties of any kind. We are not liable for
        indirect or consequential damages arising from use of the platform.
      </LegalSection>

      <LegalSection number="6" title="Changes to Terms">
        We may update these terms periodically; continued use constitutes acceptance.
      </LegalSection>
    </LegalPageLayout>
  );
}