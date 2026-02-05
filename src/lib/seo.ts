 // SEO utilities and structured data helpers
 
 export interface PageMeta {
   title: string;
   description: string;
   keywords?: string[];
   canonical?: string;
   ogImage?: string;
   ogType?: 'website' | 'article' | 'product';
   twitterCard?: 'summary' | 'summary_large_image';
   noIndex?: boolean;
 }
 
 // Generate meta tags for a page
 export function generateMetaTags(meta: PageMeta): Record<string, string> {
   const baseUrl = 'https://shadowtalk-ai.lovable.app';
   const defaultImage = 'https://lovable.dev/opengraph-image-p98pqg.png';
   
   return {
     title: `${meta.title} | ShadowTalk AI`,
     description: meta.description.slice(0, 160),
     keywords: meta.keywords?.join(', ') || '',
     canonical: meta.canonical || baseUrl,
     'og:title': meta.title,
     'og:description': meta.description.slice(0, 160),
     'og:image': meta.ogImage || defaultImage,
     'og:type': meta.ogType || 'website',
     'og:url': meta.canonical || baseUrl,
     'twitter:card': meta.twitterCard || 'summary_large_image',
     'twitter:title': meta.title,
     'twitter:description': meta.description.slice(0, 160),
     'twitter:image': meta.ogImage || defaultImage,
     robots: meta.noIndex ? 'noindex, nofollow' : 'index, follow',
   };
 }
 
 // Structured data for Organization
 export function getOrganizationSchema() {
   return {
     '@context': 'https://schema.org',
     '@type': 'Organization',
     name: 'ShadowTalk AI',
     url: 'https://shadowtalk-ai.lovable.app',
     logo: 'https://shadowtalk-ai.lovable.app/pwa-512x512.png',
     sameAs: [
       'https://twitter.com/ShadowTalkAI',
     ],
     contactPoint: {
       '@type': 'ContactPoint',
       contactType: 'customer support',
       availableLanguage: ['English'],
     },
   };
 }
 
 // Structured data for FAQ page
 export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
   return {
     '@context': 'https://schema.org',
     '@type': 'FAQPage',
     mainEntity: faqs.map((faq) => ({
       '@type': 'Question',
       name: faq.question,
       acceptedAnswer: {
         '@type': 'Answer',
         text: faq.answer,
       },
     })),
   };
 }
 
 // Structured data for Product (Pricing)
 export function getProductSchema(product: {
   name: string;
   description: string;
   price: number;
   currency?: string;
 }) {
   return {
     '@context': 'https://schema.org',
     '@type': 'Product',
     name: product.name,
     description: product.description,
     offers: {
       '@type': 'Offer',
       price: product.price,
       priceCurrency: product.currency || 'USD',
       availability: 'https://schema.org/InStock',
     },
   };
 }
 
 // Structured data for Breadcrumbs
 export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
   return {
     '@context': 'https://schema.org',
     '@type': 'BreadcrumbList',
     itemListElement: items.map((item, index) => ({
       '@type': 'ListItem',
       position: index + 1,
       name: item.name,
       item: item.url,
     })),
   };
 }
 
 // Page-specific SEO configurations
 export const PAGE_SEO: Record<string, PageMeta> = {
   home: {
     title: 'Free AI Chatbot with Voice, Image Generation & Offline Mode',
     description: 'Chat with ShadowTalk AI - the advanced AI assistant with voice input, image generation, code execution, offline mode, and 10+ specialized modes. Free to use.',
     keywords: ['AI chatbot', 'free AI', 'voice assistant', 'image generation AI', 'offline AI'],
   },
   pricing: {
     title: 'Pricing Plans',
     description: 'Choose the perfect ShadowTalk AI plan for your needs. Start free, upgrade anytime. Pro from $5/mo, Premium $15/mo, Elite $20/mo.',
     keywords: ['AI pricing', 'chatbot subscription', 'AI plans'],
   },
   chatbot: {
     title: 'AI Chat',
     description: 'Start chatting with ShadowTalk AI. Voice input, image generation, code execution, and 10+ specialized modes available.',
     keywords: ['AI chat', 'chatbot', 'AI assistant'],
   },
   docs: {
     title: 'Documentation',
     description: 'Learn how to use ShadowTalk AI effectively. Guides, tutorials, and API documentation.',
     keywords: ['documentation', 'guides', 'tutorials', 'API docs'],
   },
   about: {
     title: 'About Us',
     description: 'Learn about ShadowTalk AI, our mission, and the team behind the next-generation AI assistant.',
     keywords: ['about', 'team', 'mission', 'AI company'],
   },
   contact: {
     title: 'Contact Us',
     description: 'Get in touch with the ShadowTalk AI team. We are here to help with questions, feedback, and support.',
     keywords: ['contact', 'support', 'help', 'feedback'],
   },
   privacy: {
     title: 'Privacy Policy',
     description: 'Read our privacy policy to understand how ShadowTalk AI collects, uses, and protects your data.',
     keywords: ['privacy policy', 'data protection', 'GDPR'],
   },
   terms: {
     title: 'Terms of Service',
     description: 'Read our terms of service to understand the rules and guidelines for using ShadowTalk AI.',
     keywords: ['terms of service', 'terms and conditions', 'legal'],
   },
 };