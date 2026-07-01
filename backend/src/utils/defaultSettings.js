export const defaultSettings = {
  brand: {
    name: 'Common CRM',
    logo: '',
    favicon: ''
  },
  theme: {
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    accentColor: '#f59e0b',
    fontFamily: 'Inter, system-ui, sans-serif',
    buttonStyle: 'solid',
    cardStyle: 'bordered',
    borderRadius: '8px'
  },
  content: {
    homeTitle: 'Reusable business website',
    homeSubtitle: 'Manage products, services, leads, orders, content, and theme from one panel.',
    footerText: 'Powered by Common CRM'
  },
  contact: {
    email: 'hello@example.com',
    phone: '+91 00000 00000',
    address: 'Your business address'
  },
  social: {
    facebook: '',
    instagram: '',
    linkedin: '',
    x: '',
    youtube: ''
  },
  seo: {
    title: 'Common CRM',
    description: 'Reusable CRM and admin panel boilerplate.',
    keywords: 'crm, admin panel, react, node'
  },
  integrations: {
    justdial: { isActive: false, pollUrl: '', apiToken: '', pollIntervalMs: 300000 },
    indiamart: { isActive: false, apiKey: '' },
    zoho: { isActive: false, clientClientId: '', clientSecret: '', redirectUri: '' },
    website: { isActive: true, webhookSecret: 'secret_key' }
  }
};

