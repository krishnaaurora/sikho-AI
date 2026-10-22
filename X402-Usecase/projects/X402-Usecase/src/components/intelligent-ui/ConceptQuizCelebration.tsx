import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, RotateCcw, PartyPopper } from 'lucide-react';
import type { ConceptQuiz } from './types';

interface ConceptQuizCelebrationProps {
  quiz: ConceptQuiz;
  conceptTitle?: string;
}

// Lightweight, zero-dependency canvas confetti explosion
const triggerConfetti = () => {
  const count = 60;
  const defaults = { origin: { y: 0.7 } };

  // Create temporary container for flying particle elements if canvas isn't present
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6'];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 6;
    const left = 50 + (Math.random() - 0.5) * 50;
    const top = 50;

    el.style.position = 'absolute';
    el.style.left = `${left}%`;
    el.style.top = `${top}%`;
    el.style.width = `${size}px`;
    el.style.height = `${size * 0.7}px`;
    el.style.backgroundColor = color;
    el.style.borderRadius = '2px';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.transition = `all ${0.8 + Math.random() * 0.8}s cubic-bezier(0.25, 1, 0.5, 1)`;

    container.appendChild(el);

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 300 + 150;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity - 200; // upward bias

      el.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 720}deg)`;
      el.style.opacity = '0';
    });
  }

  setTimeout(() => {
    container.remove();
  }, 2000);
};

export const ConceptQuizCelebration: React.FC<ConceptQuizCelebrationProps> = ({ quiz, conceptTitle }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!quiz || !quiz.options || quiz.options.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        No quiz available for this concept.
      </div>
    );
  }

  const handleSelect = (idx: number) => {
    if (hasSubmitted) return;
    setSelectedOption(idx);
    setHasSubmitted(true);

    if (idx === quiz.answerIndex) {
      triggerConfetti();
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  const isCorrect = selectedOption === quiz.answerIndex;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <HelpCircle size={17} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              Concept Mastery Check
            </span>
            <h4 className="text-base font-black text-slate-900">
              {conceptTitle ? `Verify Your Understanding of ${conceptTitle}` : 'Interactive Challenge'}
            </h4>
          </div>
        </div>

        {hasSubmitted && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw size={13} /> Try Again
          </button>
        )}
      </div>

      {/* Question Prompt */}
      <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200/70">
        <p className="text-base font-bold text-slate-900 leading-snug">
          {quiz.question}
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {quiz.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isAnswer = idx === quiz.answerIndex;

          let btnStyle = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 text-slate-700';

          if (hasSubmitted) {
            if (isAnswer) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/20';
            } else if (isSelected) {
              btnStyle = 'border-red-400 bg-red-50 text-red-950 ring-2 ring-red-300/20';
            } else {
              btnStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect(idx)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left font-medium text-sm transition-all duration-150 ${btnStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                  hasSubmitted && isAnswer
                    ? 'bg-emerald-600 text-white'
                    : hasSubmitted && isSelected
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </div>

              {hasSubmitted && (
                <div className="shrink-0 ml-3">
                  {isAnswer ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : isSelected ? (
                    <XCircle size={18} className="text-red-500" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & Confetti Celebration Banner */}
      <AnimatePresence>
        {hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`p-6 rounded-2xl border-2 space-y-3 ${
              isCorrect
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <PartyPopper size={20} className="text-emerald-600" />
                  <h5 className="font-black text-base text-emerald-800">
                    Correct! Concept Mastered 🎉
                  </h5>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-amber-600" />
                  <h5 className="font-black text-base text-amber-800">
                    Not quite, but great learning moment!
                  </h5>
                </>
              )}
            </div>

            <p className="text-xs leading-relaxed font-medium">
              {quiz.explanation}
            </p>

            {isCorrect && quiz.celebrationText && (
              <div className="pt-2 border-t border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-500 animate-spin" />
                {quiz.celebrationText}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
