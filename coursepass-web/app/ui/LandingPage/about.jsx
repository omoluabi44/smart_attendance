import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'About Us | Coursepass',
  description: 'Redefining how Nigerian university students study with OmoluabiGPT.',
};

export default function AboutPage() {
  return (
    <main className="bg-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-blue-600 py-20 px-6 sm:px-12 lg:px-20 text-center overflow-hidden">
        {/* Decorative background circle (Optional) */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            Learning Made Smarter, <br className="hidden sm:block" />
            <span className="text-blue-200">Not Harder.</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto mb-8 leading-relaxed">
            We are redefining how Nigerian university students study, prepare, and succeed using the power of AI.
          </p>
          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <Link 
              href="/auth/register" 
              className="bg-white text-blue-700 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <Link 
              href="/contact" 
              className="border border-white text-white font-medium py-3 px-8 rounded-full hover:bg-blue-700 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE STORY & MISSION */}
      <section className="py-16 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Our Story</h2>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Born from the Campus Struggle</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Coursepass was born out of a simple observation: <strong>Nigerian students work incredibly hard, but the tools available to them haven&apos;t evolved.</strong>
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              From hunting down physical past questions to reading endless pages of handouts, the process is often inefficient. We asked a simple question: <em>&quot;What if your study materials could talk back to you?&quot;</em>
            </p>
            <p className="text-gray-600 leading-relaxed">
              What started as a project to digitalize past questions has grown into a comprehensive AI-powered study companion.
            </p>
          </div>
          {/* Placeholder for an image (e.g., students studying) */}
          <div className="bg-gray-200 rounded-2xl h-80 w-full flex items-center justify-center relative overflow-hidden shadow-lg">
             {/* Use <Image /> here if you have assets */}
             <span className="text-gray-400 font-medium">Image: Students Studying or App Interface</span>
          </div>
        </div>
      </section>

      {/* 3. OMOLUABIGPT FEATURE HIGHLIGHT */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold mb-6">
            Meet Our AI Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">OmoluabiGPT</span>
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-12">
            Unlike generic AI, OmoluabiGPT understands the context of Nigerian lecture notes and exam patterns. It doesn&apos;t just summarize; it teaches.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload & Convert</h3>
              <p className="text-gray-600 text-sm">Simply upload a handout or PDF, and watch it transform into summary notes instantly.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generate Quizzes</h3>
              <p className="text-gray-600 text-sm">Turn any topic into MCQs or Theory questions to test your knowledge before the exam.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Flashcards</h3>
              <p className="text-gray-600 text-sm">Master definitions and complex concepts with auto-generated flashcards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISION / FOOTER CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
          <p className="text-lg text-gray-600 mb-8">
            We envision a future where no student fails a course due to a lack of resources or guidance. 
            We are committed to setting a new standard for EdTech in Nigeria.
          </p>
          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 mb-4">Are you a School Administrator?</p>
            <Link href="/contact" className="text-blue-600 font-semibold hover:underline">
              Partner with Coursepass &rarr;
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}