/**
 * SEO Structured Data (JSON-LD) Schemas for Appnix CRM Pro.
 * Strictly factual and matching visible on-page content.
 */

export const homeSchemaGraph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.appnix.info/#website',
      'url': 'https://www.appnix.info/',
      'name': 'Appnix CRM Pro',
      'description': 'Appnix CRM Pro is a WhatsApp CRM software for managing leads, chats, pipelines, projects and teams from one workspace.',
      'publisher': {
        '@id': 'https://www.appnix.info/#organization'
      },
      'inLanguage': 'en'
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.appnix.info/#organization',
      'name': 'Appnix Technologies',
      'url': 'https://www.appnix.org/',
      'logo': {
        '@type': 'ImageObject',
        '@id': 'https://www.appnix.info/#logo',
        'url': 'https://www.appnix.info/logo-favicon.png',
        'caption': 'Appnix Technologies Logo'
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+917753983175',
        'contactType': 'customer service',
        'email': 'support@appnix.info'
      }
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.appnix.info/#software',
      'name': 'Appnix CRM Pro',
      'applicationCategory': 'BusinessApplication',
      'operatingSystem': 'Web',
      'url': 'https://www.appnix.info/',
      'description': 'Appnix CRM Pro is a WhatsApp CRM software for managing leads, chats, pipelines, projects and teams from one workspace.',
      'publisher': {
        '@id': 'https://www.appnix.info/#organization'
      }
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.appnix.info/#faq',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'Can I bring in leads from my current spreadsheet?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes — import via CSV and we map the columns to your pipeline fields during setup.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Is WhatsApp messaging really isolated per user?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes. Each team member only ever sees the chats and messages assigned to them, even on a shared business number.'
          }
        },
        {
          '@type': 'Question',
          'name': 'Can I change the branding for a client I manage this for?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Yes — brand name, logo, colors, fonts and content are all editable from Settings without touching code.'
          }
        },
        {
          '@type': 'Question',
          'name': 'What happens if I outgrow the Starter plan?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'You can upgrade at any time; your leads, projects and documents carry over with no migration needed.'
          }
        }
      ]
    }
  ]
};

export function createBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  };
}

export function createFaqSchema(faqItems) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };
}

