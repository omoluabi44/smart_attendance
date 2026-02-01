
import AttendanceDashboard from '@/app/ui/dashboard/verifyFace'
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your free account to access lecture note,flashcards, omoluabiGPT and past questions.',
 
};

export default function SignUpPage() {
  return (
    <main className='flex flex-col md:flex-row min-h-screen'>
       <AttendanceDashboard/>


   
    </main>
  );
}