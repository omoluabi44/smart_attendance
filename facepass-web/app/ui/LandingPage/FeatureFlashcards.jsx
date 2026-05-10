import React from 'react';
import { Zap, Repeat, Brain } from 'lucide-react';

const FeatureFlashcards = () => {
  return (
    <section className="py-24 bg-[#FAFAFA]">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center gap-12">
          
          {/* Visual: The Card Stack */}
          <div className="w-full md:w-1/2 relative h-[400px] flex items-center justify-center">
             {/* Abstract blobs */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-200 rounded-full blur-[80px] opacity-60"></div>

             {/* Cards */}
             <div className="relative w-64 h-80 perspective-1000">
                {/* Back Card */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-slate-200 transform rotate-[-10deg] scale-90 opacity-80 z-0"></div>
                {/* Middle Card */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-xl border border-slate-200 transform rotate-[-5deg] scale-95 z-10"></div>
                {/* Front Card (Active) */}
                <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl border border-blue-100 transform rotate-0 z-20 flex flex-col p-6 items-center justify-center text-center transition-transform hover:scale-105 cursor-pointer">
                   <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-4">CHM 102</div>
                   <h3 className="text-xl font-bold text-slate-900">What is the functional group of Alkanols?</h3>
                   <div className="mt-8 text-sm text-slate-400 font-medium">Tap to flip</div>
                </div>
             </div>
          </div>

          {/* Text Content */}
          <div className="w-full md:w-1/2">
             <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
               Hack your memory with <br/>
               <span className="text-blue-600 underline decoration-wavy decoration-blue-300">Spaced Repetition.</span>
             </h2>
             <p className="text-lg text-slate-600 mb-8">
               Cramming doesn't work. We schedule flashcards based on how well you know them, so you study less but remember more.
             </p>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                   <Zap className="text-yellow-500 shrink-0" />
                   <div>
                     <h4 className="font-bold text-slate-900">AI Generated</h4>
                     <p className="text-sm text-slate-500">Created automatically from your notes.</p>
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <Brain className="text-pink-500 shrink-0" />
                   <div>
                     <h4 className="font-bold text-slate-900">Smart Scheduling</h4>
                     <p className="text-sm text-slate-500">Focus only on what you're about to forget.</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeatureFlashcards;