'use client'
import React,{useState} from 'react';
import Image from 'next/image'
import Link from 'next/link';
import Cookies from "js-cookie";
import {useAppSelector} from "@/app/lib/hooks";

const HeroSection = () => {
   
     const id = useAppSelector((state) => state.user.isLoggedIn);
    
    return (
        <section className="relative w-full overflow-hidden bg-bases pt-32 pb-20 lg:pt-48 lg:pb-32">
            {/* Background Decor: Soft Blue Mesh Gradient using your blue-400 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* LEFT: Text Content */}
                    <div className="flex-1 text-center lg:text-left animate-fade-in-up">

                        {/* Pill Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <span className="text-sm font-medium text-blue-600 tracking-wide lowercase">
                                Join 2,000+ students winning
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                            First Class is <br />
                            <span className="text-blue-500">easy</span> with <span className="relative whitespace-nowrap">
                                CoursePass
                                {/* Underline decoration */}
                                <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-400 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
                                </svg>
                            </span>.
                        </h1>

                        {/* Subtext */}
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Stop stressing over handwritten notes. Get instant access to lecture materials, past questions, and
                            <span className="font-semibold text-slate-800"> OmoluabiGPT</span>—your personal AI tutor.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <Link
                            prefetch={false}
                            href={id ? "/dashboard":"/signup"}
                           
                             className="w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30">
                                {id ? "Dashboard":"Join CoursePass"}
                            </Link>
                            <Link
                           prefetch={false}
                            href={id ? "/dashboard/AI":"/signup"}
                            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-medium transition-all hover:border-blue-200">
                                View Demo
                            </Link>
                        </div>

                        {/* Social Proof Text */}
                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex -space-x-3">
                                {/* Placeholder Avatars */}
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-300" />
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">
                                Trusted by students from <span className="font-semibold text-slate-800">LASUSTECH, UNILAG, & OAU</span>
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Visual (Phone Mockup) */}
                    <div className="flex-1 relative w-full max-w-md lg:max-w-full flex justify-center lg:justify-end animate-float delay-700">
                        {/* Background Blob behind phone */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-3xl -z-10" />

                        {/* CSS Phone Mockup */}
                        <div className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] rounded-[2.5rem] h-[600px] w-[320px] shadow-2xl shadow-blue-900/20 rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[15px] top-[72px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[15px] top-[124px] rounded-s-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[15px] top-[178px] rounded-s-lg"></div>
                            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[15px] top-[142px] rounded-e-lg"></div>

                            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-bases relative">
                                {/* Your Omoluabi Chat Image */}
                                <Image
                                    src="/homeScreen.jpg"
                                    alt="OmoluabiGPT Interface"
                                    className="w-full h-full object-cover"
                                    width={600}  
                                    height={1200}
                                />
                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-bases to-transparent pointer-events-none" />
                            </div>
                        </div>

                        {/* Floating Decoration */}
                        <div className="absolute top-20 -right-4 lg:-right-12 bg-bases p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce delay-1000">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl">
                                    🎉
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Exam Status</p>
                                    <p className="text-sm font-bold text-slate-800">Ready to Ace!</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;