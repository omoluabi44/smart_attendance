import LoginForm from '@/app/ui/auth/login-form';
import DashboardPreview from '@/app/ui/auth/DashboardPreview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to access lecture note,flashcards, omoluabiGPT and past questions.',
  robots: {
    index: false, 
    follow: true, 
  },
};

export default function LoginPage() {
  return (
    <main className='flex flex-col md:flex-row min-h-screen'>
      
      {/* Left Side: The Form */}
      <div className='flex flex-col justify-center w-full md:w-1/2 px-6 py-12'>
        <LoginForm />
      </div>

      {/* Right Side: The Preview */}
      <div className='hidden md:flex flex-1 items-center justify-center bg-gray-50'>
        <DashboardPreview mode="login"/>
      </div>

    </main>
  );
}