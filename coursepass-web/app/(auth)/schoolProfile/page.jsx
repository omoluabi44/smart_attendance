import SchoolPofile from '@/app/ui/auth/schoolProfile';
import { Suspense } from 'react';
import DashboardPreview from '@/app/ui/auth/DashboardPreview'

export default function SchoolPofilePage() {
  return (
    <main className='flex justify-center items-center  bg-gray-50  min-h-screen ' >
      <div className=' flex-col  justify-center' >
        <Suspense>
          <SchoolPofile  />
        </Suspense>
      </div>
   
    </main>
  );
}