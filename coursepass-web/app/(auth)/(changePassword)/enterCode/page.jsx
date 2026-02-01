import EnterCode from '@/app/ui/auth/entercode';
import { Suspense } from 'react';
import DashboardPreview from '@/app/ui/auth/DashboardPreview'

export default function LoginPage() {
  return (
    <main className='flex justify-center items-center  bg-gray-50  min-h-screen ' >
      <div className=' flex-col  justify-center' >
        <Suspense>
          <EnterCode  />
        </Suspense>
      </div>
   
    </main>
  );
}