import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Mail, Lock, Target, MessageSquare, FolderKanban } from 'lucide-react';
import JsonLd from '../components/JsonLd.jsx';
import { createBreadcrumbSchema } from '../utils/seoSchemas.js';
import { useAuth } from '../context/AuthContext.jsx';
// Same design system as the landing page: fonts, colours, buttons and corners.
import '../components/landing/public-landing.css';
import '../components/landing/login.css';

const HIGHLIGHTS = [
  { icon: Target, title: 'Leads from every channel', text: 'Website forms, Justdial, IndiaMart and Zoho in one pipeline.' },
  { icon: MessageSquare, title: 'WhatsApp conversations', text: 'Reply, assign and follow up without leaving the CRM.' },
  { icon: FolderKanban, title: 'Projects and teams', text: 'Tasks, roles and delivery tracked alongside every client.' },
];

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', url: 'https://www.appnix.info/' },
  { name: 'Sign In', url: 'https://www.appnix.info/login' },
]);

function Brand({ inverse = false }) {
  return (
    <Link to="/" className={`crm-brand ${inverse ? 'crm-login-brand-inverse' : ''}`} aria-label="Appnix CRM Pro home">
      <img
        src="/landing/appnix-mark-34.png"
        srcSet="/landing/appnix-mark-68.png 2x, /landing/appnix-mark-102.png 3x"
        width="34"
        height="34"
        alt=""
      />
      <span>
        Appnix<span className="crm-brand-divider" />
        <span className="crm-brand-product">CRM Pro</span>
      </span>
    </Link>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@example.com', password: 'Admin@12345' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="crm-public crm-login">
      <Helmet>
        <title>Sign In | Appnix CRM Pro</title>
        <meta
          name="description"
          content="Sign in to Appnix CRM Pro to manage leads, WhatsApp conversations, projects, teams and your CRM workspace."
        />
        <link rel="canonical" href="https://www.appnix.info/login" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <JsonLd schema={breadcrumbSchema} />

      {/* Left: the landing page's dark green section */}
      <aside className="crm-login-aside" aria-label="About Appnix CRM Pro">
        <Brand inverse />

        <div className="crm-login-pitch">
          <p className="crm-eyebrow">YOUR CRM WORKSPACE</p>
          <h2>
            Your business.
            <br />
            <span>Working together.</span>
          </h2>
          <div className="crm-service-list">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon size={20} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="crm-login-copy">&copy; {new Date().getFullYear()} Appnix Technologies</p>
      </aside>

      {/* Right: sign-in form */}
      <main className="crm-login-main">
        <div className="crm-login-mobile-brand">
          <Brand />
        </div>

        <div className="crm-login-card">
          <p className="crm-eyebrow">SIGN IN</p>
          <h1>Welcome back</h1>
          <p className="crm-login-lead">Enter your credentials to open your workspace.</p>

          {error && (
            <div role="alert" className="crm-login-error">
              <AlertCircle size={17} aria-hidden="true" />
              <div>
                <strong>Sign in failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="crm-login-form">
            <label className="crm-login-field">
              <span>Email address</span>
              <span className="crm-login-input">
                <Mail size={16} aria-hidden="true" />
                <input type="email" required autoComplete="email" placeholder="you@company.com" value={form.email} onChange={update('email')} />
              </span>
            </label>

            <label className="crm-login-field">
              <span className="crm-login-field-row">
                Password
                <button
                  type="button"
                  className="crm-text-link crm-login-forgot"
                  onClick={() => alert('Please contact the system administrator to reset your password.')}
                >
                  Forgot password?
                </button>
              </span>
              <span className="crm-login-input">
                <Lock size={16} aria-hidden="true" />
                <input type="password" required autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={update('password')} />
              </span>
            </label>

            <p className="crm-login-note">
              <strong>Demo account:</strong> credentials are prefilled for quick access.
            </p>

            <label className="crm-login-check">
              <input type="checkbox" defaultChecked />
              <span>Keep me signed in</span>
            </label>

            <button type="submit" className="crm-button crm-login-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
