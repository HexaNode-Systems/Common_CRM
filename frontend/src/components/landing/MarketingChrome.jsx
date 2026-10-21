import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { useInquiry } from '../../context/InquiryContext.jsx';

const links = [['Lead management', '/lead-management'], ['WhatsApp CRM', '/whatsapp-crm'], ['Pricing', '/pricing'], ['Contact', '/contact']];

function ProductBrand() {
  return <Link to="/" className="mp-brand" aria-label="Appnix CRM Pro home"><img src="/landing/appnix-mark-34.png" srcSet="/landing/appnix-mark-68.png 2x, /landing/appnix-mark-102.png 3x" width="34" height="34" alt="" /><span>Appnix</span><i aria-hidden="true" /><span>CRM Pro</span></Link>;
}

export function ProductNavbar() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const toggleRef = useRef(null);
  const { pathname } = useLocation();
  const { openInquiryModal } = useInquiry();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
      if (event.type === 'pointerdown' && !containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', dismiss);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', dismiss); };
  }, [open]);
  return <header className="mp-header" ref={containerRef}><div className="mp-container mp-header-inner">
    <ProductBrand />
    <nav className="mp-desktop-nav" aria-label="Main navigation">{links.map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}</nav>
    <div className="mp-nav-actions"><Link to="/login">Sign in <ArrowUpRight size={14} /></Link><button className="mp-button mp-button-small" onClick={() => openInquiryModal('navbar_get_started')}>Request a demo <ArrowRight size={15} /></button></div>
    <button ref={toggleRef} className="mp-menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mp-mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={23} /> : <Menu size={23} />}</button>
  </div><nav id="mp-mobile-menu" className="mp-mobile-menu" aria-label="Mobile navigation" hidden={!open}>
    {links.map(([label, path]) => <NavLink key={path} to={path} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16} /></NavLink>)}
    <Link to="/login" onClick={() => setOpen(false)}>Sign in <ArrowUpRight size={16} /></Link>
    <button className="mp-button" onClick={() => { setOpen(false); openInquiryModal('navbar_mobile_get_started'); }}>Request a demo <ArrowRight size={16} /></button>
  </nav></header>;
}

export function ProductFooter() {
  const { openInquiryModal } = useInquiry();
  return <footer className="mp-footer"><div className="mp-container"><div className="mp-footer-grid">
    <div><ProductBrand /><p>A common home for your business operations.</p><a className="mp-parent-link" href="https://www.appnix.org" target="_blank" rel="noopener noreferrer">By Appnix Technologies <ArrowUpRight size={14} /></a></div>
    <nav aria-label="Product links"><h2>PRODUCT</h2><Link to="/">The workspace</Link>{links.slice(0, 3).map(([label, path]) => <Link key={path} to={path}>{label}</Link>)}</nav>
    <nav aria-label="Contact and resources"><h2>LET’S CONNECT</h2><button onClick={() => openInquiryModal('footer_start_trial')}>Request a demo</button><Link to="/contact">Contact us</Link><a href="mailto:support@appnix.info">support@appnix.info</a><a href="tel:+917753983175">+91 77539 83175</a><a href="https://wa.me/917753983175" target="_blank" rel="noopener noreferrer">Chat on WhatsApp <ArrowUpRight size={12} /></a></nav>
  </div><div className="mp-footer-bottom"><p>© {new Date().getFullYear()} Appnix CRM Pro. All rights reserved.</p><nav aria-label="Legal"><Link to="/privacy-policy">Privacy policy</Link><Link to="/terms-and-conditions">Terms & conditions</Link><Link to="/data-deletion-request">Data deletion</Link><Link to="/refund-policy">Refund policy</Link></nav></div></div></footer>;
}
