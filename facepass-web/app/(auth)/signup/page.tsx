import SignUPForm from '@/app/ui/auth/signUp';
import DashboardPreview from '@/app/ui/auth/DashboardPreview';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lecturer Registration | FacePass',
  description: 'Provision your lecturer account on FacePass for AI biometric attendance and course management.',
};

export default function SignUpPage() {
  return (
    <main className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAFA]">
      {/* Left Side: Minimalist Lecturer Registration Workspace */}
      <div className="flex flex-col justify-center w-full lg:w-[52%] px-6 py-12 bg-[#FAFAFA] bg-vision-grid">
        <SignUPForm />
      </div>

      {/* Right Side: Dark Obsidian Biometric Telemetry Preview */}
      <div className="hidden lg:flex lg:w-[48%] bg-obsidian-950 border-l border-slate-800">
        <DashboardPreview mode="signup" />
      </div>
    </main>
  );
}
