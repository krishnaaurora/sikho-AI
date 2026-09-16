import React from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/button';

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  isSpeaking: boolean;
  onPlayPause: () => void;
  onReplay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleSpeech: () => void;
  onSelectStep: (stepNumber: number) => void;
}

export const StepControls: React.FC<StepControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  isSpeaking,
  onPlayPause,
  onReplay,
  onNext,
  onPrev,
  onToggleSpeech,
  onSelectStep,
}) => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200">
      
      {/* Step Indicators / Timeline */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-slate-400 font-bold mr-1">
          STEP {currentStep} / {totalSteps}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <button
              key={step}
              onClick={() => onSelectStep(step)}
              className={`h-2 rounded-full transition-all ${
                step === currentStep
                  ? 'w-7 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                  : step < currentStep
                  ? 'w-2.5 bg-cyan-700'
                  : 'w-2.5 bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Jump to Step ${step}`}
            />
          ))}
        </div>
      </div>

      {/* Main Playback Buttons */}
      <div className="flex items-center gap-2">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentStep <= 1}
          className="rounded-xl border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>

        {/* Play / Pause */}
        <Button
          size="sm"
          onClick={onPlayPause}
          className={`rounded-xl px-4 font-bold shadow-md transition-all ${
            isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              : 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 shadow-cyan-500/20'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause size={16} className="mr-1 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play size={16} className="mr-1 fill-current" />
              <span>Play</span>
            </>
          )}
        </Button>

        {/* Replay */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReplay}
          className="rounded-xl border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700"
          title="Replay animation"
        >
          <RotateCcw size={15} />
        </Button>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentStep >= totalSteps}
          className="rounded-xl border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Audio Narration Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSpeech}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
            isSpeaking
              ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          {isSpeaking ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span>{isSpeaking ? 'Narrating' : 'Voice Off'}</span>
        </button>
      </div>

    </div>
  );
};
