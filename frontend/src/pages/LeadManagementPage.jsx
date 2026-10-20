import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, Check, FileSpreadsheet, GitFork, Layers3, ListFilter, NotebookPen, Target } from 'lucide-react';
import MarketingPage, { DemoButton, PageCTA, PageFAQs } from '../components/landing/MarketingPage.jsx';

const FAQS = [
  { question: 'How can I bring existing leads into the CRM?', answer: 'Add leads manually or upload a CSV file using the lead import tool. The import accepts name and phone columns, with optional email and requirements or notes.' },
  { question: 'Which external lead sources are supported?', answer: 'The integrations area includes lead intake for Justdial, IndiaMart, Zoho CRM, and website forms through configured webhooks. Connections require setup; you can also import CSV files.' },
  { question: 'How do leads get assigned to the right person?', answer: 'Administrators can assign a lead directly or configure lead distribution rules. Rules support source-based routing, round-robin distribution, and assignment to a selected team member.' },
  { question: 'How can we track progress and follow up?', answer: 'Manage lead statuses, filter by source, owner, or date, and add notes to keep follow-up context with the lead record. The available statuses are New, Contacted, Proposal Sent, Negotiation, Won, and Lost.' },
];

const steps = [
  ['01', 'Bring leads together.', 'Add a lead, import a CSV, or receive leads from a configured external source.'],
  ['02', 'Give each lead an owner.', 'Assign a team member directly or use lead distribution rules to route incoming leads.'],
  ['03', 'Keep progress visible.', 'Update statuses and use filters to find leads by source, owner, or date.'],
  ['04', 'Follow up with context.', 'Keep contact details, requirements, and notes with the lead record.'],
];

export default function LeadManagementPage() {
  return <MarketingPage name="Lead management" path="/lead-management" title="Lead Management Software | Appnix CRM Pro" description="Organize leads, assign owners, track statuses, and keep follow-up notes in one CRM workspace. Connect supported lead sources or import a CSV." faqs={FAQS}>
    <section className="mp-hero mp-container mp-hero-grid">
      <div><p className="mp-eyebrow">LEAD MANAGEMENT, WITH A CLEAR NEXT STEP</p><h1>Every opportunity.<br /><span>One organized place.</span></h1><p className="mp-lead">Bring your leads into one workspace. Know where they came from, who owns the conversation, and what needs to happen next.</p><div className="mp-actions"><DemoButton source="lead_mgmt_hero_trial" /><Link className="mp-text-link" to="/pricing">View plans & pricing <ArrowUpRight size={16} /></Link></div><div className="mp-hero-note"><span><Check size={13} />CSV imports</span><span><Check size={13} />Lead distribution</span><span><Check size={13} />Notes & statuses</span></div></div>
      <figure className="mp-workflow-visual" aria-label="Lead workflow overview">
        <div className="mp-visual-topline"><span>FROM FIRST ENQUIRY TO FOLLOW-UP</span><GitFork size={17} /></div>
        <ul className="mp-source-labels" aria-label="Lead entry methods"><li>Manual entry</li><li>CSV import</li><li>Connected sources</li></ul>
        <div className="mp-workspace-node"><Layers3 size={29} /><div><h2>One lead workspace</h2><p>Contact details · Owner · Notes · Status</p></div></div>
        <ArrowDown className="mp-visual-arrow" size={19} aria-hidden="true" />
        <ul className="mp-status-labels" aria-label="Available lead statuses">{['New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map(status => <li key={status}>{status}</li>)}</ul>
        <figcaption className="mp-visual-caption">A simple view of the lead workflow. Keep each record’s next step in focus.</figcaption>
      </figure>
    </section>
    <section className="mp-tinted"><div className="mp-container mp-section"><div className="mp-section-heading"><div><p className="mp-eyebrow">A WORKFLOW YOUR TEAM CAN FOLLOW</p><h2>From incoming lead<br />to informed follow-up.</h2></div><p>Give the details, responsibilities, and conversations behind each opportunity a common home.</p></div><ol className="mp-steps">{steps.map(([number, title, description]) => <li key={number}><span className="mp-step-number">{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></div></section>
    <section className="mp-container mp-section mp-split"><div><p className="mp-eyebrow">THE DETAILS THAT MAKE FOLLOW-UP EASIER</p><h2>Less searching.<br />More useful context.</h2><p>Lead records keep the essentials together, so your team can pick up the next conversation with a clearer understanding of the customer.</p><div className="mp-actions"><DemoButton source="lead_mgmt_workflow_demo" /></div></div><ul className="mp-feature-list"><li><ListFilter size={23} /><div><h3>Find the leads that need attention.</h3><p>Search and filter by source, status, owner, and date.</p></div></li><li><GitFork size={23} /><div><h3>Make ownership clear.</h3><p>Manage assignments and source-based distribution rules.</p></div></li><li><NotebookPen size={23} /><div><h3>Keep the conversation’s context.</h3><p>Add notes alongside contact details and requirements.</p></div></li></ul></section>
    <section className="mp-tinted"><div className="mp-container mp-section mp-split"><div><p className="mp-eyebrow">CONNECTED LEAD SOURCES</p><h2>Your connected platforms.<br />One central workspace.</h2><p>Bring leads from supported external sources into the CRM. Manage, organize, and follow up from the same place.</p><div className="mp-connections" aria-label="Supported external lead sources">{['Justdial', 'IndiaMart', 'Zoho CRM', 'Website forms'].map(source => <span key={source}>{source}</span>)}</div><p className="mp-footnote">Lead intake uses configured webhooks. Connections require setup.</p></div><ul className="mp-feature-list"><li><FileSpreadsheet size={23} /><div><h3>Already have a spreadsheet?</h3><p>Import your existing lead list using the CSV upload tool.</p></div></li><li><Target size={23} /><div><h3>Capture the leads you meet.</h3><p>Create records manually after a call, enquiry, or introduction.</p></div></li></ul></div></section>
    <PageFAQs items={FAQS} />
    <PageCTA title="Give your next opportunity a clearer path." source="lead_mgmt_final_trial" />
  </MarketingPage>;
}
