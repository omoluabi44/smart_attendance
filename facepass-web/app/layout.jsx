if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = require('resize-observer-polyfill').default;
}
import '@/app/ui/global.css';
import { roboto } from '@/app/ui/fonts';
import StoreProvider from './StoreProvider';
import ClientToasts from '@/app/ui/ClientToasts';
import 'katex/dist/katex.min.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata = {
  title: {
    default: 'FacePass | Smart Attendance, Course Materials & Classroom Platform',
    template: '%s | FacePass Lecturer Portal',
  },
  description:
    'All-in-one university lecturer platform: instant classroom attendance, course material distribution, scheduled quizzes, automated grading, and 75% exam eligibility auditing.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'FacePass | Smart Attendance, Course Materials & Classroom Platform',
    description:
      'Verify 100+ students in seconds, share lecture materials directly with enrolled students, schedule quizzes, and audit 75% exam eligibility.',
    siteName: 'FacePass',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`scroll-smooth ${roboto.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${roboto.className} ${roboto.variable} font-sans antialiased bg-[#FAFAFA] text-slate-900 selection:bg-blue-500/20 selection:text-blue-900 overflow-x-hidden`}
      >
        <StoreProvider>
          {children}
          <ClientToasts />
        </StoreProvider>
      </body>
    </html>
  );
}
