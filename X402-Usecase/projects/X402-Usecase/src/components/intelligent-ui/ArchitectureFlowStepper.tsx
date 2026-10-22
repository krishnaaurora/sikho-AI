import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
  Globe, Shield, Layers, Cpu, Database, Sparkles, CheckCircle2
} from 'lucide-react';
import type { FlowStepNode } from './types';

interface ArchitectureFlowStepperProps {
  steps: FlowStepNode[];
  conceptTitle?: string;
}

const NODE_ICONS: Record<string, React.ReactNode> = {
  client: <Globe size={16} />,
  gateway: <Shield size={16} />,
  queue: <Layers size={16} />,
  worker: <Cpu size={16} />,
  cache: <Sparkles size={16} />,
  database: <Database size={16} />,
  ai: <Sparkles size={16} />,
};

const NODE_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  client: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', ring: 'ring-blue-400' },
  gateway: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', ring: 'ring-indigo-400' },
  queue: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', ring: 'ring-amber-400' },
  worker: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', ring: 'ring-purple-400' },
  cache: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', ring: 'ring-cyan-400' },
  database: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', ring: 'ring-emerald-400' },
  ai: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', ring: 'ring-pink-400' },
};

export const ArchitectureFlowStepper: React.FC<ArchitectureFlowStepperProps> = ({ steps, conceptTitle }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        No architectural flow defined for this concept.
      </div>
    );
  }

  const currentStep = steps[activeStep];
  const color = NODE_COLORS[currentStep.nodeType] || NODE_COLORS.worker;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-base font-black text-slate-900">
            {conceptTitle ? `${conceptTitle} Execution Flow` : 'Step-by-Step Architecture'}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Step {activeStep + 1} of {steps.length} — Interactive lifecycle walkthrough
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={13} /> Pause
              </>
            ) : (
              <>
                <Play size={13} /> Auto-Step
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveStep(0);
            }}
            title="Reset to first step"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Stepper Timeline Progress Bar */}
      <div className="relative pt-2 pb-1">
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 -z-0 rounded-full" />
        <div
          className="absolute top-5 left-0 h-1 bg-indigo-600 -z-0 rounded-full transition-all duration-300"
          style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
        />

        <div className="flex items-center justify-between relative z-10">
          {steps.map((st, idx) => {
            const isPassed = idx <= activeStep;
            const isCurrent = idx === activeStep;
            const nodeStyle = NODE_COLORS[st.nodeType] || NODE_COLORS.worker;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(idx);
                }}
                className="flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                    isCurrent
                      ? `${nodeStyle.bg} ${nodeStyle.text} border-2 ${nodeStyle.border} ring-4 ${nodeStyle.ring}/20 scale-110 shadow-sm`
                      : isPassed
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  {isPassed && !isCurrent ? <CheckCircle2 size={16} /> : NODE_ICONS[st.nodeType] || idx + 1}
                </div>
                <span
                  className={`text-[10px] font-bold mt-2 truncate max-w-[80px] sm:max-w-none transition-colors ${
                    isCurrent ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {st.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`p-6 rounded-2xl border-2 ${color.border} ${color.bg} shadow-sm space-y-4`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl bg-white shadow-xs ${color.text}`}>
                {NODE_ICONS[currentStep.nodeType] || <Cpu size={16} />}
              </span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Step {currentStep.step || activeStep + 1} • {currentStep.nodeType.toUpperCase()} NODE
                </span>
                <h3 className="text-lg font-black text-slate-900">{currentStep.title}</h3>
              </div>
            </div>

            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold rounded-xl shadow-xs">
              {currentStep.highlight}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white/70 p-4 rounded-xl border border-white/80">
            {currentStep.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          disabled={activeStep === 0}
          onClick={() => {
            setIsPlaying(false);
            setActiveStep((prev) => Math.max(0, prev - 1));
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronLeft size={14} /> Back
        </button>

        <button
          type="button"
          disabled={activeStep === steps.length - 1}
          onClick={() => {
            setIsPlaying(false);
            setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Proceed Step <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
