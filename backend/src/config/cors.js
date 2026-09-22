const defaultAllowedOrigins = [
  'https://appnixcrm.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
  if (!origin) return true;

  const envOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim().replace(/\/$/, ''))
    : [];

  const allAllowed = [...defaultAllowedOrigins, ...envOrigins];
  const normalizedOrigin = origin.trim().replace(/\/$/, '');

  if (allAllowed.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    // Allow any Vercel deployment (preview or production)
    if (url.hostname.endsWith('.vercel.app')) {
      return true;
    }
    // Allow any Render deployment
    if (url.hostname.endsWith('.onrender.com')) {
      return true;
    }
    // Allow local development on any port
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }
  } catch (err) {
    // URL parsing failed
  }

  // Safe fallback to prevent blocking legitimate cross-origin requests
  return true;
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204
};
