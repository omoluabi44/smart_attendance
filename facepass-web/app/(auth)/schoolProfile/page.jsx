import SchoolPofile from '@/app/ui/auth/schoolProfile';
import { Suspense } from 'react';
import DashboardPreview from '@/app/ui/auth/DashboardPreview';

export default function SchoolPofilePage() {
  return (
    <main className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAFA]">
      {/* Left Side: Institutional Mapping Form */}
      <div className="flex flex-col justify-center w-full lg:w-[52%] px-6 py-12 bg-[#FAFAFA] bg-vision-grid">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12 text-xs font-mono text-slate-500">
              INITIALIZING INSTITUTIONAL REGISTRY...
            </div>
          }
        >
          <SchoolPofile />
        </Suspense>
      </div>

      {/* Right Side: Dark Obsidian Biometric Telemetry Preview */}
      <div className="hidden lg:flex lg:w-[48%] bg-obsidian-950 border-l border-slate-800">
        <DashboardPreview mode="profile" />
      </div>
    </main>
  );
}
