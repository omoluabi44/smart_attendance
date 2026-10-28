if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = require('resize-observer-polyfill').default;
}
import '@/app/ui/global.css';
import { roboto } from '@/app/ui/fonts';
import StoreProvider from './StoreProvider';
import ClientToasts from '@/app/ui/ClientToasts';
import 'katex/dist/katex.min.css';

export const metadata = {
  title: {
    default: 'FacePass | AI Lecturer Command, Computer Vision Attendance & Classroom Platform',
    template: '%s | FacePass Lecturer OS',
  },
  description:
    'All-in-one university lecturer platform powered by a precision 1:N Computer Vision Engine: instant classroom attendance, course material distribution, scheduled quizzes, automated grading, and 75% exam eligibility auditing.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'FacePass | AI Lecturer Command, Computer Vision Attendance & Classroom Platform',
    description:
      'Verify 100+ students in seconds via Computer Vision, share lecture materials directly with enrolled students, schedule quizzes, and audit 75% exam eligibility.',
    siteName: 'FacePass',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`scroll-smooth ${roboto.variable}`}>
      <body
        className={`${roboto.className} ${roboto.variable} font-sans antialiased bg-[#FAFAFA] text-slate-900 selection:bg-blue-500/20 selection:text-blue-900`}
      >
        <StoreProvider>
          {children}
          <ClientToasts />
        </StoreProvider>
      </body>
    </html>
  );
}
