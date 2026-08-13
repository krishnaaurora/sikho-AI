import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Target, Search, ArrowRight, Play, RefreshCw, 
  Code, Shield, CheckCircle, HelpCircle, Layers, Cpu, Award,
  Sparkles, FileText, ChevronRight, Check, AlertCircle, Terminal, 
  DollarSign, ExternalLink, Activity, Info, Microscope, Eye
} from 'lucide-react';
import { Button } from './components/ui/button';
import Hero from './components/sections/Hero';
import InteractiveUnlockCard from './components/ui/InteractiveUnlockCard';

const SKILL_MAPS: Record<string, { skills: { name: string; pct: number }[]; gap: string; nextStep: string }> = {
  "ML Engineer": {
    skills: [
      { name: "Python", pct: 90 },
      { name: "Machine Learning", pct: 70 },
      { name: "System Design", pct: 40 }
    ],
    gap: "System Design",
    nextStep: "Learn Microservices & Load Balancers"
  },
  "Python Developer": {
    skills: [
      { name: "Syntax & Basics", pct: 95 },
      { name: "Data Structures", pct: 75 },
      { name: "Web Frameworks", pct: 50 }
    ],
    gap: "Web Frameworks",
    nextStep: "Build APIs with FastAPI or Django"
  },
  "Researcher": {
    skills: [
      { name: "Literature Review", pct: 85 },
      { name: "Math Foundations", pct: 60 },
      { name: "Paper Writing", pct: 30 }
    ],
    gap: "Paper Writing",
    nextStep: "Draft your first abstract for peer review"
  }
};

function Home() {
  // Interactive Sandbox Code Editor states (Section 3 Sandbox)
  const [code, setCode] = useState<string>(
    `def calculate(a, b):
    # Fix the return calculation below
    return a + b`
  );
  const [codeOutput, setCodeOutput] = useState<string>('✓ Output: 8\nMastery: 72%');
  const [codeHint, setCodeHint] = useState<string>('AI Tutor: Ready to help. Click "Get Hint" for key concepts.');
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // ─── INTERACTIVE MOCKUPS STATES (Platform Features redone) ───

  // Mockup 01 Learn: BFS/DFS Graph Traversal
  const [graphAlgorithm, setGraphAlgorithm] = useState<'BFS' | 'DFS'>('BFS');
  const [graphVisited, setGraphVisited] = useState<string[]>([]);
  const [graphRunning, setGraphRunning] = useState(false);
  const [graphCurrent, setGraphCurrent] = useState<string | null>(null);

  // Mockup 02 Code: Function compiler inputs
  const [mockInputA, setMockInputA] = useState<string>("5");
  const [mockInputB, setMockInputB] = useState<string>("3");
  const [mockOutput, setMockOutput] = useState<string>("8");
  const [mockCompiling, setMockCompiling] = useState<boolean>(false);
  const [mockHint, setMockHint] = useState<string>("Sum of both parameters is returned.");

  // Mockup 03 Career: Pilot target select
  const [careerTarget, setCareerTarget] = useState<string>("ML Engineer");

  // Mockup 04 Research: Pipeline state
  const [researchState, setResearchState] = useState<"compiling" | "done" | "idle">("compiling");

  // Mockup 05 Create: Skill passport select
  const [passportVerify, setPassportVerify] = useState<boolean>(false);

  // General X402 payment states
  const [showX402Modal, setShowX402Modal] = useState(false);
  const [activeService, setActiveService] = useState<{ name: string; price: string; action?: () => void } | null>(null);
  
  // Progressive disclosure toggle for x402 details
  const [showX402Details, setShowX402Details] = useState(false);

  // BFS / DFS simulation execution
  const runGraphSimulation = () => {
    if (graphRunning) return;
    setGraphRunning(true);
    setGraphVisited([]);
    setGraphCurrent(null);

    const bfsOrder = ['A', 'B', 'C', 'D', 'E', 'F'];
    const dfsOrder = ['A', 'B', 'D', 'E', 'C', 'F'];
    const order = graphAlgorithm === 'BFS' ? bfsOrder : dfsOrder;
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < order.length) {
        const node = order[index];
        setGraphCurrent(node);
        setGraphVisited((prev) => [...prev, node]);
        index++;
      } else {
        clearInterval(timer);
        setGraphRunning(false);
        setGraphCurrent(null);
      }
    }, 800);
  };

  const resetGraphSimulation = () => {
    setGraphVisited([]);
    setGraphCurrent(null);
    setGraphRunning(false);
  };

  // Compile mock function code
  const runMockCompile = () => {
    setMockCompiling(true);
    setTimeout(() => {
      const a = parseInt(mockInputA) || 0;
      const b = parseInt(mockInputB) || 0;
      setMockOutput((a + b).toString());
      setMockCompiling(false);
    }, 800);
  };

  // Run main sandbox code (Section 3 Sandbox)
  const runSandboxCode = () => {
    setIsSandboxRunning(true);
    setCodeOutput("Compiling execution flow...");
    setTimeout(() => {
      setCodeOutput("✓ Output: 8\nTest case passed. Correct return verified!\nMastery: 84%");
      setIsSandboxRunning(false);
    }, 1200);
  };

  // General Payment Trigger
  const triggerServicePayment = (name: string, price: string, action?: () => void) => {
    setActiveService({ name, price, action });
    setShowX402Modal(true);
  };

  const confirmPayment = () => {
    setShowX402Modal(false);
    if (activeService?.action) {
      activeService.action();
    } else {
      alert(`Payment of ${activeService?.price} approved via x402! Service unlocked.`);
    }
    setActiveService(null);
  };

  const getCodeHint = () => {
    setCodeHint("AI Tutor Hint (Free):\nThe function adds parameters 'a' and 'b'. Try calling it with custom variables like 'calculate(5, 3)' to verify outputs!");
  };

  const unlockSandboxReview = () => {
    triggerServicePayment("AI Deep Code Review", "$0.005", () => {
      setCodeHint("AI Deep Code Review ($0.005 Paid):\nYour syntax looks good. The helper runs in O(1) time complexity. Adding a brief docstring to describe function arguments is recommended.");
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-[#0F172A] selection:bg-blue-100 selection:text-blue-900 relative font-sans">
      
      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. PLATFORM FEATURES GRID HEADER (PREMIUM BLUEPRINT BACKGROUND) */}
      <section className="relative py-24 bg-white border-t border-slate-100 overflow-hidden">
        {/* Subtle grid blueprint lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-30 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/60 text-[#2563EB] text-xs font-semibold tracking-wide uppercase">
            ✦ Platform Features ✦
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0E172C] tracking-tight max-w-4xl mx-auto leading-none">
            Everything you need to{" "}
            <span className="relative inline-block">
              learn, build
              <svg className="absolute -bottom-2.5 left-0 w-full text-[#2563EB] opacity-80" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" fill="none">
                <path d="M0,5 C30,2 70,8 100,5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>{" "}
            and grow
          </h2>
          <p className="text-slate-500 font-medium text-base sm:text-lg max-w-xl mx-auto pt-2">
            One platform. Multiple ways to learn, practise and prove progress.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <a href="#learn-feature">
              <Button className="rounded-xl px-7 py-6 bg-[#004BFF] hover:bg-[#003DD6] text-white font-bold text-sm shadow-lg shadow-blue-500/10 flex items-center gap-1.5 transition-all">
                <span>Start your learning journey</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#research-feature">
              <Button className="rounded-xl px-7 py-6 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200/80 shadow-sm">
                See the research compiler
              </Button>
            </a>
          </div>

          {/* Sub navigation markers */}
          <div className="pt-12 flex justify-center items-center gap-8 text-[11px] font-mono font-bold tracking-wider text-slate-400 select-none">
            <span>01 LEARN</span>
            <span>&bull;</span>
            <span>02 CODE</span>
            <span>&bull;</span>
            <span>03 CAREER</span>
            <span>&bull;</span>
            <span>04 RESEARCH</span>
            <span>&bull;</span>
            <span>05 CREATE</span>
          </div>
        </div>
      </section>

      {/* 3. VERTICAL STACK OF PLATFORM FEATURES (PREMIUM ALTERNATING LAYOUT) */}

      {/* ─── 01 LEARN: Interactive Simulations ─── */}
      <section id="learn-feature" className="py-28 bg-[#FAFBFD] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column with Sleek Left Accent Line */}
            <div className="lg:col-span-5 space-y-6 border-l-4 border-[#2563EB] pl-6 sm:pl-8">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
                01 · INTERACTIVE SIMULATIONS
              </span>
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/60 flex items-center justify-center text-[#2563EB]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E172C]">Learn</h3>
                  <p className="text-xs text-slate-400 font-semibold">Understand concepts deeply</p>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0E172C] leading-tight uppercase">
                Learn by doing.
              </h2>
              
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                Move from explanation to practice without leaving the learning flow. Interactive lessons, an AI tutor and concept explanations help you truly understand what you learn.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#2563EB] bg-blue-50 rounded-full p-0.5" />
                  <span>AI Tutor & Doubt Support</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#2563EB] bg-blue-50 rounded-full p-0.5" />
                  <span>Interactive Lessons</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#2563EB] bg-blue-50 rounded-full p-0.5" />
                  <span>Concept Explanations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#2563EB] bg-blue-50 rounded-full p-0.5" />
                  <span>Notes & Resources</span>
                </div>
              </div>

              <div className="pt-2">
                <a href="#sandbox">
                  <Button className="rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 py-4 px-6 shadow-sm">
                    <span>Explore Learn</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Interactive Mockup Column (Enterprise Dashboard style) */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] flex flex-col space-y-4">
                <div className="flex justify-between items-center text-slate-400 font-mono text-[10px] font-bold">
                  <span>PYTHON · GRAPH TRAVERSAL</span>
                  <span>02 / 08</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 font-mono">
                  What is the search sequence?
                </h4>

                <div className="bg-slate-50/50 border border-slate-250/70 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setGraphAlgorithm('BFS'); resetGraphSimulation(); }}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                          graphAlgorithm === 'BFS' 
                            ? 'bg-[#0E172C] border-[#0E172C] text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        BFS (Queue)
                      </button>
                      <button 
                        onClick={() => { setGraphAlgorithm('DFS'); resetGraphSimulation(); }}
                        className={`px-3 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all ${
                          graphAlgorithm === 'DFS' 
                            ? 'bg-[#0E172C] border-[#0E172C] text-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        DFS (Stack)
                      </button>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={runGraphSimulation}
                        disabled={graphRunning}
                        className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white disabled:opacity-50 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Run</span>
                      </button>
                      <button 
                        onClick={resetGraphSimulation}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-mono font-bold transition-all"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Nodes diagram with grid background */}
                  <div className="h-36 bg-white rounded-lg relative flex items-center justify-center border border-slate-200/80 overflow-hidden bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:1.25rem_1.25rem]">
                    <svg className="absolute inset-0 w-full h-full text-slate-200 pointer-events-none">
                      <line x1="50%" y1="20%" x2="30%" y2="50%" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="50%" y1="20%" x2="70%" y2="50%" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="30%" y1="50%" x2="20%" y2="80%" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="30%" y1="50%" x2="40%" y2="80%" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="70%" y1="50%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="1.5" />
                    </svg>

                    <div className={`absolute top-[10%] left-[46%] w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                      graphCurrent === 'A' ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316] scale-110' :
                      graphVisited.includes('A') ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500'
                    }`}>A</div>

                    <div className={`absolute top-[42%] left-[26%] w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                      graphCurrent === 'B' ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316] scale-110' :
                      graphVisited.includes('B') ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500'
                    }`}>B</div>

                    <div className={`absolute top-[42%] left-[66%] w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                      graphCurrent === 'C' ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316] scale-110' :
                      graphVisited.includes('C') ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500'
                    }`}>C</div>

                    <div className={`absolute top-[72%] left-[16%] w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                      graphCurrent === 'D' ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316] scale-110' :
                      graphVisited.includes('D') ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500'
                    }`}>D</div>

                    <div className={`absolute top-[72%] left-[36%] w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                      graphCurrent === 'E' ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316] scale-110' :
                      graphVisited.includes('E') ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500'
                    }`}>E</div>

                    <div className={`absolute top-[72%] left-[76%] w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 ${
                      graphCurrent === 'F' ? 'bg-[#FFEDD5] border-[#F97316] text-[#F97316] scale-110' :
                      graphVisited.includes('F') ? 'bg-[#EEF2FF] border-[#2563EB] text-[#2563EB]' : 'bg-white border-slate-200 text-slate-500'
                    }`}>F</div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 flex justify-between font-bold">
                    <span>Visited: [{graphVisited.join(', ')}]</span>
                    <span>Target: {graphAlgorithm === 'BFS' ? 'A → B → C → D → E → F' : 'A → B → D → E → C → F'}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 02 CODE: Workspace Sandbox (Alternating) ─── */}
      <section id="code-feature" className="py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Interactive Mockup Column (Enterprise compiler) */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] flex flex-col space-y-3 font-mono">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
                  <span>PYTHON · FUNCTIONS</span>
                  <span>02 / 08</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                  What does this function return?
                </h4>

                {/* Editor box */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 text-[10px] font-bold">exercise_01.py</span>
                    <span className="text-slate-400 text-[9px]">Python 3</span>
                  </div>
                  <div className="p-4 bg-white text-[#0F172A] text-xs font-semibold leading-relaxed">
                    <span className="text-[#2563EB]">def</span> <span className="text-amber-600 font-bold">add</span>(a, b):
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#2563EB]">return</span> a + b
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Inputs */}
                  <div className="bg-[#FAFBFD] border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Try it</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold font-mono">a =</span>
                      <input 
                        type="text" 
                        value={mockInputA}
                        onChange={(e) => setMockInputA(e.target.value)}
                        className="w-12 text-center bg-white border border-slate-200 rounded font-bold px-1.5 py-0.5 text-xs focus:outline-none" 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold font-mono">b =</span>
                      <input 
                        type="text" 
                        value={mockInputB}
                        onChange={(e) => setMockInputB(e.target.value)}
                        className="w-12 text-center bg-white border border-slate-200 rounded font-bold px-1.5 py-0.5 text-xs focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* AI Explanation block */}
                  <div className="bg-[#FAFBFD] border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Explain Why</span>
                      <p className="text-[10px] text-slate-600 font-semibold mt-1 font-mono leading-tight">{mockHint}</p>
                    </div>
                    <button 
                      onClick={() => setMockHint("Sum of both parameters is returned.")}
                      className="w-full py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-[9px] font-mono transition-colors"
                    >
                      Get Hint ✦
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-600 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Output: {mockOutput}</span>
                  </span>
                  <button 
                    onClick={runMockCompile}
                    className="px-4 py-1.5 rounded-lg bg-[#0E172C] hover:bg-slate-800 text-white font-bold text-[9px] font-mono transition-colors"
                  >
                    {mockCompiling ? '...' : 'Run'}
                  </button>
                </div>

                {/* Progress mastery */}
                <div className="space-y-1.5 pt-1 font-mono">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>CONCEPT MASTERY</span>
                    <span>72% · Keep going!</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0E172C]" style={{ width: '72%' }} />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Content Column with Accent Line */}
            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2 border-l-4 border-emerald-500 pl-6 sm:pl-8">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
                02 · WORKSPACE SANDBOX
              </span>
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#10B981]">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E172C]">Code</h3>
                  <p className="text-xs text-slate-400 font-semibold">Practice by coding</p>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0E172C] leading-tight uppercase">
                Learn by building.
              </h2>
              
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                Connect theory directly to compiler output. Write, run and debug code in the browser, then call an AI coach when you need a hint or a deep review.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-emerald-600 bg-emerald-50 rounded-full p-0.5" />
                  <span>Online Code Editor</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-emerald-600 bg-emerald-50 rounded-full p-0.5" />
                  <span>Run & Debug Code</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-emerald-600 bg-emerald-50 rounded-full p-0.5" />
                  <span>Coding Challenges</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-emerald-600 bg-emerald-50 rounded-full p-0.5" />
                  <span>Instant Feedback</span>
                </div>
              </div>

              <div className="pt-2">
                <a href="#sandbox">
                  <Button className="rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 py-4 px-6 shadow-sm">
                    <span>Explore Code</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 03 CAREER: Start with the destination ─── */}
      <section id="career-feature" className="py-28 bg-[#FAFBFD] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column with Accent Line */}
            <div className="lg:col-span-5 space-y-6 border-l-4 border-amber-500 pl-6 sm:pl-8">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
                03 · CAREER MAPPING
              </span>
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/60 flex items-center justify-center text-[#F97316]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E172C]">Career</h3>
                  <p className="text-xs text-slate-400 font-semibold">Prepare for opportunities</p>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0E172C] leading-tight uppercase">
                Start with the destination.
              </h2>
              
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                Whether you're targeting a role, company or career path, we map what skills and experience you need to become more competitive — then build the path there.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-amber-50 rounded-full p-0.5" />
                  <span>Skill Gap Analysis</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-amber-50 rounded-full p-0.5" />
                  <span>Mock Interviews</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-amber-50 rounded-full p-0.5" />
                  <span>Resume Review</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-amber-50 rounded-full p-0.5" />
                  <span>Career Roadmap</span>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => triggerServicePayment("Explore Career Roadmap", "$0.005")}
                  className="rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 py-4 px-6 shadow-sm"
                >
                  <span>Explore Career</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Interactive Mockup Column */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] flex flex-col space-y-4 font-mono">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
                  <span>SKILLPILOT · PIPELINE MAP</span>
                  <span>02 / 08</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                  Job Skill GAP Map
                </h4>

                {/* Flowchart list inside solid border card */}
                <div className="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-white space-y-4 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    INTERACTIVE GOAL FLOWCHART
                  </span>
                  
                  <div className="space-y-4 text-xs font-mono">
                    <div className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-450 uppercase block">TARGET ROLE</span>
                        <strong className="text-slate-800">"I want to become a {careerTarget}"</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-450 uppercase block">REQUIRED SKILLS</span>
                        <strong className="text-slate-700">Python, DSA, System Design, SQL</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-450 uppercase block">SKILL GAPS</span>
                        <strong className="text-slate-700">DSA, System Design</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5 border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                      <div className="w-6 h-6 rounded-full bg-[#0E172C] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">4</div>
                      <div>
                        <span className="text-[8px] font-bold text-[#2563EB] uppercase block">LEARNING PATH</span>
                        <strong className="text-[#0E172C]">Focus on Trees, Graphs & Cache architecture</strong>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 04 RESEARCH: From learning to research (Alternating) ─── */}
      <section id="research-feature" className="py-28 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Interactive Mockup Column (Enterprise workspace) */}
            <div className="lg:col-span-7 order-2 lg:order-1">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] flex flex-col space-y-4 font-mono">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
                  <span>RESEARCH WORKSPACE</span>
                  <span>02 / 08</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                  Literature Review pipeline
                </h4>

                <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white space-y-3 shadow-sm">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                    RESEARCH PIPELINE WORKFLOW
                  </span>

                  <div className="space-y-2.5 text-[10px] font-semibold text-slate-800 font-mono">
                    {[
                      "PAPERS (Search indexed literature)",
                      "UNDERSTAND (Abstract key findings)",
                      "COMPARE (Analyze methods & parameters)",
                      "IDENTIFY LIMITATIONS (Pinpoint scope boundaries)",
                      "EXPLORE POTENTIAL GAPS (Formulate hypotheses)"
                    ].map((step, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1">
                  <span>Pipeline status: {researchState === 'compiling' ? 'compiling' : 'idle'}</span>
                  <button 
                    onClick={() => {
                      setResearchState("compiling");
                      setTimeout(() => setResearchState("idle"), 1200);
                    }}
                    className="text-[#2563EB] hover:underline"
                  >
                    Replay ↺
                  </button>
                </div>
              </div>
            </div>

            {/* Right Content Column with Accent Line */}
            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2 border-l-4 border-rose-500 pl-6 sm:pl-8">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
                04 · RESEARCH COMPILER
              </span>
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#F43F5E]">
                  <Microscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E172C]">Research</h3>
                  <p className="text-xs text-slate-500 font-semibold">Explore new ideas</p>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0E172C] leading-tight uppercase">
                From learning to research.
              </h2>
              
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                Built for B.Tech, PG and PhD students who want to go beyond coursework: read papers, compare methods, find gaps and start contributing to scientific journals.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F43F5E] bg-rose-50 rounded-full p-0.5" />
                  <span>Read & Upload Papers</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F43F5E] bg-rose-50 rounded-full p-0.5" />
                  <span>Compare & Summarize</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F43F5E] bg-rose-50 rounded-full p-0.5" />
                  <span>Find Research Gaps</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F43F5E] bg-rose-50 rounded-full p-0.5" />
                  <span>Export & Cite</span>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => triggerServicePayment("Explore Research Compiler", "$0.010")}
                  className="rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 py-4 px-6 shadow-sm"
                >
                  <span>Explore Research</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 05 CREATE: Verifiable Credentials ─── */}
      <section id="create-feature" className="py-28 bg-[#FAFBFD] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column with Accent Line */}
            <div className="lg:col-span-5 space-y-6 border-l-4 border-orange-500 pl-6 sm:pl-8">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
                05 · VERIFIABLE CREDENTIALS
              </span>
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100/60 flex items-center justify-center text-[#F97316]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0E172C]">Create</h3>
                  <p className="text-xs text-slate-400 font-semibold">Build proof, not just progress</p>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-[#0E172C] leading-tight uppercase">
                Don't just complete a course. Build evidence.
              </h2>
              
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">
                Build a persistent record of the skills, projects and practical assessments you complete, and keep your profile verified cryptographically.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-orange-50 rounded-full p-0.5" />
                  <span>Projects & Apps</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-orange-50 rounded-full p-0.5" />
                  <span>Presentations (PPT)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-orange-50 rounded-full p-0.5" />
                  <span>Reports & Documents</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-[#F97316] bg-orange-50 rounded-full p-0.5" />
                  <span>Study Materials</span>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => triggerServicePayment("Unlock Skill Passport", "$0.005")}
                  className="rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 py-4 px-6 shadow-sm"
                >
                  <span>Explore Create</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Right Interactive Mockup Column */}
            <div className="lg:col-span-7">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] flex flex-col space-y-4 font-mono">
                <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold">
                  <span>SECURE VERIFICATION</span>
                  <span>02 / 08</span>
                </div>
                <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
                  Decentralized Credentials
                </h4>

                {/* Skill Passport card */}
                <div className="border border-slate-200/80 rounded-xl p-4 sm:p-5 bg-[#FAFBFD] space-y-4 shadow-inner">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-[10px] font-extrabold text-slate-900 font-mono tracking-wider">SKILL PASSPORT RECORD</h5>
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                        CRYPTOGRAPHICALLY VERIFIED
                      </span>
                    </div>
                    <Award className="h-5 w-5 text-slate-700" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white border border-slate-250/60 p-2.5 rounded-lg text-center shadow-sm">
                      <span className="text-[8px] text-slate-500 font-bold font-mono block">Python</span>
                      <strong className="text-xs text-[#0F172A] mt-1 block">88%</strong>
                      <div className="h-1 bg-slate-100 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: '88%' }} />
                      </div>
                    </div>
                    
                    <div className="bg-white border border-slate-250/60 p-2.5 rounded-lg text-center shadow-sm">
                      <span className="text-[8px] text-slate-500 font-bold font-mono block">DSA</span>
                      <strong className="text-xs text-[#0F172A] mt-1 block">76%</strong>
                      <div className="h-1 bg-slate-100 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: '76%' }} />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-250/60 p-2.5 rounded-lg text-center shadow-sm">
                      <span className="text-[8px] text-slate-500 font-bold font-mono block">ML</span>
                      <strong className="text-xs text-[#0F172A] mt-1 block">{passportVerify ? '84%' : '64%'}</strong>
                      <div className="h-1 bg-slate-100 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: passportVerify ? '84%' : '64%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 pt-3 flex flex-col sm:flex-row justify-between text-[9px] font-bold text-slate-500 gap-2">
                    <span>Evaluated Projects &bull; GitHub Integration</span>
                    <button 
                      onClick={() => setPassportVerify(true)}
                      className="text-[#2563EB] hover:underline font-extrabold flex items-center gap-0.5"
                    >
                      <span>Connect</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Track CTA Footer Segment ─── */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-[10px] font-mono font-extrabold tracking-[0.2em] text-slate-400 uppercase">
            one platform · five tracks
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E172C] tracking-tight leading-none uppercase">
            Learn the concept. Ship the proof.
          </h2>
          <div className="pt-4">
            <a href="#learn-feature">
              <Button className="rounded-xl px-8 py-5.5 bg-[#0E172C] hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center gap-1.5 mx-auto transition-all">
                <span>Start your learning journey</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>



      {/* 5. "FROM LEARNING TO OUTCOMES" COMPARATIVE GRID */}
      <section className="py-24 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Headline */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
              Outcomes roadmap
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0E172C] tracking-tight leading-tight uppercase">
              Learning doesn't end at the lesson.
            </h2>
            <div className="w-14 h-1 bg-[#2563EB] rounded-full mx-auto" />
          </div>

          {/* Three comparative workflow columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Learn */}
            <div className="bg-[#FAFBFD] border border-slate-200/60 p-6 sm:p-8 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold font-mono text-sm mb-5 border border-blue-100/60">
                  01
                </div>
                <h3 className="text-xl font-extrabold text-[#0E172C] uppercase tracking-wide mb-2 font-mono">LEARN</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-6">Build core concepts</p>
                
                <div className="space-y-4">
                  {[
                    { label: "Understand Basics", desc: "Acquire Python syntax, parameters & references" },
                    { label: "Practice Modules", desc: "Interact with simple sandbox loops & conditions" },
                    { label: "Assess Progress", desc: "Receive automated scoring on basic assignments" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 border border-blue-100">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200/60 mt-8">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Focus area: Education</span>
              </div>
            </div>

            {/* Column 2: Career */}
            <div className="bg-[#FAFBFD] border border-slate-200/60 p-6 sm:p-8 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#687A3D] flex items-center justify-center font-bold font-mono text-sm mb-5 border border-amber-100/60">
                  02
                </div>
                <h3 className="text-xl font-extrabold text-[#0E172C] uppercase tracking-wide mb-2 font-mono">CAREER</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-6">Align to industry needs</p>
                
                <div className="space-y-4">
                  {[
                    { label: "Target Roles", desc: "Select target paths like ML Engineer or Backend Dev" },
                    { label: "Identify Gaps", desc: "Audit skill levels against professional prerequisites" },
                    { label: "Build Portfolio", desc: "Generate credentials and project proof histories" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-50 text-[#687A3D] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 border border-amber-150">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200/60 mt-8">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Focus area: Outcomes</span>
              </div>
            </div>

            {/* Column 3: Research */}
            <div className="bg-[#FAFBFD] border border-slate-200/60 p-6 sm:p-8 rounded-[24px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[380px]">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold font-mono text-sm mb-5 border border-teal-100/60">
                  03
                </div>
                <h3 className="text-xl font-extrabold text-[#0E172C] uppercase tracking-wide mb-2 font-mono">RESEARCH</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-6">Contribute to the field</p>
                
                <div className="space-y-4">
                  {[
                    { label: "Review Literature", desc: "Audit paper abstracts and parameter matrices" },
                    { label: "Spot Limitations", desc: "Highlight bottlenecks and narrow scopes in literature" },
                    { label: "Formulate Gaps", desc: "Draft research hypothesis prompts for peer review" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 border border-teal-100">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-200/60 mt-8">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Focus area: Exploration</span>
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* 7. STREAMLINED x402 SECTION ("Pay only when you use it.") */}
      <section className="py-24 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left explanation block */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-mono font-extrabold tracking-[0.2em] text-[#2563EB] uppercase">
                Payment mechanism
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0E172C] tracking-tight leading-tight uppercase">
                Pay only when you use it.
              </h2>
              <div className="w-12 h-1 bg-[#2563EB] rounded-full" />
              <p className="text-slate-605 text-base font-medium leading-relaxed max-w-md">
                Experience unlocked instantly. Micro-payments allow you to unlock specific assessments, code reviews, and tools without monthly commitments.
              </p>

              {/* Steps diagram in text */}
              <div className="space-y-4 pt-2">
                {[
                  { step: "1", label: "Request simulation", desc: "Triggers HTTP 402 request headers automatically" },
                  { step: "2", label: "Approve transaction", desc: "Approve the micro-payment directly via wallet" },
                  { step: "3", label: "Unlock workspace", desc: "The verified experience is instantly accessible" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded bg-[#0E172C] text-white flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-none">{item.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progressive disclosure toggle */}
              <div className="pt-4">
                <button 
                  onClick={() => setShowX402Details(!showX402Details)}
                  className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1.5"
                >
                  <Info className="h-4 w-4" />
                  <span>How does it work? (View Technical Specs) →</span>
                </button>
              </div>
            </div>

            {/* Right Interactive card block */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <InteractiveUnlockCard />
            </div>

          </div>

          {/* Progressive Disclosure Section: Technical Credibility */}
          <AnimatePresence>
            {showX402Details && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-14 overflow-hidden border-t border-slate-200 pt-12"
              >
                <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-[20px] p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">Powered by x402 on Algorand</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1 font-mono">
                      Request → Payment → Verification → Access
                    </p>
                  </div>
                  
                  <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-lg mt-4">
                    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 select-none">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-slate-400 font-mono ml-2">sikhoai.app · x402 · protocol</span>
                    </div>
                    <video
                      src="/Exactly_—_you_want_a_pure_work.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full block"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* 7. FOOTER SECTION */}
      <footer className="border-t border-slate-900 bg-[#0F172A] py-16 px-4 sm:px-6 lg:px-8 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-start">
          
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain rounded" />
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm tracking-wide font-mono">Your AI Learning Workspace</h4>
              <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                Learn. Prepare. Create. Build. Grow. Research.
              </p>
              <p className="text-xs text-slate-405 leading-relaxed font-medium">
                Turn your goals into skills, projects and real-world outcomes — with AI-powered learning and pay-per-use services.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide font-mono">Product</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium font-mono">
              <li><a href="#learn-feature" className="hover:text-white transition-all">Learn</a></li>
              <li><a href="#code-feature" className="hover:text-white transition-all">Code</a></li>
              <li><a href="#career-feature" className="hover:text-white transition-all">Career</a></li>
              <li><a href="#research-feature" className="hover:text-white transition-all">Research</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide font-mono">Explore</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium font-mono">
              <li><a href="#" className="hover:text-white transition-all">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-all">AI Tutor</a></li>
              <li><a href="#" className="hover:text-white transition-all">Labs & Simulations</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide font-mono">Company</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium font-mono">
              <li><a href="#" className="hover:text-white transition-all">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-all">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-all">Careers</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide font-mono">Legal</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium font-mono">
              <li><a href="#" className="hover:text-white transition-all">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-all">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 font-semibold gap-4">
          <span>&copy; {new Date().getFullYear()} SikhoAI. All rights reserved.</span>
          <span className="text-slate-400 font-bold font-mono">Pay-per-use powered by x402 &bull; Algorand</span>
          <div className="flex gap-4 font-mono">
            <a href="#" className="hover:text-slate-400 transition-all">GitHub</a>
            <a href="#" className="hover:text-slate-400 transition-all">LinkedIn</a>
            <a href="#" className="hover:text-slate-400 transition-all">X</a>
          </div>
        </div>
      </footer>

      {/* 8. MOCK x402 PAYMENT MODAL */}
      <AnimatePresence>
        {showX402Modal && activeService && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full font-mono text-xs text-slate-700 space-y-4 shadow-xl"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[#F59E0B] font-bold">HTTP 402</span>
                  <h3 className="text-slate-900 font-bold mt-0.5 font-mono">Payment Required</h3>
                </div>
                <Shield className="h-5 w-5 text-[#2563EB]" />
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 font-semibold">Service:</span>
                  <div className="text-slate-900 font-bold font-mono">{activeService.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Price:</span>
                  <div className="text-[#2563EB] font-bold font-mono">{activeService.price} USDC</div>
                </div>
                <div className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                  Headers Sent:<br />
                  <span className="text-[#2563EB]">Payment-Recipient:</span> AVM_SERVER_ADDR...<br />
                  <span className="text-[#2563EB]">Payment-Token-Standard:</span> AVM_USDC
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  onClick={confirmPayment}
                  className="flex-1 py-2.5 bg-[#2563EB] hover:bg-blue-600 font-bold text-white rounded-xl transition-all shadow-sm font-mono text-xs"
                >
                  Sign & Pay via Wallet
                </button>
                <button 
                  onClick={() => setShowX402Modal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-xl transition-all font-bold font-mono text-xs border border-slate-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Home;
