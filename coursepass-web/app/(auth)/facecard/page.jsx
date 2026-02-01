
import { Suspense } from 'react';
import FaceCardUpload from '../../ui/auth/FaceCardUpload'

export default function LoginPage() {
  return (
    <main className='flex justify-center items-center  bg-gray-50  min-h-screen ' >
      <div className=' flex-col  justify-center' >
        <Suspense>
          <FaceCardUpload  />
        </Suspense>
      </div>
   
    </main>
  );
}