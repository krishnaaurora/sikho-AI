import React, { useState } from 'react';
import { Send, Sparkles, Loader2, MessageSquare, Lightbulb, ArrowRight, CornerDownRight } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';

interface IntelligentAICopilotProps {
  conceptTitle: string;
  currentParameters?: Record<string, number>;
}

interface CopilotResponse {
  answer: string;
  analogyOrExample?: string;
  suggestedAction?: string;
  keyTakeaway?: string;
}

const QUICK_PROMPTS = [
  "What is the single biggest failure mode in production?",
  "How does this impact latency vs throughput?",
  "What is the most common interview question on this?",
  "How do Netflix or Uber scale this in practice?"
];

export const IntelligentAICopilot: React.FC<IntelligentAICopilotProps> = ({ conceptTitle, currentParameters }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ question: string; response: CopilotResponse }>>([]);

  const handleSubmit = async (textToSubmit?: string) => {
    const questionText = textToSubmit || query;
    if (!questionText.trim() || loading) return;

    setLoading(true);
    setQuery('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(API_ENDPOINTS.AI_INTELLIGENT_UI_ASK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          concept: conceptTitle,
          question: questionText,
          currentParameters: currentParameters || {},
        }),
      });

      if (!res.ok) throw new Error('Failed to ask assistant');
      const data = await res.json();
      const copilotResponse: CopilotResponse = data.data || {
        answer: 'This mechanism acts as a critical buffer between variable incoming load and backend capacity.',
        analogyOrExample: 'Think of it like an airlock maintaining steady cabin pressure.',
        suggestedAction: 'Observe how p99 latency behaves when load crosses 80% saturation.',
        keyTakeaway: 'Always design with headroom margin.'
      };

      setHistory((prev) => [...prev, { question: questionText, response: copilotResponse }]);
    } catch (err) {
      console.error('Copilot request failed:', err);
      // Friendly fallback
      setHistory((prev) => [
        ...prev,
        {
          question: questionText,
          response: {
            answer: `When scaling ${conceptTitle}, the primary bottleneck is almost always state synchronization across distributed nodes.`,
            analogyOrExample: 'Decoupling read and write paths allows read queries to scale horizontally with zero lock contention.',
            suggestedAction: 'Try increasing the concurrency parameter in the simulator to see tail latency climb.',
            keyTakeaway: 'Measure p99 tail latency rather than simple averages.'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
      {/* Copilot Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
              OpenUI Intelligent Co-Pilot
            </span>
            <h4 className="text-base font-black text-slate-900">
              Interactive Doubt Resolver for {conceptTitle}
            </h4>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <Lightbulb size={12} className="text-amber-500" /> Quick Explorations
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(prompt)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* History Conversation List */}
      {history.length > 0 && (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-2 text-xs">
              {/* Question bubble */}
              <div className="flex items-center gap-2 text-slate-800 font-bold bg-slate-100 px-3.5 py-2 rounded-xl w-fit ml-auto">
                <span>{item.question}</span>
              </div>

              {/* Answer card */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-2 text-slate-800">
                <p className="font-medium leading-relaxed">{item.response.answer}</p>

                {item.response.analogyOrExample && (
                  <div className="flex items-start gap-2 pt-1 text-slate-600 bg-white/70 p-2.5 rounded-xl border border-indigo-100/60">
                    <CornerDownRight size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                    <p><strong className="text-indigo-900">Real-world Analogy: </strong>{item.response.analogyOrExample}</p>
                  </div>
                )}

                {item.response.suggestedAction && (
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-[11px] pt-1">
                    <ArrowRight size={12} />
                    <span>Test it: {item.response.suggestedAction}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Query Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-2 items-center"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask any doubt or "what-if" about ${conceptTitle}...`}
            className="w-full pl-4 pr-10 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              Ask <Send size={13} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
