import React from 'react';
import Image from 'next/image';
import { montserrat } from "@/app/ui/fonts";
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="container mx-auto px-6 lg:px-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Coursepass Logo"
                width={32}
                height={32}
              />
              <span className={`${montserrat.className} text-xl font-bold text-slate-900 tracking-tight`}>
                <h1 className='text-blue-500'> CoursePass</h1>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              The all-in-one study platform for Nigerian university students. Ace your exams without the stress.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/omoluabi" className="hover:text-blue-500 transition-colors">OmoluabiGPT</Link></li>
              <li><Link href="/past-questions" className="hover:text-blue-500 transition-colors">Past Questions</Link></li>
              <li><Link href="/notes" className="hover:text-blue-500 transition-colors">Lecture Notes</Link></li>
            </ul>
          </div>

          {/* Support Links - ADDED CONTACT HERE */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/contact" className="hover:text-blue-500 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-blue-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <a href="https://twitter.com/coursepass_app" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                  Twitter (X)
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links - FIXED CASING HERE */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-blue-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-500 transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Coursepass. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Made with ❤️ in <span className="text-green-600">Lagos</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;