import Image from "next/image";
import GoogleButton, {FaceBookButton} from "@/app/ui/OauthLogin"
export default function Oauth() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    //google authentication 
    const handleGoogle = () => {
        window.location.href = `${API_URL}auth/google/login`;
    };

    //Facebook authentication
    const handleFacebook = () => {
        window.location.href = `${API_URL}auth/facebook/login`;
    };
    return (
        <>

            <div className="flex items-center my-4 sm:my-6">
                <div className="flex-grow h-px bg-gray-300"></div>
                <span className="px-2 sm:px-4 text-gray-500 text-xs sm:text-sm"></span>
                <div className="flex-grow h-px bg-gray-300"></div>
            </div>
            <div className="flex flex-col  sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <div onClick={handleGoogle} className=" w-full items-center rounded-lg border border-gray-300">
                    <GoogleButton />
                </div>
                <div onClick={handleGoogle} className="w-full items-center rounded-lg border border-gray-300">
                    <FaceBookButton />
                </div>



            </div>
        </>

    )
}