import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function useRotatingTypewriter(lines: string[], typeSpeed = 40, pause = 2200) {
  const [displayed, setDisplayed] = React.useState("");
  const [lineIdx, setLineIdx] = React.useState(0);
  const [phase, setPhase] = React.useState<"typing" | "holding" | "erasing">("typing");

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const current = lines[lineIdx];
    if (phase === "typing") {
      if (displayed.length < current.length) {
        timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), typeSpeed);
      } else {
        timeout = setTimeout(() => setPhase("holding"), pause);
      }
    } else if (phase === "holding") {
      setPhase("erasing");
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), typeSpeed / 2);
      } else {
        setLineIdx((i) => (i + 1) % lines.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, phase, lineIdx]);

  return displayed;
}

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="14" height="20" rx="1" />
    <path d="M4 7h14M4 11h10M4 15h8" />
    <path d="M18 5v16l6-3V2l-6 3z" />
  </svg>
);

const TargetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="14" cy="14" r="10" />
    <circle cx="14" cy="14" r="6" />
    <circle cx="14" cy="14" r="2" fill="#f97316" />
    <path d="M14 4v4M14 20v4M4 14h4M20 14h4" />
  </svg>
);

const MicroscopeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 4l5 9" />
    <path d="M8 4h8" />
    <path d="M15 13l3-6" />
    <ellipse cx="14" cy="19" rx="7" ry="3" />
    <path d="M7 22h14" />
    <path d="M14 13v6" />
  </svg>
);

const BarMeter = ({ label, pct }: { label: string; pct: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between">
      <span className="font-semibold text-xs text-slate-700">{label}</span>
      <span className="font-mono text-xs text-slate-500">{pct}%</span>
    </div>
    <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
      <motion.div
        style={{ height: "100%", background: "#f97316", borderRadius: 2 }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  </div>
);

const LEARN_HOVER = (
  <div className="space-y-4">
    <div>
      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">Your Path</p>
      <div className="space-y-1.5">
        {[["01","Python Fundamentals",true],["02","Functions",false],["03","OOP",false],["04","Data Structures",false]].map(([n,label,done]) => (
          <div key={String(n)} className="flex items-center gap-2">
            <span className="text-[11px] font-bold w-4" style={{ color: done ? "#6366f1" : "#cbd5e1" }}>{done ? "✓" : "○"}</span>
            <span className="text-[11px] font-medium" style={{ color: done ? "#1e293b" : "#64748b" }}>{String(n)} {String(label)}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">Also Available</p>
      {["Interactive Labs","Practice Problems","Skill Assessment"].map(s => (
        <div key={s} className="flex items-center gap-2 py-0.5">
          <span className="text-[11px] text-indigo-500 font-bold">→</span>
          <span className="text-[11px] text-slate-600 font-semibold">{s}</span>
        </div>
      ))}
    </div>
  </div>
);

const CAREER_HOVER = (
  <div className="space-y-4">
    <div>
      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-3">Your Skill Gap</p>
      <div className="space-y-3">
        <BarMeter label="Python" pct={80} />
        <BarMeter label="Machine Learning" pct={60} />
        <BarMeter label="Deep Learning" pct={35} />
        <BarMeter label="Projects" pct={20} />
      </div>
    </div>
    <div className="border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">Next Steps</p>
      {["Build ML project","Improve GitHub","Practice interview"].map(s => (
        <div key={s} className="flex items-center gap-2 py-0.5">
          <span className="text-[11px] text-orange-500 font-bold">→</span>
          <span className="text-[11px] text-slate-600 font-semibold">{s}</span>
        </div>
      ))}
    </div>
  </div>
);

const RESEARCH_HOVER = (
  <div className="space-y-3">
    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Research Workspace</p>
    <div>
      {["Upload papers","Compare methods","Find limitations","Discover research gaps","Plan experiments"].map((step,i,arr) => (
        <div key={step}>
          <div className="flex items-center gap-2.5 py-1">
            <span className="text-[11px] text-blue-500 font-bold w-4 text-center">{i+1}</span>
            <span className="text-[11px] text-slate-655 font-semibold">{step}</span>
          </div>
          {i < arr.length-1 && <div className="ml-[18px] text-[10px] text-slate-300 leading-none">↓</div>}
        </div>
      ))}
    </div>
  </div>
);

type CardDef = {
  num: string; label: string; Icon: React.FC;
  lines: string[]; hoverContent: React.ReactNode; ctaLabel: string; color: string;
};

const CARDS: CardDef[] = [
  { num: "01", label: "LEARN",    Icon: BookIcon,       lines: ["I want to learn Python.","I want to master DSA.","I want to learn Machine Learning.","I want to build with React."],                        hoverContent: LEARN_HOVER,    ctaLabel: "Continue Learning →", color: "hover:border-indigo-500/80 hover:shadow-indigo-500/5" },
  { num: "02", label: "CAREER",   Icon: TargetIcon,     lines: ["I want to become an ML Engineer.","I want to get into Google.","I want to land an internship.","I want to become a Data Scientist."],          hoverContent: CAREER_HOVER,   ctaLabel: "Build My Career Path →", color: "hover:border-orange-500/80 hover:shadow-orange-500/5" },
  { num: "03", label: "RESEARCH", Icon: MicroscopeIcon, lines: ["I want to research Computer Vision.","I want to analyze research papers.","I want to find a research gap.","I want to publish my first paper."], hoverContent: RESEARCH_HOVER, ctaLabel: "Open Research Workspace →", color: "hover:border-blue-500/80 hover:shadow-blue-500/5" },
];

const GoalCard = ({ card }: { card: CardDef }) => {
  const [hovered, setHovered] = useState(false);
  const text = useRotatingTypewriter(card.lines, 38, 2200);

  return (
    <div
      className={`relative flex flex-col bg-white border border-slate-200/80 rounded-2xl p-7 min-h-[400px] transition-all duration-300 ${
        hovered ? "shadow-xl -translate-y-1" : "shadow-sm"
      } ${card.color}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Card header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100" style={{ width: 44, height: 44 }}>
            <card.Icon />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{card.num}</p>
            <p className="text-[14px] font-black text-slate-900 tracking-wide">{card.label}</p>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <AnimatePresence mode="wait">
            {!hovered ? (
              <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                {/* Typewriter box */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 min-h-[72px] flex items-center shadow-inner">
                  <p className="text-[13px] font-bold text-slate-800 leading-relaxed font-mono">
                    &ldquo;{text}
                    <span className="inline-block align-middle ml-[2px]" style={{ width: 2, height: 13, background: "#6366f1", animation: "blink 0.8s step-end infinite" }} />
                    &rdquo;
                  </p>
                </div>
                {/* Hover hint */}
                <div className="border-t border-slate-100 pt-5 mt-auto flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Hover to explore</span>
                  <span>→</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="hovered" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <p className="text-[11px] font-bold text-slate-400 mb-4 font-mono">&ldquo;{card.lines[0]}&rdquo;</p>
                <div style={{ flex: 1 }}>{card.hoverContent}</div>
                {/* CTA */}
                <div className="border-t border-slate-100 pt-4 mt-4">
                  <button
                    className={`w-full py-3 px-5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                      card.label === "LEARN" ? "bg-indigo-650 hover:bg-indigo-600 shadow-indigo-500/10" :
                      card.label === "CAREER" ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/10" :
                      "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
                    }`}
                  >
                    {card.ctaLabel}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const GoalSection = () => (
  <>
    <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    <section className="py-24 border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] text-indigo-600 font-extrabold tracking-[0.2em] uppercase mb-4">
            Goal-driven learning
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Don't start with a course.<br />
            <span className="relative inline-block text-indigo-600">
              Start with a goal.
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 500 10" preserveAspectRatio="none" fill="none">
                <path d="M2 7 C100 3,250 9,400 5 C450 2,480 8,498 6" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="mt-5 text-slate-500 text-sm leading-relaxed max-w-md">
            Tell SikhoAI what you want to achieve. We'll show you what it takes to get there.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CARDS.map(card => <GoalCard key={card.num} card={card} />)}
        </div>

      </div>
    </section>
  </>
);

export default GoalSection;
