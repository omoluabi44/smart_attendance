import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { roboto, montserrat } from '@/app/ui/fonts';
import Image from 'next/image'

export default function CourspassLogo() {
  return (
    <div className='w-full flex flex-row justify-center gap-2 items-center'>
      <Image
        src="/logo.png"
        width={40}
        height={100}
        className="hidden  md:block bg-base"
        alt="Screenshots of the dashboard project showing desktop version"
      />
           <Image
        src="/logo.png"
        width={30}
        height={30}
        className="block den md:hidden bg-base"
        alt="Screenshots of the dashboard project showing mobile version"
      />
      <p className={`${montserrat.className} text-l sm:text-xl md:text-2xl text-blue-500 font-bold  `} >CoursePass</p>

    </div>

  );
}
