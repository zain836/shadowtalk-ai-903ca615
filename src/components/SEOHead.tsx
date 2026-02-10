 import { Helmet } from 'react-helmet-async';
 import { PageMeta, generateMetaTags, getOrganizationSchema } from '@/lib/seo';
 
 interface SEOHeadProps {
   meta: PageMeta;
   structuredData?: Record<string, unknown>;
 }
 
 export function SEOHead({ meta, structuredData }: SEOHeadProps) {
   const tags = generateMetaTags(meta);
   const baseUrl = 'https://www.shadowtalk-ai.com';
 
   return (
     <Helmet>
       {/* Primary Meta Tags */}
       <title>{tags.title}</title>
       <meta name="description" content={tags.description} />
       {tags.keywords && <meta name="keywords" content={tags.keywords} />}
       <meta name="robots" content={tags.robots} />
       <link rel="canonical" href={meta.canonical || baseUrl} />
 
       {/* Open Graph */}
       <meta property="og:type" content={tags['og:type']} />
       <meta property="og:title" content={tags['og:title']} />
       <meta property="og:description" content={tags['og:description']} />
       <meta property="og:image" content={tags['og:image']} />
       <meta property="og:url" content={tags['og:url']} />
       <meta property="og:site_name" content="ShadowTalk AI" />
 
       {/* Twitter */}
       <meta name="twitter:card" content={tags['twitter:card']} />
       <meta name="twitter:title" content={tags['twitter:title']} />
       <meta name="twitter:description" content={tags['twitter:description']} />
       <meta name="twitter:image" content={tags['twitter:image']} />
       <meta name="twitter:site" content="@ShadowTalkAI" />
 
       {/* Structured Data */}
       <script type="application/ld+json">
         {JSON.stringify(getOrganizationSchema())}
       </script>
       {structuredData && (
         <script type="application/ld+json">
           {JSON.stringify(structuredData)}
         </script>
       )}
     </Helmet>
   );
 }
 
 export default SEOHead;