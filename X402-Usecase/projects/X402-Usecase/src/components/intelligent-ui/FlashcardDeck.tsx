import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, ChevronLeft, ChevronRight, Sparkles, HelpCircle, CheckCircle, Flame } from 'lucide-react';
import type { IntelligentUiFlashcard } from './types';

interface FlashcardDeckProps {
  cards: IntelligentUiFlashcard[];
  conceptTitle?: string;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, conceptTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  if (!cards || cards.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        No flashcards available for this concept.
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isMastered = masteredCards.has(currentCard.id);

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastered = (cardId: string) => {
    const updated = new Set(masteredCards);
    if (updated.has(cardId)) {
      updated.delete(cardId);
    } else {
      updated.add(cardId);
    }
    setMasteredCards(updated);
  };

  return (
    <div className="space-y-5">
      {/* Header controls & progress */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
            <Sparkles size={14} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Active Recall Deck</h4>
            <p className="text-[11px] text-slate-500">
              Flip to test memory & master {conceptTitle || 'core definition'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
            <Flame size={12} className="text-emerald-500" />
            {masteredCards.size}/{cards.length} Mastered
          </span>
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div
        className="relative w-full h-72 cursor-pointer perspective-1000 select-none"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1200px' }}
      >
        <motion.div
          className="w-full h-full relative"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* FRONT FACE */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/30 border-2 border-slate-200/90 rounded-3xl p-7 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-indigo-100/70 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {currentCard.category || 'Question'}
              </span>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <RotateCw size={12} /> Click card to flip
              </span>
            </div>

            <div className="my-auto py-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prompt</p>
              <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                {currentCard.front}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              {currentCard.hint ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(!showHint);
                  }}
                  className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-semibold"
                >
                  <HelpCircle size={14} />
                  {showHint ? currentCard.hint : 'Need a hint?'}
                </button>
              ) : (
                <span />
              )}

              <span className="font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1">
                Show Answer →
              </span>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-2 border-indigo-500/40 rounded-3xl p-7 shadow-lg flex flex-col justify-between"
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                Explanation & Key Answer
              </span>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <RotateCw size={12} /> Click to flip back
              </span>
            </div>

            <div className="my-auto py-2">
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1.5">Answer</p>
              <p className="text-base md:text-lg font-medium text-slate-100 leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered(currentCard.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                  isMastered
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <CheckCircle size={13} />
                {isMastered ? 'Mastered!' : 'Mark as Mastered'}
              </button>

              <span className="text-slate-400 font-medium">Card {currentIndex + 1} of {cards.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsFlipped(false);
                setShowHint(false);
                setCurrentIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-6 bg-indigo-600'
                  : masteredCards.has(cards[i].id)
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Card ${i + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
