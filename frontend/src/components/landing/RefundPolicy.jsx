import { useSettings } from '../../context/SettingsContext.jsx';
import LegalPageLayout from './LegalPageLayout.jsx';
import LegalSection from './LegalSection.jsx';

export default function RefundPolicy() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Common CRM';

  return (
    <LegalPageLayout title="Refund Policy" lastUpdated={new Date().toLocaleDateString()}>
      <LegalSection number="1" title="Eligibility">
        Refund requests for {brandName} subscriptions are considered within 7 days of purchase,
        provided the account shows minimal usage.
      </LegalSection>

      <LegalSection number="2" title="Non-Refundable Items">
        Setup fees, custom integrations, and add-on services already delivered are non-refundable.
      </LegalSection>

      <LegalSection number="3" title="How to Request">
        Contact our support team with your account email and order/invoice ID to initiate a refund.
      </LegalSection>

      <LegalSection number="4" title="Processing Time">
        Approved refunds are processed within 5–7 business days to the original payment method.
      </LegalSection>
    </LegalPageLayout>
  );
}