import { useSettings } from '../../context/SettingsContext.jsx';

export default function Footer() {
  const { settings } = useSettings();
  const columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Industries', 'Security'] },
    { title: 'Company', links: ['About', 'Contact', 'Careers'] },
    { title: 'Resources', links: ['FAQ', 'Support', 'API docs'] },
  ];
  return (
    <footer className="bg-slate-950 py-16 font-theme">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-lg font-bold text-white">{settings?.brand?.name || 'Common CRM'}</span>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              One workspace for leads, WhatsApp and delivery.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-slate-400 hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-slate-500">
          &copy; {new Date().getFullYear()} {settings?.brand?.name || 'Common CRM'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}