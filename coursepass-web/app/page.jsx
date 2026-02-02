import React from 'react';
import { Camera, ShieldCheck, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function FacePassLanding() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-blue-500">facePass</div>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="#features" className="hover:text-blue-500 transition">Features</Link>
          <Link href="#how-it-works" className="hover:text-blue-500 transition">How it Works</Link>
        </div>
        <Link href="/signup" className="bg-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-600 transition  shadow-blue-200">
         Sign Up
        </Link>
          <Link href="/login" className="bg-white text-blue-500 px-6 py-2 rounded-full font-semibold hover:bg-blue-600 border-2 border-slate-200 transition shadow-blue-200">
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <header className="px-8 pt-16 pb-24 max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-blue-500 uppercase bg-blue-50 rounded-full">
            The Future of University Attendance
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Attendance made <span className="text-blue-500">seamless</span> via AI.
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-xl">
            Eliminate manual registers and "signing for friends." facePass uses 
            advanced facial recognition to help lecturers manage 100+ students in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link  href="/signup" className="bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-600 transition-all transform hover:scale-105">
              Launch facePass
            </Link>
            <Link href="/signup" className="border-2 border-slate-200 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition">
              Watch Demo
            </Link>
          </div>
        </div>
        
        {/* Placeholder for a Visual/Dashboard Mockup */}
        <div className="flex-1 w-full max-w-lg aspect-square bg-blue-50 rounded-3xl border-2 border-blue-100 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-200/40 via-transparent to-transparent"></div>
          <Camera size={120} className="text-blue-500 opacity-20" />
          <div className="absolute bottom-6 left-6 right-6 bg-white p-4 rounded-2xl shadow-xl border border-blue-100 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Grid */}
      <section id="features" className="bg-slate-50 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Designed for the Modern Lecturer</h2>
            <p className="text-slate-600">Smart solutions for massive classrooms.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-blue-500" />}
              title="Instant Verification"
              desc="Scan and verify students in real-time as they enter the lecture hall."
            />
            <FeatureCard 
              icon={<Users className="text-blue-500" />}
              title="100+ Student Support"
              desc="Optimized for large Nigerian university classes with high accuracy."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-blue-500" />}
              title="Fraud Prevention"
              desc="Ensures only students physically present are marked as attended."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}