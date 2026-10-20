import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CheckCircle2, Mail, MessageCircle, Phone } from 'lucide-react';
import MarketingPage, { PageFAQs } from '../components/landing/MarketingPage.jsx';
import JsonLd from '../components/JsonLd.jsx';

const FAQS = [
  { question: 'What happens when I submit this form?', answer: 'The form opens WhatsApp with your name, email, phone number, team size, and message prefilled. Review the message in WhatsApp and send it to start the conversation with our team.' },
  { question: 'Can we request a product walkthrough?', answer: 'Yes. Tell us about your team and the workflows you want to explore. You can request a walkthrough using this form, or reach us directly by WhatsApp, phone, or email.' },
  { question: 'Can I review pricing first?', answer: 'Yes. The Pricing page lists the Starter, Growth, and Enterprise plans, along with user allowances and a detailed feature comparison.' },
];
const organizationSchema = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Appnix Technologies', url: 'https://www.appnix.info/', logo: 'https://www.appnix.info/logo-favicon.png', contactPoint: { '@type': 'ContactPoint', telephone: '+917753983175', contactType: 'customer service', email: 'support@appnix.info' } };

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', teamSize: '1-5', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [preparedUrl, setPreparedUrl] = useState('');
  const formRef = useRef(null);
  const successRef = useRef(null);

  function update(field, value) {
    setFormData(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: undefined }));
    setOpenError(false);
  }
  function handleFormSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Please enter your name.';
    if (!formData.email.trim()) nextErrors.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Please enter a valid email address.';
    const digits = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) nextErrors.phone = 'Please enter your phone number.';
    else if (digits.length < 7 || digits.length > 15) nextErrors.phone = 'Use a phone number with 7–15 digits.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus(); return; }
    // Preserve the existing WhatsApp destination and exact message payload.
    const text = `Hi Appnix Team, my name is ${formData.name}. Email: ${formData.email}, Phone: ${formData.phone}, Team Size: ${formData.teamSize}. Note: ${formData.message}`;
    const waUrl = `https://wa.me/917753983175?text=${encodeURIComponent(text)}`;
    setPreparedUrl(waUrl);
    try {
      const opened = window.open(waUrl, '_blank');
      if (!opened) { setOpenError(true); return; }
      setOpenError(false);
      setSubmitted(true);
      requestAnimationFrame(() => successRef.current?.focus());
    } catch { setOpenError(true); }
  }

  const field = (name, label, type, placeholder, autoComplete) => <div className="mp-field"><label htmlFor={`contact-${name}`}>{label} <span aria-hidden="true">*</span></label><input id={`contact-${name}`} name={name} type={type} autoComplete={autoComplete} required aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `contact-${name}-error` : undefined} placeholder={placeholder} value={formData[name]} onChange={event => update(name, event.target.value)} />{errors[name] && <p className="mp-field-error" id={`contact-${name}-error`}>{errors[name]}</p>}</div>;

  return <MarketingPage name="Contact" path="/contact" title="Contact Appnix CRM Pro | Sales & Support" description="Talk to the Appnix CRM Pro team about your requirements, pricing, or a product walkthrough. Connect by WhatsApp, phone, or email." faqs={FAQS}>
    <JsonLd schema={organizationSchema} />
    <section className="mp-hero mp-container mp-contact-layout"><div className="mp-contact-intro"><p className="mp-eyebrow">LET’S TALK ABOUT YOUR WORKSPACE</p><h1>A better working day<br /><span>starts with a conversation.</span></h1><p className="mp-lead">Tell us what your team needs to organize. We’ll help you explore the product, discuss your requirements, and find the right next step.</p>
      <div className="mp-contact-channels"><a href="mailto:support@appnix.info"><Mail size={22} /><span><small>EMAIL OUR TEAM</small><strong>support@appnix.info</strong></span><ArrowUpRight size={17} /></a><a href="tel:+917753983175"><Phone size={22} /><span><small>GIVE US A CALL</small><strong>+91 77539 83175</strong></span><ArrowUpRight size={17} /></a><a href="https://wa.me/917753983175" target="_blank" rel="noopener noreferrer"><MessageCircle size={22} /><span><small>START A CONVERSATION</small><strong>Chat on WhatsApp</strong></span><ArrowUpRight size={17} /></a></div>
      <div className="mp-next-steps"><h2>A useful first conversation.</h2><p>Share your team size and the workflows you want to explore. Ask about lead management, WhatsApp, or a product demo.</p><div className="mp-actions"><Link className="mp-text-link" to="/pricing">Review plans first <ArrowUpRight size={15} /></Link></div></div>
    </div><div className="mp-contact-form"><p className="mp-eyebrow">PRODUCT QUESTIONS · DEMO REQUESTS</p><h2>Tell us what you have in mind.</h2><p>Your details prepare a WhatsApp message. Review and send it there to reach our team.</p>
      {submitted ? <div className="mp-form-status" role="status" tabIndex={-1} ref={successRef}><CheckCircle2 size={30} /><h3>Continue the conversation in WhatsApp.</h3><p>Your enquiry is prepared. Review the message in WhatsApp and press send. Your details haven’t been sent by this form.</p><a className="mp-button" href={preparedUrl} target="_blank" rel="noopener noreferrer">Open WhatsApp again <ArrowUpRight size={16} /></a><button className="mp-text-link" onClick={() => { setSubmitted(false); requestAnimationFrame(() => formRef.current?.elements.namedItem('name')?.focus()); }}>Edit your enquiry <ArrowRight size={14} /></button></div> : <form className="mp-form" ref={formRef} noValidate onSubmit={handleFormSubmit} aria-label="Contact enquiry">
        <p className="mp-form-note" style={{ marginBottom: 18 }}>Fields marked * are required.</p>
        <div className="mp-form-grid">{field('name', 'Your name', 'text', 'Full name', 'name')}{field('email', 'Email address', 'email', 'you@company.com', 'email')}{field('phone', 'Phone / WhatsApp', 'tel', '+91 98765 43210', 'tel')}<div className="mp-field"><label htmlFor="contact-team-size">Team size</label><select id="contact-team-size" name="teamSize" value={formData.teamSize} onChange={event => update('teamSize', event.target.value)}><option value="1-5">1 - 5 users (Starter)</option><option value="6-25">6 - 25 users (Growth)</option><option value="25+">25+ users (Enterprise)</option></select></div><div className="mp-field mp-field-wide"><label htmlFor="contact-message">What would you like to discuss? <span>(optional)</span></label><textarea id="contact-message" name="message" rows={4} placeholder="Tell us about your team, workflows, or product questions…" value={formData.message} onChange={event => update('message', event.target.value)} /></div></div>
        {Object.values(errors).some(Boolean) && <p role="alert" className="mp-field-error">Please check the highlighted fields.</p>}
        {openError && <div className="mp-form-error" role="alert">WhatsApp couldn’t open. Allow pop-ups, or <a href={preparedUrl} target="_blank" rel="noopener noreferrer">open your prepared enquiry here</a>. You can also email <a href="mailto:support@appnix.info">support@appnix.info</a>.</div>}
        <button className="mp-button" type="submit">Continue in WhatsApp <ArrowUpRight size={16} /></button><p className="mp-form-note">Opens WhatsApp in a new tab. You’ll review and send the message there.</p>
      </form>}
    </div></section>
    <div className="mp-tinted"><PageFAQs items={FAQS} title="Before we get talking." /></div>
  </MarketingPage>;
}
