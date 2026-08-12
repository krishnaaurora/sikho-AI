import React from "react";
import { Check } from "lucide-react";

const StudentOverview = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-[#FDFBFF] to-white dark:from-slate-950 dark:to-slate-900 border-b border-slate-200/60 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center bg-[#F3E8FF]/30 dark:bg-slate-900/20 rounded-3xl p-6 sm:p-12 border border-[#E9D5FF]/60 dark:border-slate-800 shadow-xl">
        
        {/* Title branding inside the section */}
        <div className="w-full flex justify-between items-center mb-8 border-b border-[#E9D5FF]/40 pb-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SikhoAI" className="h-8 w-auto object-contain" />
            <div className="text-left">
              <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight leading-none block">SikhoAI</span>
              <span className="text-[9px] text-slate-450 font-bold mt-0.5 block">Your AI Learning Workspace</span>
            </div>
          </div>
        </div>

        {/* Orbit paths - SVG rings behind cards */}
        <svg className="absolute inset-0 w-full h-full text-purple-200/50 dark:text-slate-800/40 pointer-events-none hidden lg:block" viewBox="0 0 1000 600">
          <circle cx="500" cy="300" r="160" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="500" cy="300" r="260" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        </svg>

        {/* Responsive Grid of Cards wrapping the center Student image */}
        <div className="w-full grid lg:grid-cols-12 gap-8 items-center relative min-h-[460px]">
          
          {/* Left Column Cards (Learn, Prepare, Create) */}
          <div className="lg:col-span-4 space-y-6 z-20">
            {/* 1. Learn Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 text-sm">📚</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Learn</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1 mb-4">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-500" /> AI Tutor</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-500" /> Interactive Lessons</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-500" /> Concept Explanations</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-500" /> Notes & Flashcards</li>
              </ul>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold">
                <span className="text-indigo-650 dark:text-indigo-400">Deep Explanation</span>
                <span className="text-slate-450">$0.002 • x402</span>
              </div>
            </div>

            {/* 2. Prepare Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 text-sm">📝</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Prepare</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1 mb-4">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Mock Tests</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Aptitude & CRT</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Coding Assessments</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-emerald-500" /> Detailed Analytics</li>
              </ul>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold">
                <span className="text-emerald-600">Personalized Mock Test</span>
                <span className="text-slate-450">$0.005 • x402</span>
              </div>
            </div>

            {/* 3. Create Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 text-sm">✏️</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Create</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1 mb-4">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500" /> PPTs & Presentations</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500" /> Study Notes</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500" /> Diagrams & Mind Maps</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-500" /> Reports & Summaries</li>
              </ul>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold">
                <span className="text-amber-650 dark:text-amber-450">Generate Presentation</span>
                <span className="text-slate-450">$0.005 • x402</span>
              </div>
            </div>
          </div>

          {/* Center Column (Student Illustration) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center relative min-h-[300px] z-10">
            {/* Glowing Backdrop Circle */}
            <div className="absolute w-72 h-72 rounded-full bg-purple-300/30 dark:bg-purple-950/20 blur-[50px] pointer-events-none" />
            <img 
              src="/student_using_laptop.png" 
              alt="SikhoAI Student" 
              className="w-full max-w-[280px] h-auto object-contain relative z-10 drop-shadow-xl"
            />
          </div>

          {/* Right Column Cards (Build, Career, Research) */}
          <div className="lg:col-span-4 space-y-6 z-20">
            {/* 4. Build Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 text-sm">💻</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Build</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1 mb-4">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-500" /> Online Code Editor</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-500" /> Run & Debug Code</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-500" /> Projects & Templates</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-blue-500" /> GitHub Integration</li>
              </ul>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold">
                <span className="text-blue-650 dark:text-blue-400">Deep Code Review</span>
                <span className="text-slate-450">$0.005 • x402</span>
              </div>
            </div>

            {/* 5. Career Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 text-sm">💼</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Career</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1 mb-4">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-rose-500" /> Resume Analysis</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-rose-500" /> Job Matching</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-rose-500" /> Mock Interviews</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-rose-500" /> Career Roadmaps</li>
              </ul>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold">
                <span className="text-rose-650 dark:text-rose-400">Detailed Job Match</span>
                <span className="text-slate-450">$0.005 • x402</span>
              </div>
            </div>

            {/* 6. Research Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-4 shadow-md transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 text-sm">🔬</div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Research</h3>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold pl-1 mb-4">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-purple-500" /> Paper Analysis</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-purple-500" /> Literature Review</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-purple-500" /> Compare Papers</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-purple-500" /> Research Gap Finder</li>
              </ul>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-900 text-[9px] font-bold">
                <span className="text-purple-650 dark:text-purple-400">Multi-paper Analysis</span>
                <span className="text-slate-450">$0.010 • x402</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Horizontal Features Bar inside layout */}
        <div className="w-full grid grid-cols-2 md:grid-cols-5 gap-4 pt-8 border-t border-[#E9D5FF]/40 mt-12 text-slate-800 dark:text-slate-200">
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-xl">🎯</span>
            <span className="text-[10px] font-black mt-2 leading-none block">Personalized Learning Paths</span>
            <span className="text-[8px] text-slate-450 mt-1 leading-tight font-semibold">Tailored to your goals</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-xl">📈</span>
            <span className="text-[10px] font-black mt-2 leading-none block">Track Progress</span>
            <span className="text-[8px] text-slate-450 mt-1 leading-tight font-semibold">Visualize your learning</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-xl">🛡️</span>
            <span className="text-[10px] font-black mt-2 leading-none block">AI Assistance</span>
            <span className="text-[8px] text-slate-450 mt-1 leading-tight font-semibold">24/7 AI support</span>
          </div>
          <div className="flex flex-col items-center text-center p-2">
            <span className="text-xl">🔒</span>
            <span className="text-[10px] font-black mt-2 leading-none block">Pay-per-use</span>
            <span className="text-[8px] text-slate-450 mt-1 leading-tight font-semibold">Secure x402 micro-payments</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 col-span-2 md:col-span-1">
            <span className="text-xl">👥</span>
            <span className="text-[10px] font-black mt-2 leading-none block">All-in-One</span>
            <span className="text-[8px] text-slate-450 mt-1 leading-tight font-semibold">Everything in one workspace</span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default StudentOverview;
