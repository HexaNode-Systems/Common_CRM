// frontend/src/components/landing/DataDeletionRequest.jsx
import { useSettings } from '../../context/SettingsContext.jsx';
import LegalPageLayout from './LegalPageLayout.jsx';
import LegalSection from './LegalSection.jsx';
import { Mail, Phone } from 'lucide-react';

export default function DataDeletionRequest() {
  const { settings } = useSettings();
  const brandName = settings?.brand?.name || 'Common CRM';
  const supportEmail = settings?.contact?.email || 'support@example.com';
  const supportPhone = settings?.contact?.phone || '';

  return (
    <LegalPageLayout title="Data Deletion Request" lastUpdated={new Date().toLocaleDateString()}>
      <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
        You can request permanent deletion of your account, CRM records, and associated data
        stored on {brandName}. This page explains what data is eligible for deletion and how
        to request it.
      </p>

      <LegalSection number="1" title="Data Eligible for Deletion">
        Upon a verified request, we delete your account and user profile details, CRM contacts
        and lists, connected channel credentials (e.g. WhatsApp/API tokens), and workflow or
        message logs stored in {brandName} systems.
      </LegalSection>

      <LegalSection number="2" title="How to Submit a Request">
        Send an email to <span className="text-slate-200">{supportEmail}</span> from your
        registered account email, with the subject "Data Deletion Request", including your
        workspace name and the scope of your request (full account or specific data).
      </LegalSection>

      <LegalSection number="3" title="Processing Steps">
        We verify your ownership of the account, disconnect stored channel credentials, remove
        contacts and records from our primary databases, and send a confirmation email once
        the process is complete.
      </LegalSection>

      <LegalSection number="4" title="Processing Timeline">
        Deletion requests are processed within a reasonable period, typically within 30 days
        of a verified request.
      </LegalSection>

      <LegalSection number="5" title="Legal Retention">
        Some records, such as tax invoices and payment transactions, may be retained for the
        period required under applicable financial or legal obligations, even after an account
        deletion request.
      </LegalSection>

      <LegalSection number="6" title="Third-Party Platform Boundaries">
        We can only delete data stored within {brandName}'s own systems. Data held independently
        by third-party providers (e.g. WhatsApp/Meta) may require a separate request directly
        through that provider's settings.
      </LegalSection>

      {/* Contact block */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white sm:text-lg">Need Help?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[15px]">
          If you need assistance submitting a data deletion request, reach out to our team:
        </p>
        <div className="mt-4 space-y-2">
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
          >
            <Mail className="h-4 w-4 text-slate-500" />
            {supportEmail}
          </a>
          {supportPhone && (
            <a
              href={`tel:${supportPhone}`}
              className="flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4 text-slate-500" />
              {supportPhone}
            </a>
          )}
        </div>
      </section>
    </LegalPageLayout>
  );
}