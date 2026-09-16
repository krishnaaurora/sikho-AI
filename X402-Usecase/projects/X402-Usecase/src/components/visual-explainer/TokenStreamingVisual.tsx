import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Clock, Zap, CheckCircle2, Play, Pause } from 'lucide-react';

interface TokenStreamingVisualProps {
  stepNumber: number;
  isPlaying: boolean;
}

const SAMPLE_WORDS = [
  "the", "trace", "says", "your", "worker", "died", "waiting", "on", "a", "lock.", 
  "two", "jobs", "grab", "the", "same", "rows", "in", "opposite", "order.", "lock", "them"
];

export const TokenStreamingVisual: React.FC<TokenStreamingVisualProps> = ({
  stepNumber,
  isPlaying,
}) => {
  const [wordIndex, setWordIndex] = useState(0);

  // Word streaming ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev >= SAMPLE_WORDS.length ? 0 : prev + 1));
    }, 450);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const streamedWords = SAMPLE_WORDS.slice(0, wordIndex);

  return (
    <div className="relative w-full max-w-3xl flex flex-col items-center">
      {/* Counters & Comparison Telemetry (Left vs Right) */}
      <div className="w-full flex items-center justify-between px-4 mb-6 font-mono text-xs">
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider text-amber-500/80 font-bold">You've Read</span>
          <span className="text-3xl font-black text-amber-400">
            {stepNumber === 1 ? '0' : wordIndex > 18 ? '21' : '0'}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 font-bold">You've Read</span>
          <span className="text-3xl font-black text-cyan-300">
            {stepNumber === 1 ? '0' : wordIndex}
          </span>
        </div>
      </div>

      {/* ── TOP ISOMETRIC BLOCK: THE MODEL ── */}
      <div className="relative z-10 flex flex-col items-center mb-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold mb-1">
          The Model
        </div>
        <div className="text-xs text-slate-400 font-mono mb-2">writes one word at a time</div>

        {/* Futuristic Wireframe Model Box */}
        <div className="relative px-8 py-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e192f] border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.35)] flex flex-col items-center">
          <div className="flex items-center gap-3">
            <Cpu size={22} className="text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div className="px-3 py-1 rounded bg-slate-950 border border-cyan-500/50 font-mono text-xs text-cyan-200 font-bold min-w-[70px] text-center shadow-inner">
              {isPlaying && SAMPLE_WORDS[wordIndex % SAMPLE_WORDS.length]}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPARATIVE ISOMETRIC LANES: NO STREAMING (LEFT) vs STREAMING (RIGHT) ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* LEFT: NO STREAMING */}
        <div className="p-5 rounded-2xl bg-[#090e1c] border-2 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400">The Buffer</span>
              <span className="text-[10px] font-mono text-slate-500">First word: 3.0s</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mb-4">holds every finished word until completion</p>

            {/* Simulated Waiting Board */}
            <div className="h-36 rounded-xl bg-black/50 border border-amber-500/30 p-4 flex flex-col items-center justify-center text-center">
              {wordIndex < 18 ? (
                <div className="space-y-2">
                  <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-xl font-black text-amber-400 font-mono">2.6s</div>
                  <div className="text-[10px] text-amber-300/70 font-mono">still waiting for whole response...</div>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-amber-200 text-left leading-relaxed">
                  {SAMPLE_WORDS.join(" ")}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <div className="text-xs font-black text-amber-400 uppercase tracking-wider">No Streaming</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">the reply waits until it's completely generated</div>
          </div>
        </div>

        {/* RIGHT: STREAMING (INSTANT) */}
        <div className="p-5 rounded-2xl bg-[#090e1c] border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase font-bold text-cyan-300">Live SSE Stream</span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">First word: 0.1s</span>
            </div>
            <p className="text-[11px] text-cyan-300/70 font-mono mb-4">each word shows the millisecond it is calculated</p>

            {/* Live Streaming Words Board */}
            <div className="h-36 rounded-xl bg-black/50 border border-cyan-500/40 p-4 overflow-hidden flex flex-wrap gap-1 content-start font-mono text-[11px] leading-relaxed">
              {streamedWords.map((word, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono"
                >
                  {word}
                </motion.span>
              ))}
              {isPlaying && (
                <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 self-center" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <div className="text-xs font-black text-cyan-400 uppercase tracking-wider">Streaming Active</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">streaming sends each word the moment it exists</div>
          </div>
        </div>

      </div>
    </div>
  );
};
