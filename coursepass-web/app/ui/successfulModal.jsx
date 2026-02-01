
import {  CheckCircleIcon, XCircleIcon } from "@heroicons/react/20/solid";
import {useState} from "react";
import Image from "next/image";
import Link from "next/link";

import {montserrat} from "@/app/ui/fonts";
import {ClipLoader} from "react-spinners";


export default function Modal ({successful, onClose}){
    return(
<div className="flex min-h-screen items-center justify-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-md p-4 sm:p-6 md:p-8 lg:p-10">


        <div className="relative flex items-center mb-10 justify-center">
            {/* Outer glow circle */}
            <div className={`absolute z-0 w-24 h-24 rounded-full ${ successful?  `bg-green-500`: `bg-red-500`} blur-2xl opacity-40`}></div>
            <div className={`absolute w-20 h-20 rounded-full ${ successful? `bg-green-600`: `bg-red-600` } blur-lg opacity-60`}></div>

            {/* Inner circle */}
            <div className={`flex z-10 items-center justify-center w-16 h-16 rounded-full ${successful ? `bg-green-600`:`bg-red-600`}  shadow-lg`}>
              {successful ?  <CheckCircleIcon className="h-10 w-10 text-white" />  : <XCircleIcon className="h-10 w-10 text-white" />}
            </div>


        </div>
          {successful ? 
           <div className="text-center mb-6 sm:mb-8">
            
            
            <p
                className={`${montserrat.className} text-green-500 text-xl sm:text-2xl md:text-3xl  font-bold`}
            >
                
                Succeful
            </p>
            <p
                className={`${montserrat.className} text-xs sm:text-sm  text-gray-600`}
            >
                Password change successful
            </p>
        </div>
            :
             <div className="text-center mb-6 sm:mb-8">
            
            
            <p
                className={`${montserrat.className} text-red-500 text-xl sm:text-2xl md:text-3xl  font-bold`}
            >
                
                Failed
            </p>
            <p
                className={`${montserrat.className} text-xs sm:text-sm  text-gray-600`}
            >
                Password change  not successful
            </p>
        </div>
            }
       

        <div>
            <form className="space-y-4 sm:space-y-6">
                {successful ?
                <div className="flex items-center justify-center">
                    <Link
                        href="login"
                        type="submit"
                        className={`w-full  rounded-lg bg-blue-500 hover:bg-blue-600  px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition`}
                      
                    >

                        <p className=" text-center">Sign In</p>
                    </Link>
                </div>
                :
                <div className="flex items-center justify-center">
                    <Link

                       
                       href="enterEmail" 
                        type="submit"
                        className={`w-full  rounded-lg bg-blue-500 hover:bg-blue-600  px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white transition`}
                      
                    >

                        <p className=" text-center">Back </p>
                    </Link>
                </div>
                }
                
            </form>
        </div>
    </div>
</div>
    )
}



