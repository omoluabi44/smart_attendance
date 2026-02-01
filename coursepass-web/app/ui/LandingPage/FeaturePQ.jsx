import React from 'react';
import { BookOpen, Target, Clock, Trophy } from 'lucide-react';

const FeaturePQ = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6 lg:px-12">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Master the Past Questions.</h2>
          <p className="text-slate-600">Don't just practice blindly. Choose a mode that fits your mood.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Mode 1: Study Mode */}
          <div className="group bg-white p-8 rounded-[2rem] border border-slate-200 hover:border-blue-400 transition-all hover:shadow-xl hover:-translate-y-2">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="text-blue-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Zen Study</h3>
            <p className="text-slate-500 mb-6 text-sm">No timers. No pressure. Just you, the questions, and detailed AI explanations for every answer.</p>
            {/* Mini UI Representation */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
               <div className="flex gap-2 mb-2">
                 <span className="h-2 w-2 rounded-full bg-green-500"></span>
                 <span className="text-[10px] text-green-600 font-bold">Correct!</span>
               </div>
               <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
               <div className="h-12 bg-blue-50 rounded border border-blue-100 p-2 text-[10px] text-blue-800 leading-tight">
                 Correct because Option A violates Newton's...
               </div>
            </div>
          </div>

          {/* Mode 2: Practice Mode */}
          <div className="group bg-white p-8 rounded-[2rem] border border-slate-200 hover:border-orange-400 transition-all hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
              <Target className="text-orange-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 relative z-10">Speed Practice</h3>
            <p className="text-slate-500 mb-6 text-sm relative z-10">Rapid fire. Get instant feedback. Build your muscle memory for the common questions.</p>
             {/* Decorative Background */}
            <div className="absolute right-0 bottom-0 opacity-5">
               <Target size={150} />
            </div>
          </div>

          {/* Mode 3: Exam Mode */}
          <div className="group bg-slate-900 p-8 rounded-[2rem] border border-slate-800 hover:border-red-500 transition-all hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-700">
              <Clock className="text-red-500" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Exam Simulator</h3>
            <p className="text-slate-400 mb-6 text-sm">Real conditions. Strict timer. No feedback until you submit. Are you actually ready?</p>
            {/* Timer UI */}
            <div className="flex items-center justify-center bg-slate-800 rounded-xl py-3 border border-red-500/30">
               <span className="font-mono text-red-400 font-bold text-lg animate-pulse">00:45:21</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default FeaturePQ;