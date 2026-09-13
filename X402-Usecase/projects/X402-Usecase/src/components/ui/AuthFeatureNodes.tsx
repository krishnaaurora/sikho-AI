import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Bot, 
  Compass, 
  Code2, 
  ShieldCheck, 
  Award, 
  Layers,
  GraduationCap
} from 'lucide-react';

interface FeatureOrCourse {
  id: string;
  tag: string;
  tagType: 'course' | 'feature';
  title: string;
  oneLiner: string;
  icon: React.ElementType;
  color: string;
  bgGlow: string;
  borderColor: string;
  badgeBg: string;
  positionClasses: string;
}

const ITEMS: FeatureOrCourse[] = [
  {
    id: 'x402-pay',
    tag: 'x402 Protocol',
    tagType: 'feature',
    title: 'Instant Micro-Payments',
    oneLiner: 'Unlock lessons per-chapter seamlessly using Algorand blockchain payment rails.',
    icon: Zap,
    color: 'text-amber-400',
    bgGlow: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'border-amber-500/40 hover:border-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    positionClasses: 'top-[16%] left-[6%]',
  },
  {
    id: 'ai-interview',
    tag: 'AI Career Tool',
    tagType: 'feature',
    title: 'AI Interview Pro',
    oneLiner: 'Conduct live technical mock interviews with instant voice analysis and rubric scoring.',
    icon: Bot,
    color: 'text-cyan-400',
    bgGlow: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'border-cyan-500/40 hover:border-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    positionClasses: 'top-[22%] right-[8%]',
  },
  {
    id: 'dynamic-roadmap',
    tag: 'AI Pathfinding',
    tagType: 'feature',
    title: 'Dynamic Learning Roadmaps',
    oneLiner: 'AI analyzes your skill gap and constructs custom step-by-step career journeys.',
    icon: Compass,
    color: 'text-indigo-400',
    bgGlow: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'border-indigo-500/40 hover:border-indigo-400',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    positionClasses: 'top-[36%] left-[12%]',
  },
  {
    id: 'build-studio',
    tag: 'Hands-on Lab',
    tagType: 'feature',
    title: 'Interactive Build Studio',
    oneLiner: 'Audit codebases, scan security vulnerabilities, and apply one-click refactoring patches.',
    icon: Code2,
    color: 'text-emerald-400',
    bgGlow: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    positionClasses: 'top-[44%] right-[10%]',
  },
  {
    id: 'onchain-certs',
    tag: 'Verifiable Web3',
    tagType: 'feature',
    title: 'Algorand On-Chain Badges',
    oneLiner: 'Mint tamper-proof credentials directly to your Algorand wallet upon completing milestones.',
    icon: Award,
    color: 'text-purple-400',
    bgGlow: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    positionClasses: 'top-[56%] left-[8%]',
  },
  {
    id: 'web3-course',
    tag: 'Popular Course',
    tagType: 'course',
    title: 'Full-Stack Web3 & Algorand DApps',
    oneLiner: 'Master smart contracts with PyTeal & Beaker, Algorand SDKs, and decentralized frontends.',
    icon: GraduationCap,
    color: 'text-sky-400',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'border-sky-500/40 hover:border-sky-400',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    positionClasses: 'top-[62%] right-[12%]',
  },
];

export const AuthFeatureNodes: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = ITEMS.find((i) => i.id === activeId) || null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Interactive Floating Node Chips */}
      {ITEMS.map((item, idx) => {
        const Icon = item.icon;
        const isHovered = activeId === item.id;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, idx % 2 === 0 ? -7 : 7, 0]
            }}
            transition={{
              opacity: { duration: 0.5, delay: idx * 0.1 },
              scale: { duration: 0.5, delay: idx * 0.1 },
              y: { repeat: Infinity, duration: 4 + (idx % 3), ease: 'easeInOut', delay: idx * 0.3 }
            }}
            className={`absolute ${item.positionClasses} pointer-events-auto`}
            onMouseEnter={() => setActiveId(item.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <div
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-slate-900/80 border transition-all duration-300 cursor-pointer shadow-lg ${
                isHovered
                  ? `${item.borderColor} ring-2 ring-indigo-500/30 shadow-indigo-500/20 scale-105`
                  : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/95'
              }`}
              style={{
                boxShadow: isHovered ? `0 0 20px ${item.bgGlow}` : undefined,
              }}
            >
              <div className={`p-1 rounded-full ${item.badgeBg}`}>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white tracking-wide">
                {item.title}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.badgeBg}`}>
                {item.tagType === 'course' ? 'COURSE' : 'FEATURE'}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Dynamic Hover Insight Detail Card Display */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[88%] max-w-md pointer-events-none">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeItem.badgeBg}`}>
                    <activeItem.icon className={`w-4 h-4 ${activeItem.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                      {activeItem.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {activeItem.tag}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${activeItem.badgeBg}`}>
                  {activeItem.tagType === 'course' ? 'Featured Course' : 'Core Feature'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span>{activeItem.oneLiner}</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-800 text-center mx-auto w-fit"
            >
              <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span>Hover over any node to explore Sikho AI features &amp; courses</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthFeatureNodes;
