import { Link } from 'react-router-dom';
import { Check, ArrowUpRight } from 'lucide-react';
import MarketingPage, { DemoButton, PageCTA, PageFAQs } from '../components/landing/MarketingPage.jsx';

const PLANS = [
  {
    name: 'Starter',
    price: '₹1,999',
    period: '/month',
    desc: 'For small teams getting off spreadsheets.',
    features: [
      'Up to 5 users',
      'Lead management',
      'WhatsApp for 1 number',
      'Email support'
    ],
    highlight: false,
    cta: 'Start free trial',
    ctaSource: 'pricing_page_starter_trial'
  },
  {
    name: 'Growth',
    price: '₹5,999',
    period: '/month',
    desc: 'For teams running projects and multiple channels.',
    features: [
      'Up to 25 users',
      'Everything in Starter',
      'Projects & document storage',
      'Team capacity checks',
      'Priority support'
    ],
    highlight: true,
    cta: 'Start free trial',
    ctaSource: 'pricing_page_growth_trial'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For larger orgs with custom workflows.',
    features: [
      'Unlimited users',
      'Everything in Growth',
      'Custom roles & permissions',
      'Dedicated onboarding'
    ],
    highlight: false,
    cta: 'Contact sales',
    ctaSource: 'pricing_page_enterprise_contact'
  },
];

const COMPARISON_ROWS = [
  { category: 'Team & User Capacity' },
  { name: 'User Seats Included', starter: 'Up to 5 users', growth: 'Up to 25 users', enterprise: 'Unlimited users' },
  { name: 'Role-Based Access Control', starter: 'Standard roles', growth: 'Standard roles', enterprise: 'Custom roles & permissions' },
  { name: 'Team Capacity & Workload Views', starter: false, growth: true, enterprise: true },
  
  { category: 'Lead & Pipeline Management' },
  { name: 'Multi-Channel Lead Capture', starter: true, growth: true, enterprise: true },
  { name: 'CSV Lead Import & Column Mapping', starter: true, growth: true, enterprise: true },
  { name: 'Visual Kanban Sales Pipeline', starter: true, growth: true, enterprise: true },
  { name: 'Deal Value & Velocity Tracking', starter: true, growth: true, enterprise: true },

  { category: 'WhatsApp Conversations' },
  { name: 'Connected Business Numbers', starter: '1 Number', growth: 'Multiple Numbers', enterprise: 'Custom Numbers' },
  { name: 'User-Level Conversation Isolation', starter: true, growth: true, enterprise: true },
  { name: 'Centralized Chat History', starter: true, growth: true, enterprise: true },

  { category: 'Project & Delivery Execution' },
  { name: 'Won Lead to Project Conversion', starter: false, growth: true, enterprise: true },
  { name: 'Task Management & Assignment', starter: false, growth: true, enterprise: true },
  { name: 'Document Vault & Storage', starter: false, growth: true, enterprise: true },

  { category: 'Support & Onboarding' },
  { name: 'Support Channel', starter: 'Email support', growth: 'Priority support', enterprise: 'Dedicated onboarding & support' },
  { name: 'Onboarding Assistance', starter: 'Self-guided', growth: 'Guided setup', enterprise: 'Dedicated onboarding' },
];

const FAQS = [
  {
    question: 'Can I upgrade my plan as my team grows?',
    answer: 'Yes. You can upgrade from Starter to Growth or Enterprise at any time. Your leads, pipeline history, and projects carry over seamlessly with zero migration needed.'
  },
  {
    question: 'Are there hidden fees for WhatsApp conversations?',
    answer: 'Appnix CRM Pro charges a flat platform subscription. Platform plans include support for your connected business numbers without hidden per-message markups from Appnix.'
  },
  {
    question: 'What is the refund policy for new subscriptions?',
    answer: 'First-time subscribers may request a refund within seven (7) calendar days of their initial purchase in accordance with our Refund Policy.'
  },
  {
    question: 'How does user licensing work?',
    answer: 'The Starter plan includes up to 5 users, Growth includes up to 25 users, and Enterprise supports unlimited user seats with custom role permissions.'
  }
];

export default function PricingPage() {
  return <MarketingPage name="Pricing" path="/pricing" title="Appnix CRM Pro Pricing | CRM Plans" description="Compare Appnix CRM Pro Starter, Growth, and Enterprise plans, monthly prices, user allowances, included features, and billing terms." faqs={FAQS}>
    <section className="mp-container mp-hero mp-pricing-hero"><p className="mp-eyebrow">A WORKSPACE FOR YOUR NEXT STAGE</p><h1>A clear plan.<br /><span>Room for your team.</span></h1><p className="mp-lead">Compare the existing CRM Pro plans, see what’s included, and talk to us about the setup that fits your business.</p><span className="mp-pricing-label">Monthly subscriptions · Custom Enterprise pricing</span></section>
    <section className="mp-container mp-plan-grid" aria-label="CRM Pro plans">
      {PLANS.map(plan => <article key={plan.name} className={'mp-plan' + (plan.highlight ? ' mp-plan-highlight' : '')}>
        <div className="mp-plan-label"><h2>{plan.name}</h2>{plan.highlight && <span>FOR GROWING TEAMS</span>}</div>
        <p>{plan.desc}</p><p className="mp-price">{plan.price}<span>{plan.period}</span></p>
        <ul>{plan.features.map(feature => <li key={feature}><Check size={15} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
        <DemoButton source={plan.ctaSource} className={plan.highlight ? '' : 'mp-button-quiet'}>{plan.cta}</DemoButton>
      </article>)}
    </section>
    <div className="mp-container mp-pricing-help"><p>Not sure which plan fits your team? Tell us what you need to organize.</p><Link className="mp-text-link" to="/contact">Talk to our team <ArrowUpRight size={16} /></Link></div>
    <section className="mp-comparison" aria-labelledby="mp-comparison-title"><div className="mp-container"><div className="mp-section-heading"><div><p className="mp-eyebrow">THE DETAILS, SIDE BY SIDE</p><h2 id="mp-comparison-title">Find the right fit<br />for the way you work.</h2></div><p>Compare the included features and allowances across all three plans.</p></div>
      <div className="mp-comparison-scroll" role="region" aria-label="Plan feature comparison" tabIndex={0}>
        <table><caption>Appnix CRM Pro plan features and allowances</caption><thead><tr><th scope="col">Included features</th>{PLANS.map(plan => <th key={plan.name} scope="col">{plan.name}</th>)}</tr></thead><tbody>
          {COMPARISON_ROWS.map(row => row.category ? <tr key={row.category} className="mp-comparison-category"><th colSpan={4} scope="colgroup">{row.category}</th></tr> : <tr key={row.name}><th scope="row">{row.name}</th>{['starter', 'growth', 'enterprise'].map(plan => <td key={plan}>{typeof row[plan] === 'boolean' ? row[plan] ? <><Check size={17} aria-hidden="true" /><span className="sr-only">Included</span></> : <span aria-label="Not included">—</span> : row[plan]}</td>)}</tr>)}
        </tbody></table>
      </div><p className="mp-comparison-hint">On smaller screens, scroll the comparison horizontally to view every plan.</p>
    </div></section>
    <section className="mp-container mp-section" aria-labelledby="mp-billing-title"><p className="mp-eyebrow">BILLING & POLICIES</p><h2 id="mp-billing-title" style={{ marginTop: 16 }}>The terms behind your plan.</h2><div className="mp-billing-grid">
      <div><h3>Cancellation Policy</h3><p>You may cancel your subscription at any time from your user dashboard. Cancellations take effect at the end of the current billing cycle. For complete details, review our <Link to="/terms-and-conditions">Terms & Conditions</Link>.</p></div>
      <div><h3>7-Day Refund Grace Period</h3><p>First-time subscribers may file a refund request within seven (7) calendar days of the initial subscription purchase. Read the full guidelines in our <Link to="/refund-policy">Refund & Cancellation Policy</Link>.</p></div>
    </div></section>
    <div className="mp-tinted"><PageFAQs items={FAQS} title="A little clarity before you choose." /></div>
    <PageCTA title="Let’s find the right workspace for your team." description="Explore the product and discuss your requirements with our team." source="pricing_page_final_contact" />
  </MarketingPage>;
}
