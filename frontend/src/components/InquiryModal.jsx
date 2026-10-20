import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useInquiry } from '../context/InquiryContext.jsx';
import Button from './Button.jsx';
import { X, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

const TEAM_SIZE_OPTIONS = [
  '1–5',
  '6–10',
  '11–25',
  '26–50',
  '51–100',
  '100+',
];

const REQUIREMENT_OPTIONS = [
  'WhatsApp CRM',
  'Lead Management',
  'Sales Pipeline',
  'CRM Setup',
  'Product Demo',
  'Enterprise Plan',
  'Other',
];

export default function InquiryModal() {
  const { pathname } = useLocation();
  const isProductPage = ['/lead-management', '/contact', '/whatsapp-crm', '/pricing'].includes(pathname);
  const { isOpen, ctaSource, closeInquiryModal } = useInquiry();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    teamSize: '1–5',
    requirement: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Focus management & prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';

    // Focus the first input after modal opens
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeInquiryModal();
      }
      if (isProductPage && e.key === 'Tab') {
        const controls = Array.from(modalRef.current?.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex="0"]') || []).filter(node => node.offsetParent !== null);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (isProductPage && previousFocus?.isConnected) {
        if (previousFocus.offsetParent !== null) previousFocus.focus();
        else document.querySelector('.mp-menu-toggle')?.focus();
      }
    };
  }, [isOpen, closeInquiryModal, isProductPage]);

  useEffect(() => {
    if (isProductPage && isOpen && submitStatus === 'success') {
      modalRef.current?.querySelector('[data-inquiry-success]')?.focus();
    }
  }, [isProductPage, isOpen, submitStatus]);

  // Reset form when reopened after success
  useEffect(() => {
    if (isOpen && submitStatus === 'success') {
      setSubmitStatus('idle');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        teamSize: '1–5',
        requirement: '',
        message: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  if (typeof window === 'undefined' || !isOpen) {
    return null;
  }

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Work Email is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    const digitsOnly = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      errs.phone = 'Phone Number is required.';
    } else if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      errs.phone = 'Please enter a valid phone number (7-15 digits).';
    }

    if (!formData.requirement.trim()) {
      errs.requirement = 'Please select what you need help with.';
    }

    setErrors(errs);
    if (isProductPage && Object.keys(errs).length) {
      document.getElementById(`inquiry-${Object.keys(errs)[0]}`)?.focus();
    }
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const payload = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      teamSize: formData.teamSize,
      requirement: formData.requirement,
      message: formData.message.trim(),
      source: ctaSource || 'general',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    };

    const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

    try {
      if (!scriptUrl) {
        // If not configured, simulate successful submission for development
        console.warn('VITE_GOOGLE_APPS_SCRIPT_URL is not set. Simulating successful submission.');
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSubmitStatus('success');
      } else {
        // Send using text/plain to prevent preflight OPTIONS issues with Google Apps Script
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        setSubmitStatus('success');
      }
    } catch (err) {
      console.error('Enquiry submission error:', err);
      setSubmitStatus('error');
      setErrorMessage('Something went wrong. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 sm:p-6 backdrop-blur-xs transition-opacity duration-200 ${isProductPage ? 'crm-inquiry-modal' : ''}`}
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          closeInquiryModal();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        aria-describedby="inquiry-modal-subtitle"
        className="relative my-auto w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white shadow-2xl transition-all duration-200 max-h-[90vh] flex flex-col font-theme"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {/* <Sparkles className="h-3 w-3" /> */}
              <span>Connect With Us</span>
            </div>
            <h2 id="inquiry-modal-title" className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
              Let's talk about your CRM needs
            </h2>
            <p id="inquiry-modal-subtitle" className="mt-1 text-xs sm:text-sm text-slate-500">
              Tell us a little about your requirement and our team will get in touch.
            </p>
          </div>
          <button
            type="button"
            onClick={closeInquiryModal}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 pt-4 flex-1">
          {submitStatus === 'success' ? (
            <div className="py-8 text-center" role="status" tabIndex={-1} data-inquiry-success>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Enquiry Received</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thanks! Your enquiry has been received. Our team will contact you shortly.
              </p>
              <div className="mt-6 flex justify-center">
                <Button onClick={closeInquiryModal} className="px-6 py-2.5 text-sm">
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={isSubmitting}>
              {isProductPage && <p className="text-xs text-slate-500">Fields marked * are required.</p>}
              {isProductPage && Object.values(errors).some(Boolean) && <p role="alert" className="text-xs text-rose-700">Please check the highlighted fields.</p>}
              {submitStatus === 'error' && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">{errorMessage}</p>
                    <p className="mt-1">
                      Fallback email:{' '}
                      <a href="mailto:support@appnix.info" className="underline font-bold">
                        support@appnix.info
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label htmlFor="inquiry-name" className="block text-xs font-semibold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="inquiry-name"
                  name="name"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'inquiry-name-error' : undefined}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full rounded-xl border bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                  }`}
                />
                {errors.name && <p id="inquiry-name-error" className="text-[11px] text-rose-600 font-medium">{errors.name}</p>}
              </div>

              {/* Work Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="inquiry-email" className="block text-xs font-semibold text-slate-700">
                    Work Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="inquiry-email"
                    name="email"
                    autoComplete="email"
                    required
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'inquiry-email-error' : undefined}
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full rounded-xl border bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  {errors.email && <p id="inquiry-email-error" className="text-[11px] text-rose-600 font-medium">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label htmlFor="inquiry-phone" className="block text-xs font-semibold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="inquiry-phone"
                    name="phone"
                    autoComplete="tel"
                    required
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'inquiry-phone-error' : undefined}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full rounded-xl border bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  {errors.phone && <p id="inquiry-phone-error" className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>}
                </div>
              </div>

              {/* Company & Team Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="inquiry-company" className="block text-xs font-semibold text-slate-700">
                    Company / Business Name
                  </label>
                  <input
                    type="text"
                    id="inquiry-company"
                    name="company"
                    autoComplete="organization"
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="inquiry-team-size" className="block text-xs font-semibold text-slate-700">
                    Team Size
                  </label>
                  <select
                    id="inquiry-team-size"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={(e) => handleChange('teamSize', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {TEAM_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} users
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requirement */}
              <div className="space-y-1">
                <label htmlFor="inquiry-requirement" className="block text-xs font-semibold text-slate-700">
                  What do you need help with? <span className="text-rose-500">*</span>
                </label>
                <select
                  id="inquiry-requirement"
                  name="requirement"
                  required
                  aria-invalid={Boolean(errors.requirement)}
                  aria-describedby={errors.requirement ? 'inquiry-requirement-error' : undefined}
                  value={formData.requirement}
                  onChange={(e) => handleChange('requirement', e.target.value)}
                  className={`w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.requirement
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                  }`}
                >
                  <option value="">Select your requirement...</option>
                  {REQUIREMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.requirement && (
                  <p id="inquiry-requirement-error" className="text-[11px] text-rose-600 font-medium">{errors.requirement}</p>
                )}
              </div>

              {/* Additional Message */}
              <div className="space-y-1">
                <label htmlFor="inquiry-message" className="block text-xs font-semibold text-slate-700">
                  Additional Message
                </label>
                <textarea
                  id="inquiry-message"
                  name="message"
                  rows={3}
                  placeholder="Tell us about your team's workflow, challenges, or specific needs..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeInquiryModal}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Close
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs sm:text-sm shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Enquiry</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
