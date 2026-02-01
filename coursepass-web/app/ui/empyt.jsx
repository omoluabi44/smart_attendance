"use client";
import {SparklesIcon} from "@heroicons/react/24/solid";
import {useRouter} from "next/navigation";

export default function EmptyActionState({
    title = "No Study Sets yet",
    description = "Generate your first AI quiz set to see it here.",
    buttonLabel = "Create New Set +",
    redirectUrl = "/dashboard/AI",
    onClick,
}) {
    const router = useRouter();

    const handleAction = () => {
        if (onClick) {
            onClick();
        } else {
            router.push(redirectUrl);
        }
    };

    return (
        <div className="group relative w-full h-60 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-colors duration-300">

            {/* 1. Background Blurs (Gen Z Glow) */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-400/20 blur-[50px] rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-500/30 transition-all duration-500"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-400/20 blur-[50px] rounded-full translate-x-1/2 translate-y-1/2 group-hover:bg-purple-500/30 transition-all duration-500"></div>

            {/* 2. Floating Animation Container */}
            <div className="animate-float flex flex-col items-center z-10">

                {/* CSS Art: Sleepy Cloud / Icon Box */}
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-100 to-purple-50 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-blue-500/10 group-hover:rotate-6 transition-transform duration-300">
                        <SparklesIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center animate-bounce delay-700">
                        <span className="text-[10px]">✨</span>
                    </div>
                    <div className="absolute -bottom-1 -left-2 w-4 h-4 bg-purple-100 rounded-full"></div>
                </div>

                {/* Text Content */}
                <h3 className="mt-4 text-sm font-black text-gray-800 tracking-tight">
                    {title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center font-medium">
                    {description}
                </p>
            </div>

            {/* 3. Action Button */}
            <button
                onClick={handleAction}
                className="mt-4 z-10 px-4 py-1.5 bg-gray-50 hover:bg-black hover:text-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 transition-all duration-300 active:scale-95"
            >
                {buttonLabel}
            </button>
        </div>
    );
}