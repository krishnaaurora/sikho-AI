import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import HeroBackground from "@/components/ui/HeroBackground";
import AsciiWave from "@/components/ui/AsciiWave";

const ROTATING_EXAMPLES = [
  "I want to learn Python",
  "I want to master DSA",
  "I want to become an ML Engineer",
  "I want to prepare for a software engineering role",
  "I want to start AI research",
];

const FULL_LINES = [
  "Learn without limits.",
  "Pay only when you need more.",
];

function useTypewriter(lines: string[], speed = 48) {
  const [displayed, setDisplayed] = useState<string[]>(Array(lines.length).fill(""));
  const [done, setDone] = useState(false);

  useEffect(() => {
    let lineIdx = 0;
    let charIdx = 0;
    const tick = setInterval(() => {
      if (lineIdx >= lines.length) {
        setDone(true);
        clearInterval(tick);
        return;
      }
      const currentLine = lines[lineIdx];
      charIdx++;
      setDisplayed((prev) => {
        const next = [...prev];
        next[lineIdx] = currentLine.slice(0, charIdx);
        return next;
      });
      if (charIdx >= currentLine.length) {
        lineIdx++;
        charIdx = 0;
      }
    }, speed);
    return () => clearInterval(tick);
  }, []);

  return { displayed, done };
}

const HandDrawnUnderline = ({ animate }: { animate: boolean }) => (
  <motion.svg
    className="absolute -bottom-2 left-0 w-full"
    viewBox="0 0 400 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <motion.path
      d="M 4 10 C 60 4, 120 16, 200 8 C 280 0, 340 14, 396 9"
      stroke="#F97316"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={animate ? { pathLength: 1, opacity: 1 } : {}}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
    />
    <motion.path
      d="M 8 14 C 70 9, 160 18, 250 12 C 320 7, 370 16, 394 13"
      stroke="#FB923C"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      strokeOpacity={0.4}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={animate ? { pathLength: 1, opacity: 1 } : {}}
      transition={{ duration: 1.0, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
    />
  </motion.svg>
);

const Cursor = () => (
  <motion.span
    className="inline-block w-[3px] h-[0.85em] bg-orange-500 ml-1 align-middle rounded-sm"
    animate={{ opacity: [1, 0, 1] }}
    transition={{ duration: 0.8, repeat: Infinity }}
  />
);

const Hero = () => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const workspaceRef = useRef<HTMLDivElement>(null);

  const { displayed, done } = useTypewriter(FULL_LINES, 48);

  const { scrollYProgress } = useScroll({
    target: workspaceRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const renderLine = (text: string, lineIdx: number) => {
    if (lineIdx === 0) {
      const split = text.indexOf("limits.");
      if (split === -1) return <span className="text-slate-900">{text}</span>;
      return (
        <>
          <span className="text-slate-900">{text.slice(0, split)}</span>
          <span className="text-orange-500">{text.slice(split)}</span>
        </>
      );
    }
    return <span className="text-orange-500">{text}</span>;
  };

  const lastIdx = FULL_LINES.length - 1;
  const lastLineDone = displayed[lastIdx]?.length === FULL_LINES[lastIdx]?.length;

  return (
    <>
      <section className="relative min-h-[88vh] flex items-center overflow-hidden font-sans pt-20">
        <HeroBackground color1="#C7D2FE" color2="#F0F4FF" speed={0.6} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 flex flex-col items-start">
          <div className="mb-7 space-y-1">
            {FULL_LINES.map((_, lineIdx) => {
              const isLast = lineIdx === FULL_LINES.length - 1;
              const isCurrentlyTyping =
                displayed[lineIdx].length > 0 &&
                displayed[lineIdx].length < FULL_LINES[lineIdx].length;
              const nextIsEmpty =
                lineIdx < FULL_LINES.length - 1 &&
                displayed[lineIdx + 1].length === 0;
              const showCursor =
                !done && (isCurrentlyTyping || (displayed[lineIdx].length === FULL_LINES[lineIdx].length && nextIsEmpty));

              return (
                <h1
                  key={lineIdx}
                  className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight"
                >
                  {renderLine(displayed[lineIdx], lineIdx)}
                  {showCursor && <Cursor />}
                  {isLast && (
                    <span className="relative inline-block">
                      <HandDrawnUnderline animate={lastLineDone} />
                    </span>
                  )}
                </h1>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-xl font-medium"
          >
            Access AI-powered learning, practice, tools and expert services —
            pay only for what you need, when you need it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-lg space-y-3"
          >
            <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-indigo-200/80 shadow-xl flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={ROTATING_EXAMPLES[exampleIndex]}
                className="flex-1 px-4 py-3 bg-transparent text-slate-900 border-0 focus:outline-none focus:ring-0 text-sm font-semibold"
              />
              <Button className="rounded-xl px-5 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-white flex items-center gap-1.5">
                <span>Build My Path</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold">
              Free to explore · Pay-per-use powered by x402
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORKSPACE — browser tab + parallax image + ASCII Wave at bottom
      ══════════════════════════════════════════ */}
      <section ref={workspaceRef} className="relative py-24 bg-white overflow-hidden border-t border-slate-100 flex flex-col items-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <motion.div
            style={{ y: imageY, opacity: imageOpacity }}
            className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200/70 bg-white"
          >
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border border-slate-200 shadow-sm">
                <img src="/logo.png" alt="" className="h-3.5 w-3.5 object-contain rounded-sm" />
                <span className="text-[11px] font-bold text-slate-600 tracking-wide">
                  SikhoAI Learning Workspace
                </span>
              </div>
            </div>

            <div className="overflow-hidden bg-[#F5F3FF]">
              <img
                src="/ChatGPT Image Aug 12, 2026, 03_27_06 PM.png"
                alt="SikhoAI Learning Workspace"
                className="w-full h-auto object-contain"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Hero;
