import LoginForm from '@/app/ui/auth/login-form';
import DashboardPreview from '@/app/ui/auth/DashboardPreview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faculty Sign In | FacePass',
  description: 'Sign in to the FacePass Lecturer Portal for smart attendance and course management.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <main className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAFA]">
      {/* Left Side: Minimalist Lecturer Auth Workspace */}
      <div className="flex flex-col justify-center flex-1 w-full lg:w-[52%] px-4 py-8 sm:px-6 sm:py-12 bg-[#FAFAFA] bg-vision-grid">
        <LoginForm />
      </div>

      {/* Right Side: Dashboard Preview */}
      <div className="hidden lg:flex lg:w-[48%] bg-obsidian-950 border-l border-slate-800">
        <DashboardPreview mode="login" />
      </div>
    </main>
  );
}
