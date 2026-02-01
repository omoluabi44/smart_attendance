'use client'; // Needed for the mobile menu state
import React, {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {useAppSelector} from "@/app/lib/hooks";
import {montserrat} from "@/app/ui/fonts";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const id = useAppSelector((state) => state.user.isLoggedIn);
    console.log(id);
    

    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex items-center justify-between h-20">

                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-10 h-10 transition-transform group-hover:rotate-12">
                            {/* Replace with your actual logo path */}
                            <Image
                                src="/logo.png"
                                alt="Coursepass Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <span  className={`${montserrat.className}  text-xl font-bold text-slate-900 tracking-tight`}>
                           <h1 className='text-blue-500'> CoursePass</h1>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {/* <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors">
                            Features
                        </Link> */}
                        <Link
                            href={id ? "/dashboard/AI" : "/signup"}
                            prefetch={false}
                            className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors flex items-center gap-2">
                            OmoluabiGPT
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-wide">
                                New
                            </span>
                        </Link>
                        {/* <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors">
                            Pricing
                        </Link> */}
                         <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors">
                            About Us
                        </Link>
                    </div>

                    {/* CTA Button */}
                    <div className="hidden md:block">
                        <Link 
                        href={id ? "/dashboard" : "/signup"}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all hover:scale-105">
                            {id ? "Dashboard" : " Get Started"}
                        </Link>
                    </div>

                    {/* Mobile Menu Button (Hamburger) */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 text-slate-600 hover:text-blue-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-white border-b border-slate-100 p-4 absolute w-full shadow-xl">
                    <div className="flex flex-col gap-4">
                        <Link href="#" className="text-slate-600 font-medium">Features</Link>
                        <Link prefetch={false}  href={id ? "/dashboard/AI" : "/signup"} className="text-slate-600 font-medium">OmoluabiGPT</Link>
                        <Link href="#" className="text-slate-600 font-medium">Pricing</Link>
                        <Link prefetch={false}  href={id ? "/dashboard" : "/signup"} className="text-center py-3 bg-blue-500 text-white font-bold rounded-xl">
                           {id?"Dashboard":" Get Started"}
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};


export default Navbar;
