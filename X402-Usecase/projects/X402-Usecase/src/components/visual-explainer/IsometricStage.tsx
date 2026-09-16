import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Layers } from 'lucide-react';

interface IsometricStageProps {
  children: React.ReactNode;
  conceptTitle: string;
  conceptSubtitle?: string;
  authorBadge?: string;
  leftMetric?: { label: string; value: string };
  rightMetric?: { label: string; value: string };
  caption?: string;
}

export const IsometricStage: React.FC<IsometricStageProps> = ({
  children,
  conceptTitle,
  conceptSubtitle,
  authorBadge = "@sikho.ai",
  leftMetric,
  rightMetric,
  caption,
}) => {
  return (
    <div className="relative w-full rounded-3xl bg-[#070b14] border border-cyan-500/20 shadow-[0_0_50px_-12px_rgba(6,182,212,0.25)] overflow-hidden text-slate-100 select-none">
      {/* Blueprint Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #06b6d4 1px, transparent 1px),
            linear-gradient(to bottom, #06b6d4 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Cyber ambient glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Section */}
      <div className="relative z-10 pt-6 px-6 pb-2 text-center border-b border-slate-800/80 bg-[#070b14]/70 backdrop-blur-md">
        {/* Author badge & Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[11px] font-mono text-cyan-400 mb-2 shadow-inner">
          <Sparkles size={12} className="text-cyan-400 animate-pulse" />
          <span>{authorBadge}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Interactive Concept Blueprint</span>
        </div>

        {/* Glowing Title */}
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>{conceptTitle}</span>
        </h2>

        {conceptSubtitle && (
          <p className="text-xs md:text-sm text-cyan-300/80 font-mono mt-1 max-w-xl mx-auto">
            {conceptSubtitle}
          </p>
        )}

        {/* Metrics Banner */}
        <div className="mt-4 flex items-center justify-between max-w-2xl mx-auto px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{leftMetric?.label || 'TELEMETRY'}:</span>
            <span className="text-amber-400 font-bold">{leftMetric?.value || 'Live'}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400">{rightMetric?.label || 'SYSTEM STATUS'}:</span>
            <span className="text-cyan-400 font-bold">{rightMetric?.value || 'Optimal'}</span>
          </div>
        </div>
      </div>

      {/* Main Isometric Stage Container */}
      <div className="relative z-10 w-full min-h-[420px] md:min-h-[500px] flex items-center justify-center p-4 md:p-8">
        {children}
      </div>

      {/* Floating Bottom Caption Capsule */}
      {caption && (
        <div className="relative z-10 px-6 pb-6 text-center">
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-950/90 border border-cyan-500/40 text-xs md:text-sm text-cyan-200 font-medium shadow-2xl backdrop-blur-xl"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{caption}</span>
          </motion.div>
        </div>
      )}
    </div>
  );
};
