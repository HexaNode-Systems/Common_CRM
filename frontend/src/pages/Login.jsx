import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import crmHero from '../assets/crm_login_hero.jpg';
import { Shield, Sparkles, AlertCircle, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@example.com', password: 'Admin@12345' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <main className="flex min-h-screen w-full bg-slate-50 font-theme">
      <Helmet>
        {/* Shown in the browser tab and as the bold clickable line in Google search results */}
        <title>Login | Appnix CRM Pro</title>

        {/* Grey summary text shown below the title in Google search results */}
        <meta
          name="description"
          content="Sign in to your Appnix CRM Pro workspace to manage leads, WhatsApp conversations, projects and your team from one dashboard."
        />

        {/* Points to the official URL for this page */}
        <link rel="canonical" href="https://appnix.info/login" />

        {/*
          noindex: tells Google not to show this page in search results.
          A login form has no content someone would search for, and letting it get indexed
          just wastes Google's "crawl budget" on a page that will only ever show a form.
          follow: still lets Google follow links found on this page (e.g. footer links).
        */}
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="grid w-full grid-cols-1 lg:grid-cols-12">
        {/* Left Side: CRM Image Showcase */}
        <div className="relative hidden flex-col justify-between p-12 lg:col-span-5 lg:flex xl:col-span-6 overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={crmHero} 
              alt="CRM Hero" 
              className="h-full w-full object-cover object-center transition-transform duration-10000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/85 to-indigo-950/95" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-85" />
          </div>

          {/* Logo / Brand Name */}
          <div className="relative z-10 flex items-center gap-3">
            {settings?.brand?.logo ? (
              <img 
                src={settings.brand.logo} 
                alt={settings?.brand?.name || 'CRM Logo'} 
                className="h-10 w-10 rounded-xl object-contain bg-white/10 p-1 backdrop-blur-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-white">
              {settings?.brand?.name || 'Common CRM'}
            </span>
          </div>

          {/* Testimonial / Features Glassmorphism Card */}
          <div className="relative z-10 mt-auto max-w-lg">
            <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 uppercase tracking-wider backdrop-blur-sm">
                  <Shield size={12} className="text-indigo-400" /> Secure Admin Portal
                </span>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl leading-tight">
                  Elevate Your Business Operations
                </h2>
                <p className="mt-3 text-base text-slate-300 leading-relaxed">
                  Manage leads, distribute tasks, track orders, and automate workflows with our unified CRM workspace.
                </p>
              </div>

              {/* CRM Key Metrics/Benefits */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-xs text-slate-400 mt-0.5">Automated Workflows</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Real-time</p>
                  <p className="text-xs text-slate-400 mt-0.5">Analytics & Reporting</p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-slate-400">
              &copy; {new Date().getFullYear()} {settings?.brand?.name || 'Common CRM'}. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="col-span-12 flex flex-col justify-center px-6 py-12 lg:col-span-7 lg:px-16 xl:col-span-6 xl:px-24 bg-white relative">
          
          {/* Logo for mobile view */}
          <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
            {settings?.brand?.logo ? (
              <img 
                src={settings.brand.logo} 
                alt="CRM Logo" 
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Sparkles className="h-4 w-4" />
              </div>
            )}
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {settings?.brand?.name || 'Common CRM'}
            </span>
          </div>

          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500">
                Please enter your credentials to access the workspace.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-100">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Sign in failed</p>
                  <p className="text-red-700/90 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={submit}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Email Address</label>
                  <div className="relative rounded-theme shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="admin@example.com"
                      className="input pl-11"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <a 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); alert('Please contact the system administrator to reset your password.'); }} 
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative rounded-theme shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="input pl-11"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Demo Credentials Alert Note */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Demo Account:</span> Credentials have been prefilled for quick access. Click Sign In below.
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">Keep me signed in</span>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full justify-center py-3 text-sm shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}