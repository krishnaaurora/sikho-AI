import React, { useState } from "react";
import { Check, ShieldCheck, Loader2 } from "lucide-react";

interface ServiceItem {
  id: string;
  tabLabel: string;
  title: string;
  description: string;
  bullets: string[];
  price: string;
  icon: string;
  color: string;
}

const SERVICES: ServiceItem[] = [
  {
    id: "learn",
    tabLabel: "Learn",
    title: "🧠 Deep Explanation Service",
    description: "Generate targeted conceptual modules and multi-layered explanations for any complex topic on the fly.",
    bullets: [
      "Targeted knowledge injection",
      "Dynamic analogies & visual diagrams",
      "Adaptive vocabulary based on level"
    ],
    price: "$0.002",
    icon: "🧠",
    color: "bg-slate-50 text-slate-800 border-slate-900"
  },
  {
    id: "practice",
    tabLabel: "Practice",
    title: "📝 Adaptive Mock Assessment",
    description: "Formulate customized questions to analyze your specific learning gaps with instant detailed grading.",
    bullets: [
      "Custom scenario generation",
      "Time-limit simulations",
      "Algorand-grade credentials proof"
    ],
    price: "$0.005",
    icon: "📝",
    color: "bg-slate-50 text-slate-800 border-slate-900"
  },
  {
    id: "build",
    tabLabel: "Build",
    title: "💻 Deep Code Review",
    description: "Execute static architectural analysis and receive targeted modular improvement recommendations.",
    bullets: [
      "Syntax & optimization audit",
      "Complex architecture diagrams",
      "Algorithmic execution profiling"
    ],
    price: "$0.005",
    icon: "💻",
    color: "bg-slate-50 text-slate-800 border-slate-900"
  },
  {
    id: "career",
    tabLabel: "Career",
    title: "📊 Job Match Analysis",
    description: "Cross-reference your skill credentials against targeted technical job specs to discover hiring gaps.",
    bullets: [
      "Functional gaps list mapping",
      "SikhoAI passport validation",
      "Dynamic roadmap adjustments"
    ],
    price: "$0.005",
    icon: "📊",
    color: "bg-slate-50 text-slate-800 border-slate-900"
  },
  {
    id: "research",
    tabLabel: "Research",
    title: "🔬 Multi-Paper Analysis",
    description: "Ingest and cross-compare scientific publications to extract novel insights and methodology gaps.",
    bullets: [
      "Method comparisons matrices",
      "Academic novelty detection",
      "Interactive context queries"
    ],
    price: "$0.010",
    icon: "🔬",
    color: "bg-slate-50 text-slate-800 border-slate-900"
  }
];

export default function InteractiveUnlockCard() {
  const [activeTab, setActiveTab] = useState<string>("learn");
  const [status, setStatus] = useState<"idle" | "requesting" | "paying" | "verified" | "unlocked">("idle");
  const [log, setLog] = useState<string>("");

  const current = SERVICES.find(s => s.id === activeTab) || SERVICES[0];

  const handleUnlock = () => {
    setStatus("requesting");
    setLog("Initializing API request: /services/unlock");

    setTimeout(() => {
      setStatus("paying");
      setLog("Status: 402 Payment Required. Initiating x402 handshake via Algorand network...");
      
      setTimeout(() => {
        setStatus("verified");
        setLog("Transaction signed. Verifying micropayment ledger entry...");
        
        setTimeout(() => {
          setStatus("unlocked");
          setLog("Ledger payment verified! Unlocking specialized experience workspace.");
        }, 1200);
      }, 1500);
    }, 1000);
  };

  const resetCard = (tabId: string) => {
    setActiveTab(tabId);
    setStatus("idle");
    setLog("");
  };

  return (
    <div className="bg-[#FAF9F6] border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_#0f172a] overflow-hidden max-w-xl mx-auto">
      {/* Header bar / tab selector */}
      <div className="bg-white border-b-2 border-slate-900 px-6 py-4">
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3">What do you want to do?</p>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              onClick={() => resetCard(s.id)}
              className={`px-3 py-1.5 rounded border-2 border-slate-900 text-xs font-mono font-bold transition-all ${
                activeTab === s.id
                  ? "bg-slate-900 border-slate-900 text-white shadow-none"
                  : "bg-white border-slate-900 text-slate-800 hover:bg-slate-50 shadow-[1px_1px_0px_0px_#000]"
              }`}
            >
              {s.tabLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main card body */}
      <div className="p-6 sm:p-8 min-h-[340px] flex flex-col justify-between bg-white">
        {status === "idle" && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded border-2 border-slate-900 flex items-center justify-center text-xl font-semibold bg-slate-50 shadow-[1px_1px_0px_0px_#000]">
                {current.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-lg leading-tight font-mono">{current.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed font-mono">{current.description}</p>
              </div>
            </div>

            <div className="space-y-2">
              {current.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600 font-medium font-mono">
                  <span className="text-slate-800 font-bold">→</span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-slate-900 pt-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Service Fee</p>
                <p className="text-xl font-mono font-black text-slate-900">{current.price} <span className="text-xs text-slate-500 font-normal">USD</span></p>
              </div>
              <button
                onClick={handleUnlock}
                className="px-5 py-3 rounded border-2 border-slate-800 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 font-mono shadow-[2px_2px_0px_0px_#000]"
              >
                <span>Unlock Experience</span>
                <span className="text-[10px] opacity-75 font-mono">x402</span>
              </button>
            </div>
          </div>
        )}

        {/* Animation states (handshake & transaction workflow) */}
        {(status === "requesting" || status === "paying" || status === "verified") && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]">
                <Loader2 className="h-7 w-7 text-slate-900 animate-spin" />
              </div>
            </div>
            <div className="w-full text-center space-y-2">
              <p className="text-sm font-bold text-slate-900 font-mono">Processing Request</p>
              <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-4 max-w-sm mx-auto font-mono text-[10px] text-left text-slate-500 leading-normal space-y-1 shadow-[2px_2px_0px_0px_#000]">
                <p className="text-slate-400">&gt; {log}</p>
                {status === "paying" && (
                  <p className="text-slate-900 font-bold animate-pulse">&gt; 402 PAYMENT REQUIRED</p>
                )}
                {status === "verified" && (
                  <p className="text-slate-900 font-bold animate-pulse">&gt; VERIFYING PAYMENT PROOF...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "unlocked" && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-slate-900 font-mono">Experience Unlocked</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-mono">
                Ledger micropayment verified. Your custom workspace is ready and loaded.
              </p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3.5 w-full text-left font-mono text-[10px] text-slate-800 space-y-0.5 shadow-[2px_2px_0px_0px_#000]">
              <p className="font-bold">&gt; x402 Micropayment Complete</p>
              <p>&gt; TxRef: 0x8a92...bfef</p>
              <p>&gt; Service: {current.title}</p>
            </div>
            <button
              onClick={() => resetCard(activeTab)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors font-mono"
            >
              Reset Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
