import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

interface QuizCardProps {
  challenge: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}

export const QuizCard: React.FC<QuizCardProps> = ({ challenge }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelect = (index: number) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
    setHasSubmitted(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  const isCorrect = selectedOption === challenge.answer;

  return (
    <div className="w-full p-6 rounded-3xl bg-slate-900/90 border border-slate-800 text-white shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <HelpCircle size={18} />
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider block">
            Concept Mastery Check
          </span>
          <h3 className="text-base font-black text-white">Quick Challenge</h3>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-200 mt-2 mb-4 leading-relaxed">
        {challenge.question}
      </p>

      {/* Options List */}
      <div className="space-y-2.5">
        {challenge.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isAnswer = idx === challenge.answer;

          let btnClass = "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40";
          if (hasSubmitted) {
            if (isAnswer) {
              btnClass = "border-emerald-500/80 bg-emerald-950/40 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            } else if (isSelected) {
              btnClass = "border-rose-500/80 bg-rose-950/40 text-rose-200";
            } else {
              btnClass = "opacity-40 border-slate-800 bg-slate-950/30 text-slate-500";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={hasSubmitted}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono text-xs text-slate-400">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </div>

              {hasSubmitted && isAnswer && (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              )}
              {hasSubmitted && isSelected && !isAnswer && (
                <XCircle size={18} className="text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback & Explanation Drawer */}
      <AnimatePresence>
        {hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-slate-800"
          >
            <div className={`p-4 rounded-2xl border ${
              isCorrect
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-2 font-bold text-xs uppercase font-mono mb-1">
                <Sparkles size={14} />
                <span>{isCorrect ? 'Correct! High Five' : 'Not Quite! Here is why:'}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-300 font-sans">
                {challenge.explanation}
              </p>
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
