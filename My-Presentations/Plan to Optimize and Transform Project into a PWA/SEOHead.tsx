import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

const SEOHead = ({
  title = 'ShadowTalk AI - Advanced AI Chatbot',
  description = 'Experience the next generation of AI conversations with ShadowTalk AI. Multimodal capabilities, voice input, image generation, and more.',
  keywords = 'AI, chatbot, artificial intelligence, gemini, GPT, voice assistant, image generation',
  ogImage = 'https://lovable.dev/opengraph-image-p98pqg.png',
  canonical,
}: SEOHeadProps) => {
  const location = useLocation();
  const baseUrl = 'https://shadowtalk.ai';
  const currentUrl = canonical || `${baseUrl}${location.pathname}`;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:image', ogImage, true);

    // Twitter tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);
  }, [title, description, keywords, ogImage, currentUrl]);

  return null;
};

export default SEOHead;

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'ShadowTalk AI - Advanced AI Chatbot with Multimodal Capabilities',
    description: 'Experience the next generation of AI conversations with ShadowTalk AI. Multimodal capabilities, voice input, image generation, collaborative chat rooms, and more.',
    keywords: 'AI chatbot, conversational AI, multimodal AI, voice assistant, image generation, AI chat, virtual assistant, collaborative AI',
  },
  chatbot: {
    title: 'AI Chatbot - ShadowTalk AI',
    description: 'Start conversing with our advanced AI chatbot. Powered by cutting-edge language models with voice input, image generation, and real-time responses.',
    keywords: 'AI chat, chatbot interface, conversational AI, AI assistant, real-time chat, voice chat',
  },
  pricing: {
    title: 'Pricing Plans - ShadowTalk AI',
    description: 'Choose the perfect plan for your AI chatbot needs. Flexible pricing options for individuals, teams, and enterprises.',
    keywords: 'AI chatbot pricing, subscription plans, AI assistant cost, chatbot plans, enterprise AI',
  },
  docs: {
    title: 'Documentation - ShadowTalk AI',
    description: 'Complete documentation and guides for ShadowTalk AI. Learn how to make the most of our advanced AI chatbot features.',
    keywords: 'AI chatbot documentation, user guide, API documentation, chatbot tutorial, AI assistant guide',
  },
  rooms: {
    title: 'Collaborative Chat Rooms - ShadowTalk AI',
    description: 'Join or create collaborative chat rooms with AI assistance. Work together with your team and our AI chatbot in real-time.',
    keywords: 'collaborative chat, team chat, AI collaboration, chat rooms, group chat with AI',
  },
  changelog: {
    title: 'Changelog - ShadowTalk AI',
    description: 'Stay updated with the latest features, improvements, and bug fixes in ShadowTalk AI.',
    keywords: 'changelog, updates, new features, release notes, version history',
  },
  auth: {
    title: 'Sign In - ShadowTalk AI',
    description: 'Sign in to your ShadowTalk AI account to access advanced AI chatbot features and collaborative tools.',
    keywords: 'sign in, login, authentication, user account, AI chatbot login',
  },
  profile: {
    title: 'Profile - ShadowTalk AI',
    description: 'Manage your ShadowTalk AI profile, preferences, and account settings.',
    keywords: 'user profile, account settings, preferences, profile management',
  },
};
