import React from 'react';
import { 
  Library, 
  FileText, 
  Sparkles, 
  ArrowRight,
  MoveRight,
  Search,
  Check
} from 'lucide-react';
import Link from "next/link";

const FeatureLectureNotes = () => {
  return (
    <section className="py-24 bg-white text-slate-900">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* HEADER: Minimal & Bold */}
        <div className="max-w-3xl mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Seamless Workflow
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 mb-6">
            Study smarter.<br/>
            <span className="text-blue-500">Not harder.</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-xl font-medium">
            Your entire academic life, streamlined into one beautiful dashboard. No clutter, just focus.
          </p>
        </div>

        {/* THE CLEAN BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: THE HUB */}
          <div className="group relative rounded-[2rem] bg-white border border-slate-200 p-8 hover:border-blue-500 transition-all duration-300 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                <Library size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-2">The Hub</h3>
              <p className="text-slate-500 mb-8">
                Switch between video lectures and reading notes instantly.
              </p>
            </div>
            
            {/* Visual: Minimal List */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
               <div className="flex items-center justify-between">
                 <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                 <div className="h-4 w-4 rounded-full border-2 border-slate-200"></div>
               </div>
               <div className="flex items-center justify-between">
                 <div className="h-2 w-32 bg-blue-100 rounded-full"></div>
                 <div className="h-4 w-4 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                    <Check size={10} className="text-white"/>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                 <div className="h-4 w-4 rounded-full border-2 border-slate-200"></div>
               </div>
            </div>
          </div>

          {/* CARD 2: DEEP DIVE */}
          <div className="group relative rounded-[2rem] bg-white border border-slate-200 p-8 hover:border-blue-500 transition-all duration-300 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                <FileText size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Deep Focus</h3>
              <p className="text-slate-500 mb-8">
                Structured notes formatted for speed reading and retention.
              </p>
            </div>

            {/* Visual: Text Lines */}
            <div className="space-y-3 px-2">
              <div className="h-3 w-3/4 bg-slate-900 rounded-full"></div>
              <div className="h-2 w-full bg-slate-100 rounded-full"></div>
              <div className="h-2 w-full bg-slate-100 rounded-full"></div>
              <div className="h-2 w-2/3 bg-slate-100 rounded-full"></div>
              <div className="h-2 w-1/2 bg-blue-100 rounded-full mt-2"></div>
            </div>
          </div>

          {/* CARD 3: OMOLUABI GPT (Span 1 on mobile, 3 on large if needed, or stick to grid) */}
          <div className="md:col-span-2 lg:col-span-1 group relative rounded-[2rem] bg-slate-50 border border-slate-200 p-8 hover:border-blue-500 transition-all duration-300 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Sparkles size={24} className="text-blue-500" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-white px-2 py-1 rounded border border-blue-100">AI Powered</span>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">OmoluabiGPT</h3>
            <p className="text-slate-500 mb-auto">
              Stuck? Ask the AI. Generate quizzes or get explanations instantly.
            </p>

            {/* Visual: Minimal Chat Input */}
            <div className="mt-8 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex items-center gap-3 group-hover:shadow-md transition-shadow">
               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Sparkles size={14} className="text-slate-400"/>
               </div>
               <div className="flex-1 h-2 bg-slate-100 rounded-full w-24"></div>
               <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <ArrowRight size={14} className="text-white"/>
               </div>
            </div>
          </div>

        </div>

        {/* CTA BOTTOM */}
        <div className="mt-16 flex justify-start">
          <Link
          href="/dashboard"
           className="group flex items-center gap-3 text-lg font-bold text-slate-900 hover:text-blue-500 transition-colors">
            Start learning now 
            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
              <MoveRight size={16} />
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default FeatureLectureNotes;