import Registration from '@/app/ui/auth/registration';
import { Suspense } from 'react';
import DashboardPreview from '@/app/ui/auth/DashboardPreview'

export default function LoginPage() {
  return (
    <main className='flex justify-center items-center  bg-gray-50  min-h-screen ' >
      <div className=' flex-col  justify-center' >
        <Suspense>
          <Registration  />
        </Suspense>
      </div>
   
    </main>
  );
}