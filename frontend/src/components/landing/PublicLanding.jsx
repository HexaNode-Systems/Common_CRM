import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, ChevronDown,
  Code2, FolderKanban, GitFork, Layers3, LockKeyhole, Menu,
  MessageCircle, Phone, Target, X,
} from 'lucide-react';
import { useInquiry } from '../../context/InquiryContext.jsx';
import './public-landing.css';

const appnixUrl = 'https://www.appnix.org';
const navigation = [
  ['The workspace', '#product'], ['Features', '#features'],
  ['About Appnix', '#appnix'], ['FAQs', '#faq'],
];

const features = [
  { number: '01', Icon: Target, title: 'Give every lead a clear next step.',
    description: 'Keep lead details, statuses, and ownership organized. Use distribution rules to assign incoming leads across your team.',
    tags: ['Lead management', 'Lead distribution'], className: 'crm-feature-wide', link: '/lead-management', linkText: 'Explore lead management' },
  { number: '02', Icon: FolderKanban, title: 'Bring people and projects together.',
    description: 'Manage users, organize projects, and assign tasks. Define roles and permissions around the responsibilities of your team.',
    tags: ['Users & roles', 'Projects & tasks'], className: 'crm-feature-wide' },
  { number: '03', Icon: BarChart3, title: 'See the business behind the work.',
    description: 'Keep products, orders, enquiries, and invoices in view, alongside revenue indicators and work reports.',
    tags: ['Business records', 'Reports'] },
  { number: '04', Icon: MessageCircle, title: 'Keep conversations in the picture.',
    description: 'Manage customer conversations in the WhatsApp inbox and organize outbound messaging through campaigns.',
    tags: ['WhatsApp inbox', 'Campaigns'], link: '/whatsapp-crm', linkText: 'Explore WhatsApp CRM' },
  { number: '05', Icon: LockKeyhole, title: 'Keep the essentials close at hand.',
    description: 'Organize credentials in the vault, manage stored documents, and configure available connections from the integrations area.',
    tags: ['Credentials vault', 'Storage & integrations'], id: 'security' },
];

const questions = [
  ['What does Appnix CRM Pro help us manage?', 'CRM Pro brings internal operations into one workspace: leads and distribution, users and roles, projects and tasks, business records, WhatsApp messaging, credentials, storage, and reports.'],
  ['Can we use it for more than sales?', 'Yes. Alongside lead management, the product includes project and task management, user roles, a credentials vault, document storage, and work reports to support day-to-day operations.'],
  ['How does WhatsApp fit into the workspace?', 'The product includes a WhatsApp inbox, campaign management, and WhatsApp connection settings. Request a demo to discuss the setup and messaging requirements for your business.'],
  ['Can different team members have different access?', 'The users and roles modules let administrators manage team members and assign module permissions according to their responsibilities.'],
  ['How do we discuss pricing and setup?', 'Request a demo and share your team size, workflows, and requirements through the enquiry form. The Appnix team can then discuss the product and a suitable setup with you.'],
  ['What is the connection with Appnix Technologies?', 'CRM Pro is an Appnix product. Appnix Technologies also provides web and mobile app development, custom software, UI/UX design, and software maintenance services. You can explore those services at appnix.org.'],
];

function Brand() {
  return <Link to="/" className="crm-brand" aria-label="Appnix CRM Pro home">
    <img src="/logo-favicon.png" alt="" width="34" height="34" />
    <span>Appnix<span className="crm-brand-divider" /><span className="crm-brand-product">CRM Pro</span></span>
  </Link>;
}

export default function PublicLanding() {
  const { openInquiryModal } = useInquiry();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); toggleRef.current?.focus(); }
      if (event.type === 'pointerdown' && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [menuOpen]);

  const demo = (source) => { setMenuOpen(false); openInquiryModal(source); };

  return (
    <div className="crm-public">
      <a href="#main-content" className="crm-skip">Skip to content</a>
      <header className="crm-header" ref={menuRef}>
        <div className="crm-container crm-header-inner">
          <Brand />
          <nav className="crm-desktop-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="crm-header-actions">
            <Link to="/login" className="crm-signin">Sign in <ArrowUpRight size={14} /></Link>
            <button className="crm-button crm-button-small" onClick={() => demo('navbar_get_started')}>Request a demo <ArrowRight size={15} /></button>
          </div>
          <button ref={toggleRef} type="button" className="crm-menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="crm-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        <nav id="crm-mobile-nav" className="crm-mobile-nav" aria-label="Mobile navigation" hidden={!menuOpen}>
          {navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={16} /></a>)}
          <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in <ArrowUpRight size={16} /></Link>
          <button className="crm-button" onClick={() => demo('navbar_mobile_get_started')}>Request a demo <ArrowRight size={16} /></button>
        </nav>
      </header>

      <main id="main-content">
        <section className="crm-hero" id="top" aria-labelledby="crm-hero-title">
          <div className="crm-container">
            <a href="#appnix" className="crm-product-note"><span /> An Appnix Technologies product <ArrowUpRight size={13} /></a>
            <h1 id="crm-hero-title">Your business.<br /><span>Working together.</span></h1>
            <p className="crm-hero-description">Bring your leads, people, projects, and daily operations into one place. Get a clearer view of the work that moves your business forward with Appnix CRM Pro.</p>
            <div className="crm-hero-actions">
              <button className="crm-button" onClick={() => demo('hero_start_trial')}>Request a demo <ArrowRight size={17} /></button>
              <a className="crm-button crm-button-outline" href="#product">Explore the workspace <ArrowDown size={16} /></a>
            </div>
            <div className="crm-hero-topics" aria-label="Product areas">
              {['Lead management', 'Team operations', 'WhatsApp communication'].map(item => <span key={item}><Check size={13} />{item}</span>)}
            </div>

            <figure className="crm-preview" id="product">
              <div className="crm-preview-bar"><span className="crm-preview-dots" aria-hidden="true"><i /><i /><i /></span><span><Layers3 size={13} /> Appnix CRM Pro / Workspace overview</span><span className="crm-preview-label">PRODUCT PREVIEW</span></div>
              <a href="/landing/crm-dashboard.png" target="_blank" rel="noopener noreferrer" aria-label="Open the CRM dashboard preview at full size">
                <img src="/landing/crm-dashboard.png" alt="Appnix CRM Pro dashboard preview with a minimized, icon-only sidebar, business metrics, lead trend, and lead sources chart in an example workspace." width="1600" height="1000" />
                <span className="crm-preview-enlarge">View full dashboard <ArrowUpRight size={14} /></span>
              </a>
              <figcaption>Actual product interface. Example workspace data is illustrative.</figcaption>
            </figure>
          </div>
        </section>

        <section className="crm-overview crm-container" id="problem" aria-labelledby="crm-overview-title">
          <p className="crm-eyebrow">A CLEARER WAY TO WORK</p>
          <div className="crm-overview-copy"><h2 id="crm-overview-title">Less scattered work.<br />More shared context.</h2><p>A lead needs an owner. A project needs a next step. A conversation needs a follow-up. CRM Pro gives these everyday operations a common home, so your team can see what needs attention.</p></div>
          <div className="crm-principles">
            <div><GitFork size={21} /><h3>Clear ownership</h3><p>Assign leads and tasks to the people responsible.</p></div>
            <div><Layers3 size={21} /><h3>One working space</h3><p>Keep business records and everyday tools within reach.</p></div>
            <div><BarChart3 size={21} /><h3>A broader view</h3><p>Review business indicators alongside your team’s work.</p></div>
          </div>
        </section>

        <section className="crm-features" id="features" aria-labelledby="crm-features-title">
          <div className="crm-container">
            <div className="crm-section-heading"><div><p className="crm-eyebrow">THE TOOLS BEHIND YOUR DAY</p><h2 id="crm-features-title">Built around the way<br />your business works.</h2></div><p>From the first enquiry to the work behind it, keep the important details together.</p></div>
            <div className="crm-feature-grid">
              {features.map(({ number, Icon, title, description, tags, className = '', link, linkText, id }) => <article key={number} id={id} className={`crm-feature ${className}`}>
                <div className="crm-feature-top"><Icon size={23} strokeWidth={1.6} /><span>{number}</span></div>
                <h3>{title}</h3><p>{description}</p>
                <ul className="crm-feature-tags">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
                {link && <Link className="crm-text-link" to={link}>{linkText}<ArrowUpRight size={15} /></Link>}
              </article>)}
            </div>
            <article className="crm-connected-leads" aria-labelledby="crm-connected-leads-title">
              <div>
                <p className="crm-eyebrow">CONNECTED LEAD SOURCES</p>
                <h3 id="crm-connected-leads-title">Your lead sources.<br />One CRM workspace.</h3>
                <p className="crm-connected-description">Bring leads from your connected platforms into one place. Manage, organize, and follow up with your leads from a single CRM workspace.</p>
              </div>
              <div className="crm-connected-sources">
                <ul aria-label="Supported lead sources">
                  {['Justdial', 'IndiaMart', 'Zoho CRM', 'Website forms'].map(source => <li key={source}><span>{source}</span><ArrowRight size={15} aria-hidden="true" /></li>)}
                </ul>
                <p>Lead intake via configured webhooks. Connections require setup.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="crm-workflow crm-container" id="industries" aria-labelledby="crm-workflow-title">
          <div className="crm-section-heading"><div><p className="crm-eyebrow">FROM INTEREST TO EVERYDAY WORK</p><h2 id="crm-workflow-title">Follow the work.<br />Keep the context.</h2></div><button className="crm-text-link" onClick={() => demo('landing_workflow_demo')}>See it in a demo <ArrowUpRight size={17} /></button></div>
          <ol className="crm-steps">
            <li><span>01 / ORGANIZE</span><h3>Start with the opportunity.</h3><p>Manage incoming leads and enquiries. Set ownership using the lead distribution tools.</p><Target aria-hidden="true" /></li>
            <li><span>02 / COORDINATE</span><h3>Bring your team into the work.</h3><p>Organize projects, assign tasks, and manage the roles your team needs.</p><FolderKanban aria-hidden="true" /></li>
            <li><span>03 / REVIEW</span><h3>Keep the bigger picture in view.</h3><p>Review orders, invoices, revenue indicators, and reports as your operations develop.</p><BarChart3 aria-hidden="true" /></li>
          </ol>
        </section>

        <section className="crm-ecosystem" id="appnix" aria-labelledby="crm-appnix-title">
          <div className="crm-container crm-ecosystem-inner">
            <div><p className="crm-eyebrow">THE PEOPLE BEHIND THE PRODUCT</p><h2 id="crm-appnix-title">One product.<br />A wider world of expertise.</h2><p>CRM Pro is part of Appnix’s work in software and technology. <a href={appnixUrl} target="_blank" rel="noopener noreferrer">Appnix Technologies</a> also helps businesses design, build, and maintain digital products.</p><a href={appnixUrl} target="_blank" rel="noopener noreferrer" className="crm-button crm-button-outline">Explore Appnix Technologies <ArrowUpRight size={17} /></a></div>
            <div className="crm-service-list"><div><Code2 size={23} /><span><h3>Web & mobile development</h3><p>Web applications and mobile experiences.</p></span></div><div><Layers3 size={23} /><span><h3>Custom software & product design</h3><p>Business software, UI/UX, and design systems.</p></span></div><div><FolderKanban size={23} /><span><h3>Maintenance & ongoing support</h3><p>Continued care for software and applications.</p></span></div></div>
          </div>
        </section>

        <section className="crm-faq crm-container" id="faq" aria-labelledby="crm-faq-title">
          <div><p className="crm-eyebrow">A LITTLE MORE CLARITY</p><h2 id="crm-faq-title">Good questions.<br />Straight answers.</h2><p>Have a workflow in mind?</p><button className="crm-text-link" onClick={() => demo('landing_faq_demo')}>Let’s talk it through <ArrowUpRight size={16} /></button></div>
          <div className="crm-questions">{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="crm-final" id="pricing" aria-labelledby="crm-final-title"><div className="crm-container crm-final-inner"><div><p className="crm-eyebrow">LET’S PUT YOUR WORK IN PERSPECTIVE</p><h2 id="crm-final-title">Make room for<br />a more organized business.</h2><p>Tell us how your team works. Explore how CRM Pro could fit.</p></div><div><button className="crm-button" onClick={() => demo('landing_final_cta')}>Request a demo <ArrowRight size={18} /></button><span className="crm-final-note">Your team. Your workflows. A closer look.</span></div></div></section>
      </main>

      <footer className="crm-footer"><div className="crm-container"><div className="crm-footer-top"><div><Brand /><p>A common home for your business operations.</p><a className="crm-footer-parent" href={appnixUrl} target="_blank" rel="noopener noreferrer">By Appnix Technologies <ArrowUpRight size={14} /></a></div><nav aria-label="Product links"><span>PRODUCT</span><a href="#features">Features</a><Link to="/lead-management">Lead management</Link><Link to="/whatsapp-crm">WhatsApp CRM</Link><Link to="/pricing">Pricing</Link></nav><nav aria-label="Contact and resources"><span>LET’S CONNECT</span><button onClick={() => demo('footer_start_trial')}>Request a demo</button><Link to="/contact">Contact us</Link><Link to="/login">Sign in</Link><a href="https://wa.me/917753983175" target="_blank" rel="noopener noreferrer">WhatsApp <ArrowUpRight size={12} /></a><a href="tel:+917753983175"><Phone size={12} /> +91 77539 83175</a></nav></div><div className="crm-footer-bottom"><p>© {new Date().getFullYear()} Appnix CRM Pro. All rights reserved.</p><nav aria-label="Legal"><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms-and-conditions">Terms & conditions</Link><Link to="/data-deletion-request">Data deletion</Link><Link to="/refund-policy">Refund policy</Link></nav></div></div></footer>
    </div>
  );
}
