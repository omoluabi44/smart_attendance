// import React from 'react';
// import Image from 'next/image';
// import FeatureLectureNotes from './FeatureLectureNotes';
// import FeaturePQ from './FeaturePQ';
// import FeatureAI from './FeatureAI';
// import FeatureFlashcards from './FeatureFlashcards';

// const BentoGrid = () => {
//   return (
//     <section className="relative py-24 bg-[#FAFAFA] overflow-hidden">
//       {/* Background Pattern - Dot Matrix */}
//       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

//       <div className="container relative mx-auto px-6 lg:px-12 z-10">

//         {/* Section Header */}
//         <div className="text-center max-w-3xl mx-auto mb-20">
//           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
//             <span className="relative flex h-2 w-2">
//               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
//               <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
//             </span>
//             <span className="text-sm font-medium text-slate-600">The Ultimate Study Stack</span>
//           </div>

//           <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tighter leading-[1.1]">
//             Everything you need to <br />
//             <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-gradient-x">
//               crush your papers.
//             </span>
//           </h2>
//           <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
//             Stop juggling five different apps. We combined the sickest study tools into one 
//             <span className="text-slate-900 font-semibold"> super-platform.</span>
//           </p>
//         </div>

//         {/* The Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)]">

//           {/* CARD 1: OmoluabiGPT (Main Feature - Spans 8 cols) */}
//           <div className="group relative col-span-1 md:col-span-8 row-span-2 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col md:flex-row">
//             {/* Hover Glow Effect */}
//             <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

//             <div className="relative z-10 p-10 flex flex-col justify-center md:w-[45%] shrink-0">
//               <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
//                 🤖
//               </div>
//               <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Meet OmoluabiGPT.</h3>
//               <p className="text-slate-500 leading-relaxed text-lg">
//                 Your personalized study partner. Generate MCQs from your notes, 
//                 explain complex concepts, and get answers that actually make sense.
//               </p>

//               <div className="mt-8 flex items-center gap-2 text-indigo-600 font-bold text-sm cursor-pointer group/link">
//                 Try the Demo 
//                 <span className="group-hover/link:translate-x-1 transition-transform">→</span>
//               </div>
//             </div>

//             {/* Visual Side */}
//             <div className="relative w-full md:w-[55%] bg-slate-50 border-l border-slate-100 overflow-hidden">
//                {/* Abstract UI representation if image fails or for added flair */}
//                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-multiply"></div>
//                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%]">
//                  {/* Replace with your image */}
//                  <Image 
//                    src="/omoluabi_interface.png" // Ensure this path is correct
//                    alt="Omoluabi Interface" 
//                    fill
//                    className="object-contain object-center drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-out"
//                  />
//                </div>
//             </div>
//           </div>

//           {/* CARD 2: Flashcards (Tall - Spans 4 cols) */}
//           <div className="group relative col-span-1 md:col-span-4 row-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-indigo-500/30 transition-all duration-500">
//             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

//             <div className="relative z-10 p-8 h-full flex flex-col">
//               <div className="flex justify-between items-start mb-4">
//                 <h3 className="text-2xl font-bold text-white tracking-tight">Smart <br/>Flashcards</h3>
//                 <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">New</span>
//               </div>
//               <p className="text-indigo-100 text-sm mb-8">Memorize definitions in seconds with active recall.</p>

//               {/* Visual: Floating Card Animation */}
//               <div className="flex-1 relative flex items-center justify-center perspective-1000">
//                   {/* Decorative Back Cards */}
//                   <div className="absolute w-40 h-52 bg-white/10 rounded-2xl rotate-12 scale-90 translate-x-4 border border-white/5" />
//                   <div className="absolute w-40 h-52 bg-white/20 rounded-2xl -rotate-6 scale-95 -translate-x-2 border border-white/5" />

//                   {/* Main Card */}
//                   <div className="relative w-40 h-52 bg-white rounded-2xl shadow-2xl rotate-3 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden border border-white/50 p-3">
//                      <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center flex-col gap-2">
//                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">?</div>
//                         <div className="w-16 h-2 bg-slate-200 rounded-full"></div>
//                         <div className="w-10 h-2 bg-slate-200 rounded-full"></div>
//                      </div>
//                   </div>
//               </div>
//             </div>
//           </div>

//           {/* CARD 3: Past Questions (Spans 4 cols) */}
//           <div className="group relative col-span-1 md:col-span-4 bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8">
//              <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-9xl leading-none text-slate-900 select-none z-0 rotate-12 translate-x-4 -translate-y-4">
//                PQ
//              </div>

//              <div className="relative z-10 flex flex-col h-full justify-between">
//                 <div>
//                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl mb-4 text-orange-600">
//                      📚
//                    </div>
//                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">The PQ Vault</h3>
//                    <p className="text-slate-500 text-sm">
//                      Access thousands of past questions from UNILAG, UI, OAU, and more.
//                    </p>
//                 </div>
//                 {/* Ticker Effect List */}
//                 <div className="mt-6 flex flex-col gap-2">
//                    {['GST 101', 'MTH 101', 'CHM 102'].map((item, i) => (
//                       <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:border-orange-200 transition-colors">
//                          <span className="text-xs font-bold text-slate-700">{item}</span>
//                          <span className="text-[10px] text-slate-400">PDF</span>
//                       </div>
//                    ))}
//                 </div>
//              </div>
//           </div>

//           {/* CARD 4: Lecture Notes (Spans 8 cols) */}
//           <div className="group relative col-span-1 md:col-span-8 bg-[#0F172A] rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
//              {/* Noise Texture */}
//              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

//              <div className="relative z-10 flex flex-col md:flex-row h-full items-center">
//                 {/* Text Content */}
//                 <div className="p-10 flex flex-col justify-center md:w-1/2">
//                    <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
//                      Reads like a book. <br/>
//                      <span className="text-emerald-400">Writes like a pro.</span>
//                    </h3>
//                    <p className="text-slate-400 mb-8 text-sm md:text-base">
//                      Complete lecture notes at your fingertips. No more copying from the board. 
//                      Highlight, annotate, and ask AI to explain.
//                    </p>
//                    <button className="self-start px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]">
//                      Browse Library
//                    </button>
//                 </div>

//                 {/* Visual: Note Mockup with Tilt */}
//                 <div className="w-full md:w-1/2 h-64 md:h-full relative mt-4 md:mt-0">
//                    <div className="absolute top-6 left-6 md:left-10 w-full h-full bg-slate-800 rounded-tl-2xl border-t border-l border-white/10 shadow-2xl group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500">
//                       {/* Inner screen content */}
//                       <div className="w-full h-full p-4 overflow-hidden">
//                           <div className="space-y-3 opacity-50">
//                              <div className="h-4 w-3/4 bg-slate-700 rounded-full"></div>
//                              <div className="h-4 w-1/2 bg-slate-700 rounded-full"></div>
//                              <div className="h-4 w-5/6 bg-slate-700 rounded-full"></div>
//                              <div className="h-32 w-full bg-slate-700/50 rounded-xl mt-4 border border-slate-600 border-dashed flex items-center justify-center">
//                                 <span className="text-slate-500 text-xs">AI Summary Block</span>
//                              </div>
//                           </div>
//                       </div>
//                    </div>
//                 </div>
//              </div>
//           </div>

//         </div>
//       </div>
//     </section>
//   );
// };

// export default BentoGrid;




import React from 'react';
// Make sure these paths match where you created the files!
import FeatureLectureNotes from './FeatureLectureNotes';
import FeaturePQ from './FeaturePQ';
import FeatureAI from './FeatureAI';
import FeatureFlashcards from './FeatureFlashcards';

const FeaturesSection = () => {
  return (
    <div id="features" className="flex flex-col bg-slate-50">
      
      {/* 1. The Notes Experience */}
      <FeatureLectureNotes />

      {/* 2. The AI Transformation (Dark Mode Break) */}
      <FeatureAI />

      {/* 3. The Practice Vault */}
      <FeaturePQ />

      {/* 4. The Flashcards (High Energy Finish) */}
      <FeatureFlashcards />

    </div>
  );
};

export default FeaturesSection;