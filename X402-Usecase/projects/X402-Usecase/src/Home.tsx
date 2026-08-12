import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Target, Search, ArrowRight, Play, RefreshCw, 
  Code, Shield, CheckCircle, HelpCircle, Layers, Cpu, Award,
  Sparkles, FileText, ChevronRight, Check, AlertCircle
} from 'lucide-react';
import { Button } from './components/ui/button';
import Hero from './components/sections/Hero';
import InteractiveUnlockCard from './components/ui/InteractiveUnlockCard';
import GoalSection from './components/sections/GoalSection';


const PLACEHOLDERS = [
  "I want to learn Python",
  "I want to master DSA",
  "I want to become an ML Engineer",
  "I want to prepare for a software engineering role",
  "I want to start AI research"
];

const SKILL_MAPS: Record<string, { skills: { name: string; pct: number; icon: string }[]; gap: string; nextStep: string }> = {
  "ML Engineer": {
    skills: [
      { name: "Python", pct: 82, icon: "✓" },
      { name: "Mathematics", pct: 61, icon: "◐" },
      { name: "Machine Learning", pct: 43, icon: "◐" },
      { name: "Deep Learning", pct: 21, icon: "○" },
      { name: "Projects", pct: 35, icon: "○" }
    ],
    gap: "Deep Learning",
    nextStep: "Neural Networks"
  },
  "Python": {
    skills: [
      { name: "Syntax & Basics", pct: 95, icon: "✓" },
      { name: "Data Structures", pct: 70, icon: "✓" },
      { name: "APIs & Web", pct: 40, icon: "◐" },
      { name: "OOP Principles", pct: 25, icon: "○" },
      { name: "Projects & Testing", pct: 10, icon: "○" }
    ],
    gap: "OOP Principles",
    nextStep: "Classes and Inheritance"
  },
  "Research": {
    skills: [
      { name: "Literature Review", pct: 80, icon: "✓" },
      { name: "Math Foundations", pct: 65, icon: "◐" },
      { name: "Research Methods", pct: 30, icon: "○" },
      { name: "Experiment Design", pct: 15, icon: "○" },
      { name: "Paper Writing", pct: 5, icon: "○" }
    ],
    gap: "Research Methods",
    nextStep: "Hypothesis Testing"
  }
};

function Home() {
  // Skill map demo state
  const [selectedMapKey, setSelectedMapKey] = useState<string>("ML Engineer");

  // BFS/DFS Lab states
  const [algorithm, setAlgorithm] = useState<'BFS' | 'DFS'>('BFS');
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentNode, setCurrentNode] = useState<string | null>(null);

  // Coding block states
  const [code, setCode] = useState<string>(
    `def binary_search(arr, target):\n    left = 0\n    right = len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid\n        else:\n            right = mid\n    return -1`
  );
  const [codeOutput, setCodeOutput] = useState<string>('');
  const [codeHint, setCodeHint] = useState<string>('');
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  const [showX402Modal, setShowX402Modal] = useState(false);
  const [activeService, setActiveService] = useState<{ name: string; price: string } | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  // Scroll listener for sticky features using getBoundingClientRect for reliability
  useEffect(() => {
    const handleScroll = () => {
      const labsSection = document.getElementById("sticky-section-labs");
      const buildSection = document.getElementById("sticky-section-build");
      const careerSection = document.getElementById("sticky-section-career");
      const researchSection = document.getElementById("sticky-section-research");
      const passportSection = document.getElementById("sticky-section-passport");

      if (!labsSection || !buildSection || !careerSection || !researchSection || !passportSection) return;

      const triggerPoint = window.innerHeight / 2;

      const labsTop = labsSection.getBoundingClientRect().top;
      const buildTop = buildSection.getBoundingClientRect().top;
      const careerTop = careerSection.getBoundingClientRect().top;
      const researchTop = researchSection.getBoundingClientRect().top;
      const passportTop = passportSection.getBoundingClientRect().top;

      if (passportTop <= triggerPoint) {
        setActiveSection(4);
      } else if (researchTop <= triggerPoint) {
        setActiveSection(3);
      } else if (careerTop <= triggerPoint) {
        setActiveSection(2);
      } else if (buildTop <= triggerPoint) {
        setActiveSection(1);
      } else {
        setActiveSection(0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Trigger initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // BFS / DFS simulation execution
  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setVisitedNodes([]);
    setCurrentNode(null);

    const bfsOrder = ['A', 'B', 'C', 'D', 'E', 'F'];
    const dfsOrder = ['A', 'B', 'D', 'E', 'C', 'F'];
    const order = algorithm === 'BFS' ? bfsOrder : dfsOrder;
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < order.length) {
        const node = order[index];
        setCurrentNode(node);
        setVisitedNodes((prev) => [...prev, node]);
        index++;
      } else {
        clearInterval(timer);
        setIsRunning(false);
        setCurrentNode(null);
      }
    }, 800);
  };

  const resetSimulation = () => {
    setVisitedNodes([]);
    setCurrentNode(null);
    setIsRunning(false);
  };

  // Run user code
  const runCode = () => {
    setCodeOutput("Running test cases...\nFail: binary_search([1, 2, 3, 4], 4) timed out or returned incorrect index.\n(Infinite loop detected)");
  };

  const getCodeHint = () => {
    setCodeHint("AI Hint: Think about how you update your 'left' and 'right' pointers. If mid is not the target, should you include it in the next search range?");
  };

  // Mock x402 payment
  const triggerServicePayment = (name: string, price: string) => {
    setActiveService({ name, price });
    setShowX402Modal(true);
  };

  const confirmPayment = () => {
    setShowX402Modal(false);
    if (activeService?.name.includes("Code Review")) {
      setReviewUnlocked(true);
      setCodeHint("AI Deep Code Review ($0.005 Paid):\nYour left and right bounds update step does not exclude the mid index. Change `left = mid` to `left = mid + 1` and `right = mid` to `right = mid - 1` to prevent infinite loops.");
    } else {
      alert(`Payment of ${activeService?.price} approved via x402 on Algorand! Service unlocked successfully.`);
    }
    setActiveService(null);
  };

  return (
    <div className="min-h-screen bg-background text-slate-850 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 relative font-sans">
      
      {/* 2. Hero Section (Injected from external component) */}
      <Hero />

      {/* 3. Goal -> Path Concept Section — Monochrome Redesign */}
      <GoalSection />

      {/* 7. x402 Section */}
      <section className="py-24 border-t border-slate-100 bg-slate-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side text with scroll animations */}
            <motion.div 
              className="lg:col-span-6 space-y-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-bold text-xs tracking-wider uppercase font-mono shadow-sm">
                Wait! Take a look
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight mt-2">
                Don't buy a course.<br />
                Buy the experience you need.
              </h2>
              <p className="text-slate-550 font-medium leading-relaxed max-w-lg">
                Core learning is free. When you need a specialized experience, request it and pay only for that individual use.
              </p>
              
              <div className="space-y-3 font-semibold text-slate-700">
                {[
                  "No subscriptions.",
                  "No course lock-in.",
                  "No unused credits.",
                  "Pay only for individual services."
                ].map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    className="flex items-center gap-2.5 text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.1 }}
                  >
                    <Check className="h-4 w-4 text-orange-500" />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="pt-2"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Button 
                  onClick={() => triggerServicePayment("Explore Services Connection", "$0.005")}
                  className="rounded-xl px-6 py-3.5 bg-indigo-650 hover:bg-indigo-500 font-bold text-white shadow-lg shadow-indigo-500/10 flex items-center gap-1.5"
                >
                  <span>Explore Services</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Right side interactive request & unlock demo card with animation */}
            <motion.div 
              className="lg:col-span-6"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <InteractiveUnlockCard />
            </motion.div>

          </div>
        </div>
      </section>


      {/* Sticky Scroll Segment: Labs, Build, Career, Research, Passport */}
      <section className="relative py-24 border-t border-slate-100 bg-[#FAF9F6]/20 dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Heading: FEATURES */}
          <div className="mb-16">
            <p className="text-[11px] text-indigo-650 font-extrabold tracking-[0.2em] uppercase mb-3">
              Platform capabilities
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">
              Platform Features
            </h2>
            <div className="w-16 h-1.5 bg-indigo-650 mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
            
            {/* Left Side Content Blocks */}
            <div className="lg:col-span-5 space-y-[45vh] pb-[25vh]">
              {/* Labs Section */}
              <div id="sticky-section-labs" className={`space-y-5 pt-12 border-l-2 pl-6 transition-all duration-300 relative ${activeSection === 0 ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200'}`}>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider font-mono">01 · Interactive Simulations</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight relative pb-2">
                  Learn by{' '}
                  <span className="relative inline-block">
                    doing.
                    <svg className="absolute -bottom-1 left-0 w-full h-1.5 text-slate-900" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none">
                      <path d="M0,5 C30,2 70,8 100,5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <path d="M5,8 C35,5 75,9 95,7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Move from explanation to practice without leaving the learning flow. Experiment, get feedback, and build something real.
                </p>

                {/* Hand sketch box: One Concept -> One Experiment -> One Measurable Result */}
                <div className="relative my-6 p-5 border-2 border-slate-900 rounded-xl bg-white max-w-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-[11px] text-slate-800 space-y-2 select-none">
                  {/* Left pointing sketch arrow */}
                  <div className="absolute -left-7 top-6 text-slate-900">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M2 12c4-8 12-8 16-2M2 12l4-4M2 12l4 4" />
                    </svg>
                  </div>
                  <div className="text-center font-bold">One concept</div>
                  <div className="text-center text-slate-400">↓</div>
                  <div className="text-center font-bold">One experiment</div>
                  <div className="text-center text-slate-400">↓</div>
                  <div className="text-center font-bold relative inline-block w-full">
                    One measurable result
                    <span className="absolute -right-2 -bottom-1 text-amber-500">☀️</span>
                  </div>
                </div>

                {/* Connector arrow pointing to the right card */}
                <div className="absolute right-[-30px] top-[75%] transform -translate-y-1/2 hidden xl:block text-slate-900 z-25">
                  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M6 36 C18 36, 28 20, 42 16" />
                    <path d="M36 12 L44 16 L38 22" />
                  </svg>
                </div>

                <div>
                  <Button className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-2 py-4 shadow-sm">
                    <span>Explore Labs</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

              {/* Build Section */}
              <div id="sticky-section-build" className={`space-y-5 pt-12 border-l-2 pl-6 transition-all duration-300 ${activeSection === 1 ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200'}`}>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider font-mono">02 · Workspace Sandbox</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Learn by building.</h3>
                <p className="text-slate-550 dark:text-slate-400 text-sm leading-relaxed">
                  Connect your theory directly to compiler output. Access an AI coding coach dynamically when you require hints or deep code reviews.
                </p>
                <div className="bg-white/60 p-4 rounded-xl border border-slate-200 flex gap-3 shadow-sm">
                  <Cpu className="h-5 w-5 text-indigo-650 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Discrete Paid API Requests</h4>
                    <p className="text-[11px] text-slate-550 mt-1 leading-relaxed">
                      SikhoAI utilizes x402 headers to charge for intensive compute requests, such as compiler execution or complex LLM review analysis.
                    </p>
                  </div>
                </div>
              </div>

              {/* Career Section */}
              <div id="sticky-section-career" className={`space-y-5 pt-12 border-l-2 pl-6 transition-all duration-300 ${activeSection === 2 ? 'border-orange-500 bg-orange-50/10' : 'border-slate-200'}`}>
                <span className="text-[11px] text-orange-600 font-bold uppercase tracking-wider font-mono">03 · Career Mapping</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Start with the destination.</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Whether you're targeting a role, company or career path, SkillPilot helps you understand what skills and experience you need to become more competitive.
                </p>
                <div className="bg-white/60 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Product Guideline</p>
                  <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 font-semibold leading-relaxed">
                    Understand the gap between where you are and where you want to be.
                  </p>
                </div>
              </div>

              {/* Research Section */}
              <div id="sticky-section-research" className={`space-y-5 pt-12 border-l-2 pl-6 transition-all duration-300 ${activeSection === 3 ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200'}`}>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider font-mono">04 · Research Compiler</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">From learning to research.</h3>
                <p className="text-slate-555 dark:text-slate-400 text-sm leading-relaxed">
                  Built for B.Tech, PG, and PhD students who want to go beyond basic coursework and begin contributing to scientific journals.
                </p>
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { title: "Paper Analysis", desc: "Breakdown complex PDFs" },
                    { title: "Comparison", desc: "Correlate research fields" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passport Section */}
              <div id="sticky-section-passport" className={`space-y-5 pt-12 border-l-2 pl-6 transition-all duration-300 ${activeSection === 4 ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200'}`}>
                <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider font-mono">05 · Verifiable Credentials</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Don't just complete a course.<br />Build evidence.</h3>
                <p className="text-slate-555 dark:text-slate-400 text-sm leading-relaxed">
                  Build a persistent record of the skills, projects and practical assessments you complete. Keep your profile verified cryptographically.
                </p>
                <div>
                  <Button className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs flex items-center gap-2 py-4 shadow-sm">
                    <span>View Skill Passport</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>

            </div>

            {/* Right Side Sticky Visual Mockup Panel */}
            <div className="hidden lg:block lg:col-span-6 sticky top-28 self-start h-[470px] bg-white border border-slate-200 rounded-[24px] p-5 shadow-2xl overflow-hidden flex flex-col justify-center relative">
            
            {/* Hand-drawn sketch decorative elements */}
            <div className="absolute top-3 right-4 flex items-center gap-1.5 text-slate-400 font-mono text-[9px] select-none font-bold">
              <span>02 / 08</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </div>

            <AnimatePresence mode="wait">
              
              {/* 1. Labs Visual (Graph Visualizer) */}
              {activeSection === 0 && (
                <motion.div
                  key="labs-vis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-center space-y-4"
                >
                  <div className="text-left">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">🐍 PYTHON · Graph Traversal</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1 font-mono">What is the search sequence?</h4>
                    <div className="h-[2px] bg-slate-900 w-32 mt-1 rounded-full" />
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F6] border-2 border-slate-900 space-y-4 shadow-[3px_3px_0px_0px_#0f172a]">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setAlgorithm('BFS'); resetSimulation(); }}
                          className={`px-3 py-1 rounded border-2 border-slate-900 text-[10px] font-mono font-bold transition-all ${algorithm === 'BFS' ? 'bg-slate-900 text-white shadow-none' : 'bg-white text-slate-800 hover:bg-slate-50 shadow-[1px_1px_0px_0px_#000]'}`}
                        >
                          BFS (Queue)
                        </button>
                        <button 
                          onClick={() => { setAlgorithm('DFS'); resetSimulation(); }}
                          className={`px-3 py-1 rounded border-2 border-slate-900 text-[10px] font-mono font-bold transition-all ${algorithm === 'DFS' ? 'bg-slate-900 text-white shadow-none' : 'bg-white text-slate-800 hover:bg-slate-50 shadow-[1px_1px_0px_0px_#000]'}`}
                        >
                          DFS (Stack)
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={runSimulation}
                          disabled={isRunning}
                          className="px-3 py-1 rounded border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-all text-[10px] font-mono font-semibold"
                        >
                          Run
                        </button>
                        <button 
                          onClick={resetSimulation}
                          className="px-3 py-1 rounded border-2 border-slate-900 bg-white hover:bg-slate-50 text-slate-900 transition-all text-[10px] font-mono font-semibold shadow-[1px_1px_0px_0px_#000]"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Graph Visualization */}
                    <div className="h-36 bg-white rounded-lg relative flex items-center justify-center border-2 border-slate-900">
                      <svg className="absolute inset-0 w-full h-full text-slate-800 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="50%" y1="20%" x2="30%" y2="50%" stroke="currentColor" strokeWidth="2" />
                        <line x1="50%" y1="20%" x2="70%" y2="50%" stroke="currentColor" strokeWidth="2" />
                        <line x1="30%" y1="50%" x2="20%" y2="80%" stroke="currentColor" strokeWidth="2" />
                        <line x1="30%" y1="50%" x2="40%" y2="80%" stroke="currentColor" strokeWidth="2" />
                        <line x1="70%" y1="50%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="2" />
                      </svg>

                      {/* Node Tree */}
                      <div className={`absolute top-[10%] left-[45%] w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        currentNode === 'A' ? 'bg-amber-400 border-slate-900 text-slate-900 scale-110' :
                        visitedNodes.includes('A') ? 'bg-indigo-100 border-slate-900 text-slate-900' : 'bg-white border-slate-900 text-slate-500'
                      }`}>A</div>

                      <div className={`absolute top-[42%] left-[26%] w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        currentNode === 'B' ? 'bg-amber-400 border-slate-900 text-slate-900 scale-110' :
                        visitedNodes.includes('B') ? 'bg-indigo-100 border-slate-900 text-slate-900' : 'bg-white border-slate-900 text-slate-500'
                      }`}>B</div>

                      <div className={`absolute top-[42%] left-[66%] w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        currentNode === 'C' ? 'bg-amber-400 border-slate-900 text-slate-900 scale-110' :
                        visitedNodes.includes('C') ? 'bg-indigo-100 border-slate-900 text-slate-900' : 'bg-white border-slate-900 text-slate-500'
                      }`}>C</div>

                      <div className={`absolute top-[72%] left-[16%] w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        currentNode === 'D' ? 'bg-amber-400 border-slate-900 text-slate-900 scale-110' :
                        visitedNodes.includes('D') ? 'bg-indigo-100 border-slate-900 text-slate-900' : 'bg-white border-slate-900 text-slate-500'
                      }`}>D</div>

                      <div className={`absolute top-[72%] left-[36%] w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        currentNode === 'E' ? 'bg-amber-400 border-slate-900 text-slate-900 scale-110' :
                        visitedNodes.includes('E') ? 'bg-indigo-100 border-slate-900 text-slate-900' : 'bg-white border-slate-900 text-slate-500'
                      }`}>E</div>

                      <div className={`absolute top-[72%] left-[76%] w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        currentNode === 'F' ? 'bg-amber-400 border-slate-900 text-slate-900 scale-110' :
                        visitedNodes.includes('F') ? 'bg-indigo-100 border-slate-900 text-slate-900' : 'bg-white border-slate-900 text-slate-500'
                      }`}>F</div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-700 flex justify-between font-bold">
                      <span>Visited: [{visitedNodes.join(', ')}]</span>
                      <span>Target: {algorithm === 'BFS' ? 'A → B → C → D → E → F' : 'A → B → D → E → C → F'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-800 px-1 pt-1">
                    <span>Simulation status: active</span>
                    <span className="text-indigo-650 flex items-center gap-1">Keep going! <span className="text-xs">➔</span></span>
                  </div>
                </motion.div>
              )}

              {/* 2. Build Visual (Compiler and Editor) */}
              {activeSection === 1 && (
                <motion.div
                  key="build-vis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-center space-y-3"
                >
                  <div className="text-left">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">🧠 PYTHON · Functions</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1 font-mono">What does this function return?</h4>
                    <div className="h-[2px] bg-slate-900 w-32 mt-1 rounded-full" />
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md flex flex-col font-mono text-xs text-slate-800">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-700 text-[10px] font-bold">exercise_01.py</span>
                      </div>
                      <span className="text-slate-400 text-[9px]">Python 3</span>
                    </div>

                    <div className="p-3 bg-white text-slate-800 text-[11px] font-semibold leading-relaxed border-b border-slate-200 font-mono">
                      <span className="text-indigo-650">def</span> <span className="text-amber-600 font-bold">add</span>(a, b):<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-600">return</span> a + b
                    </div>

                    {/* Try it block */}
                    <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200">
                      <div className="p-3 bg-white space-y-1.5">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Try it</div>
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[10px] font-bold">
                          <span>a = 5</span>
                          <span className="text-[9px] text-slate-400">✎</span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded px-2 py-0.5 text-[10px] font-bold">
                          <span>b = 3</span>
                          <span className="text-[9px] text-slate-400">✎</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white flex flex-col justify-between">
                        <div className="text-[9px] font-bold text-slate-400 uppercase">Explain why</div>
                        <div className="text-[10px] text-slate-500 font-medium">AI Hint available</div>
                        <button onClick={getCodeHint} className="w-full py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold text-[9px]">
                          Get Hint ✦
                        </button>
                      </div>
                    </div>

                    {/* Result Footer */}
                    <div className="p-2.5 bg-slate-50 flex items-center justify-between text-[10px] font-bold">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-[9px]">✓</span>
                        <span>Output: 8</span>
                      </div>
                      <button onClick={runCode} className="px-3 py-1 rounded bg-slate-900 text-white font-bold hover:bg-slate-800 text-[9px]">
                        ➔ Run
                      </button>
                    </div>
                  </div>

                  {/* Slider Progress */}
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-900 pt-1">
                    <span className="uppercase text-slate-400 tracking-wider">Concept mastery</span>
                    <span className="flex items-center gap-2">
                      <span>72%</span>
                      <span className="text-slate-400">← Keep going!</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full border-2 border-slate-900 overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full" style={{ width: '72%' }} />
                  </div>
                </motion.div>
              )}

              {/* 3. Career Visual (flowchart and table) */}
              {activeSection === 2 && (
                <motion.div
                  key="career-vis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-center gap-4"
                >
                  <div className="text-left">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">🎯 SKILLPILOT · Pipeline map</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1 font-mono">Job Skill GAP Map</h4>
                    <div className="h-[2px] bg-slate-900 w-32 mt-1 rounded-full" />
                  </div>

                  <div className="bg-[#FAF9F6] border-2 border-slate-900 p-6 rounded-xl shadow-[3px_3px_0px_0px_#0f172a] space-y-4">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Interactive Goal Flowchart</span>
                    <div className="mt-4 space-y-3">
                      {[
                        { label: "TARGET ROLE", val: '"I want to become a Software Engineer"' },
                        { label: "REQUIRED SKILLS", val: "Python, DSA, System Design, SQL" },
                        { label: "SKILL GAPS", val: "DSA, System Design" },
                        { label: "LEARNING PATH", val: "Focus on Trees, Graphs & Cache architecture" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border-2 border-slate-900 bg-white flex items-center justify-center text-[10px] font-mono font-bold text-slate-900 shadow-[1px_1px_0px_0px_#000]">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider font-mono">{item.label}</div>
                            <div className="text-xs text-slate-800 font-semibold font-mono">{item.val}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 4. Research Visual (Compiler workflow steps) */}
              {activeSection === 3 && (
                <motion.div
                  key="research-vis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-center space-y-4"
                >
                  <div className="text-left">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">🔬 RESEARCH WORKSPACE</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1 font-mono">Literature Review pipeline</h4>
                    <div className="h-[2px] bg-slate-900 w-32 mt-1 rounded-full" />
                  </div>

                  <div className="bg-white p-6 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">RESEARCH PIPELINE WORKFLOW</span>
                    <div className="space-y-2">
                      {[
                        "PAPERS (Search indexed literature)",
                        "UNDERSTAND (Abstract key findings)",
                        "COMPARE (Analyze methods & parameters)",
                        "IDENTIFY LIMITATIONS (Pinpoint scope boundaries)",
                        "EXPLORE POTENTIAL GAPS (Formulate hypotheses)"
                      ].map((step, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 border-2 border-slate-900 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2.5 font-mono shadow-[1px_1px_0px_0px_#000]">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 5. Passport Visual (Verifiable Skill Passport Record) */}
              {activeSection === 4 && (
                <motion.div
                  key="passport-vis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-center space-y-4"
                >
                  <div className="text-left">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest">🛡️ SECURE VERIFICATION</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1 font-mono">Decentralized Credentials</h4>
                    <div className="h-[2px] bg-slate-900 w-32 mt-1 rounded-full" />
                  </div>

                  <div className="bg-white p-6 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a]">
                    <div className="border-2 border-slate-900 bg-slate-50 p-5 rounded-lg space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 font-mono tracking-wider">SKILL PASSPORT RECORD</h4>
                          <p className="text-[8px] text-slate-400 font-mono font-bold uppercase">Cryptographically Verified</p>
                        </div>
                        <Award className="h-5 w-5 text-slate-900" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white p-2 rounded border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000]">
                          <span className="text-[9px] text-slate-500 font-semibold font-mono">Python</span>
                          <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">88%</div>
                        </div>
                        <div className="bg-white p-2 rounded border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000]">
                          <span className="text-[9px] text-slate-500 font-semibold font-mono">DSA</span>
                          <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">76%</div>
                        </div>
                        <div className="bg-white p-2 rounded border-2 border-slate-900 shadow-[1px_1px_0px_0px_#000]">
                          <span className="text-[9px] text-slate-500 font-semibold font-mono">ML</span>
                          <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">64%</div>
                        </div>
                      </div>

                      <div className="border-t-2 border-slate-900 pt-3 space-y-1.5 text-[10px] font-semibold font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>Evaluated Projects</span>
                          <span className="font-semibold text-slate-800">4</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>GitHub Integration</span>
                          <span className="font-semibold text-slate-900">Connected ✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>







      {/* 17. x402 Technical Credibility Section */}
      <section className="py-24 border-t border-slate-100 bg-[#FAF9F6]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 font-bold text-xs tracking-wider uppercase font-mono shadow-sm">
              Infrastructure
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Powered by x402</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
              SikhoAI uses x402 to provide HTTP-native pay-per-use access to specialized learning services. Each paid request specifies the resource, price and payment requirements before the service is delivered.
            </p>
          </div>

          {/* Video in screen mockup */}
          <div className="max-w-4xl mx-auto">
            {/* Screen mockup outer frame */}
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xl">
              {/* Screen top bar */}
              <div className="flex items-center gap-2 px-4 py-3.5 bg-slate-50 border-b border-slate-250/70">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-4 flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] text-slate-500 font-mono truncate max-w-md shadow-inner">
                  sikhoai.app · x402 · pay-per-use
                </div>
              </div>
              {/* Video */}
              <video
                src="/Exactly_—_you_want_a_pure_work.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full block"
                style={{ display: "block", lineHeight: 0 }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 19. Footer Section */}
      <footer className="border-t border-slate-900 bg-[#111111] py-16 px-4 sm:px-6 lg:px-8 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 items-start">
          
          {/* Left Column Brand copy */}
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain rounded" />
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-sm tracking-wide">Your AI Learning Workspace</h4>
              <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                Learn. Prepare. Create. Build. Grow. Research.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Turn your goals into skills, projects and real-world outcomes — with AI-powered learning and pay-per-use services.
              </p>
            </div>
          </div>

          {/* Product Column */}
          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide">Product</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li><a href="#sticky-section-labs" className="hover:text-white transition-all">Learn</a></li>
              <li><a href="#sticky-section-labs" className="hover:text-white transition-all">Prepare</a></li>
              <li><a href="#sticky-section-labs" className="hover:text-white transition-all">Create</a></li>
              <li><a href="#sticky-section-build" className="hover:text-white transition-all">Build</a></li>
              <li><a href="#sticky-section-career" className="hover:text-white transition-all">Career</a></li>
              <li><a href="#sticky-section-research" className="hover:text-white transition-all">Research</a></li>
              <li><a href="#sticky-section-passport" className="hover:text-white transition-all">Skill Passport</a></li>
            </ul>
          </div>

          {/* Explore Column */}
          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide">Explore</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-all">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-all">AI Tutor</a></li>
              <li><a href="#" className="hover:text-white transition-all">Labs & Simulations</a></li>
              <li><a href="#" className="hover:text-white transition-all">Projects</a></li>
              <li><a href="#" className="hover:text-white transition-all">Open Source</a></li>
              <li><a href="#" className="hover:text-white transition-all">Hackathons</a></li>
              <li><a href="#" className="hover:text-white transition-all">Research Workspace</a></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide">Company</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-all">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-all">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-all">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-all">Community</a></li>
              <li><a href="#" className="hover:text-white transition-all">FAQ</a></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="md:col-span-2 space-y-3.5 text-xs font-semibold">
            <h5 className="font-bold text-white tracking-wide">Legal</h5>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li><a href="#" className="hover:text-white transition-all">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-all">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-all">Refund Policy</a></li>
              <li><a href="#" className="hover:text-white transition-all">Cookie Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Center Bottom Copyright bar */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-900/65 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 font-semibold gap-4">
          <span>&copy; {new Date().getFullYear()} SikhoAI. All rights reserved.</span>
          <span className="text-slate-400 font-bold">Pay-per-use powered by x402 &bull; Algorand</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400 transition-all">GitHub</a>
            <a href="#" className="hover:text-slate-400 transition-all">LinkedIn</a>
            <a href="#" className="hover:text-slate-400 transition-all">X</a>
          </div>
        </div>
      </footer>

      {/* Mock x402 Modal */}
      <AnimatePresence>
        {showX402Modal && activeService && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full font-mono text-xs text-slate-655 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-rose-600 font-bold">HTTP 402</span>
                  <h3 className="text-slate-900 font-bold mt-0.5">Payment Required</h3>
                </div>
                <Shield className="h-5 w-5 text-indigo-650" />
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 font-semibold">Service:</span>
                  <div className="text-slate-900 font-bold">{activeService.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Price:</span>
                  <div className="text-indigo-600 font-bold">{activeService.price} USDC</div>
                </div>
                <div className="text-[10px] text-slate-450 leading-relaxed font-semibold">
                  Headers Sent:<br />
                  <span className="text-indigo-605">Payment-Recipient:</span> AVM_SERVER_ADDR...<br />
                  <span className="text-indigo-605">Payment-Token-Standard:</span> AVM_USDC
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  onClick={confirmPayment}
                  className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-500 font-bold text-white rounded transition-all shadow-sm"
                >
                  Sign & Pay via Wallet
                </button>
                <button 
                  onClick={() => setShowX402Modal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-all font-bold"
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
