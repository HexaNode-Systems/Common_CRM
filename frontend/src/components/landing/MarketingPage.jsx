import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import JsonLd from '../JsonLd.jsx';
import { createBreadcrumbSchema, createFaqSchema } from '../../utils/seoSchemas.js';
import { useInquiry } from '../../context/InquiryContext.jsx';
import './public-landing.css';
import './marketing-pages.css';

export default function MarketingPage({ name, path, title, description, faqs, children }) {
  const url = `https://www.appnix.info${path}`;
  return <div className="crm-marketing">
    <Helmet><title>{title}</title><meta name="description" content={description} /><link rel="canonical" href={url} /><meta name="robots" content="index, follow" /><meta property="og:type" content="website" /><meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:url" content={url} /><meta property="og:image" content="https://www.appnix.info/logo-favicon.png" /><meta name="twitter:card" content="summary" /><meta name="twitter:title" content={title} /><meta name="twitter:description" content={description} /><meta name="twitter:image" content="https://www.appnix.info/logo-favicon.png" /></Helmet>
    <JsonLd schema={createBreadcrumbSchema([{ name: 'Home', url: 'https://www.appnix.info/' }, { name, url }])} />
    {faqs && <JsonLd schema={createFaqSchema(faqs)} />}
    <a className="mp-skip" href="#main-content">Skip to content</a>
    <Navbar variant="product" />
    <main id="main-content"><div className="mp-container"><nav className="mp-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{name}</span></nav></div>{children}</main>
    <Footer variant="product" />
  </div>;
}

export function DemoButton({ source, children = 'Request a demo', className = '' }) {
  const { openInquiryModal } = useInquiry();
  return <button className={`mp-button ${className}`} onClick={() => openInquiryModal(source)}>{children}<ArrowRight size={16} aria-hidden="true" /></button>;
}

export function PageFAQs({ items, title = 'A few things you might be wondering.' }) {
  return <section className="mp-section mp-container mp-faq" aria-labelledby="mp-faq-title"><div><p className="mp-eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</p><h2 id="mp-faq-title">{title}</h2><Link className="mp-text-link" to="/contact">Talk to our team <ArrowUpRight size={16} /></Link></div><div className="mp-questions">{items.map(({ question, answer }) => <details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></section>;
}

export function PageCTA({ title = 'A clearer way to work starts here.', description = 'Tell us about your team. Take a closer look at CRM Pro.', source }) {
  return <section className="mp-final"><div className="mp-container"><div><p className="mp-eyebrow">LET’S TALK ABOUT YOUR WORKSPACE</p><h2>{title}</h2><p>{description}</p></div><DemoButton source={source} /></div></section>;
}
