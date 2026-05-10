import SignUPForm from '@/app/ui/auth/signUp';
import DashboardPreview from '@/app/ui/auth/DashboardPreview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free account to access lecture note,flashcards, omoluabiGPT and past questions.',
 
};

export default function SignUpPage() {
  return (
    <main className='flex flex-col md:flex-row min-h-screen'>
      
      {/* Left Side: The Form */}
      <div className='flex flex-col justify-center w-full md:w-1/2 px-6 py-12'>
        <SignUPForm />
      </div>

      {/* Right Side: The Preview */}
      <div className='hidden md:flex flex-1 items-center justify-center bg-gray-50'>
        <DashboardPreview mode="login"/>
      </div>

    </main>
  );
}