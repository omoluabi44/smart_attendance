import React from 'react';
import { Bot, ArrowRight, FileText, CheckCircle } from 'lucide-react';

const FeatureAI = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Background Matrix/Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3341551a_1px,transparent_1px),linear-gradient(to_bottom,#3341551a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-transparent to-black"></div>

      <div className="container relative mx-auto px-6 lg:px-12 z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-6">
            <Bot size={16} /> Powered by OmoluabiGPT
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
            Turn your notes into <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient">
              playable games.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl">
            Upload your chaotic lecture scribbles. Our AI organizes them, solves the past questions buried inside, and generates a practice test instantly.
          </p>
        </div>

        {/* The Transformation Graphic */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent hidden md:block"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Step 1: Input */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 text-center relative z-10">
              <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <FileText className="text-slate-400" />
              </div>
              <h4 className="text-white font-bold">Your Rough Notes</h4>
              <p className="text-xs text-slate-500 mt-2">PDF, Image, or Text</p>
            </div>

            {/* Step 2: The Process (AI) */}
            <div className="relative z-10 flex flex-col items-center justify-center">
               <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] animate-pulse">
                 <Bot className="text-white w-10 h-10" />
               </div>
               <div className="mt-4 text-indigo-400 font-mono text-xs text-center">
                 Analyzing Context...<br/>Solving PQs...
               </div>
            </div>

            {/* Step 3: Output */}
            <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.15)] text-center relative z-10">
              <div className="w-16 h-16 mx-auto bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 border border-indigo-500">
                <CheckCircle className="text-indigo-400" />
              </div>
              <h4 className="text-white font-bold">Interactive Quiz</h4>
              <p className="text-xs text-slate-500 mt-2">Ready to play</p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureAI;