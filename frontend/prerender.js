import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, 'dist');
const serverEntryPath = path.resolve(distDir, 'server', 'entry-server.js');

const ROUTES = [
  '/',
  '/login',
  '/whatsapp-crm',
  '/lead-management',
  '/pricing',
  '/contact',
  '/privacy-policy',
  '/terms-and-conditions',
  '/data-deletion-request',
  '/refund-policy',
];

async function prerender() {
  const templatePath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found at ${templatePath}`);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const { render } = await import(pathToFileURL(serverEntryPath).href);

  console.log('Starting static prerendering of public routes...');

  for (const route of ROUTES) {
    const { appHtml, helmet } = render(route);

    let html = template;

    // Inject rendered React markup into root
    html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

    // Inject Helmet title
    if (helmet?.title) {
      const titleStr = helmet.title.toString();
      if (titleStr) {
        html = html.replace(/<title>[\s\S]*?<\/title>/i, titleStr);
      }
    }

    // Inject Helmet canonical link
    if (helmet?.link) {
      const linkStr = helmet.link.toString();
      if (linkStr && linkStr.includes('rel="canonical"')) {
        html = html.replace(/<link[^>]*rel=["']canonical["'][^>]*>/i, linkStr);
      }
    }

    // Inject Helmet meta tags (description, robots, etc.)
    if (helmet?.meta) {
      const metaStr = helmet.meta.toString();
      if (metaStr) {
        // If helmet provides description, replace the default template description
        if (metaStr.includes('name="description"')) {
          html = html.replace(/<meta[^>]*name=["']description["'][^>]*>/i, '');
        }
        // If helmet provides robots, replace the default template robots
        if (metaStr.includes('name="robots"')) {
          html = html.replace(/<meta[^>]*name=["']robots["'][^>]*>/i, '');
        }
        // Insert helmet meta tags right before </head>
        html = html.replace('</head>', `  ${metaStr}\n  </head>`);
      }
    }

    // Inject Helmet script tags (JSON-LD structured data, etc.)
    if (helmet?.script) {
      const scriptStr = helmet.script.toString();
      if (scriptStr) {
        html = html.replace('</head>', `  ${scriptStr}\n  </head>`);
      }
    }

    // Determine target output files
    if (route === '/') {
      fs.writeFileSync(path.resolve(distDir, 'index.html'), html, 'utf-8');
      console.log('  ✓ Prerendered: / -> dist/index.html');
    } else {
      const subDir = path.resolve(distDir, route.replace(/^\//, ''));
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
      fs.writeFileSync(path.resolve(subDir, 'index.html'), html, 'utf-8');
      fs.writeFileSync(path.resolve(distDir, `${route.replace(/^\//, '')}.html`), html, 'utf-8');
      console.log(`  ✓ Prerendered: ${route} -> dist/${route.replace(/^\//, '')}/index.html & dist/${route.replace(/^\//, '')}.html`);
    }
  }

  // Clean up server build directory
  const serverDir = path.resolve(distDir, 'server');
  if (fs.existsSync(serverDir)) {
    fs.rmSync(serverDir, { recursive: true, force: true });
    console.log('  ✓ Cleaned up temporary server bundle (dist/server)');
  }

  console.log(`Static prerendering complete! All ${ROUTES.length} public routes prerendered.`);
}

prerender().catch((err) => {
  console.error('Prerendering failed:', err);
  process.exit(1);
});
