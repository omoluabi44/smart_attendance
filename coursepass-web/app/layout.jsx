if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = require('resize-observer-polyfill').default;
}
import '@/app/ui/global.css';
import { inter, montserrat, roboto } from '@/app/ui/fonts';
import StoreProvider from './StoreProvider';
import ClientToasts from "@/app/ui/ClientToasts";
import 'katex/dist/katex.min.css';
import Script from 'next/script'; 


const productionUrl = new URL('https://www.coursepass.app');

export const metadata = {
  metadataBase: productionUrl,
  title: {
    default: 'CoursePass | All the tools you need to succeed academically.',
    template: '%s | CoursePass',
  },
  description: 'Achieve first-class results effortlessly with CoursePass. Access lecture materials, past questions, and OmoluabiGPT—your personal AI tutor.',
  icons: {
    icon: '/icon.png', 
    shortcut: '/icon.png',
    apple: '/icon.png', 
  },


  openGraph: {
    title: 'CoursePass | All the tools you need to succeed academically.',
    description: 'Achieve first-class results effortlessly with CoursePass. Access lecture materials, past questions, and OmoluabiGPT—your personal AI tutor.',
    url: 'https://www.coursepass.app',
    siteName: 'CoursePass',
    images: [
      {
        url: '/ogimage.jpg',
        width: 1200,
        height: 630,
        alt: 'CoursePass logo and educational background',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'CoursePass | All the tools you need to succeed academically.',
    description: "Achieve first-class results effortlessly with CoursePass. Access lecture materials, past questions, and OmoluabiGPT—your personal AI tutor.",
    creator: '@omoluabi_jnr', 
    images: ['/ogimage.jpg'],
  },
};


const sitelinksSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "CoursePass",
  "url": "https://www.coursepass.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.coursepass.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "hasPart": [
    {
      "@type": "SiteNavigationElement",
      "name": "Login",
      "url": "https://www.coursepass.app/login",
      "description": "Access your student dashboard and past questions."
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Sign Up",
      "url": "https://www.coursepass.app/signup",
      "description": "Create a free account to start studying smarter."
    },
    {
      "@type": "SiteNavigationElement",
      "name": "About Us",
      "url": "https://www.coursepass.app/about",
      "description": "Learn about OmoluabiGPT and our mission."
    }
  ]
};

// ----------------------------------------------------
// 3. ROOT LAYOUT COMPONENT
// ----------------------------------------------------
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${montserrat.variable} ${roboto.variable} antialiased`}>
        
        {/* ✅ GOOGLE ADSENSE (Optimized) */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1225706757909237"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* ✅ SITELINKS SCHEMA (Injected via Script) */}
        <Script
          id="sitelinks-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksSchema) }}
          strategy="beforeInteractive" // Loads early so bots see it immediately
        />

        <StoreProvider>
          {children}
          <ClientToasts />
        </StoreProvider>
      </body>
    </html>
  );
}