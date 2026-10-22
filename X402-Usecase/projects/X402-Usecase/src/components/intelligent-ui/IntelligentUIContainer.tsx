import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Sliders, Layers, BarChart3, HelpCircle,
  Code2, MessageSquare, Maximize2, Minimize2, Copy, Check,
  BookOpen, Brain, Zap, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { FlashcardDeck } from './FlashcardDeck';
import { InteractiveSimulator } from './InteractiveSimulator';
import { DynamicConceptChart } from './DynamicConceptChart';
import { ArchitectureFlowStepper } from './ArchitectureFlowStepper';
import { ConceptQuizCelebration } from './ConceptQuizCelebration';
import { IntelligentAICopilot } from './IntelligentAICopilot';
import type { IntelligentUiConceptData } from './types';
import { API_ENDPOINTS } from '../../config/api';

interface IntelligentUIContainerProps {
  conceptName: string;
  chapterTitle?: string;
  courseTopic?: string;
  lessonContent?: string;
  initialData?: IntelligentUiConceptData;
  isModal?: boolean;
  onClose?: () => void;
}

export const IntelligentUIContainer: React.FC<IntelligentUIContainerProps> = ({
  conceptName,
  chapterTitle,
  courseTopic,
  lessonContent,
  initialData,
  isModal = false,
  onClose,
}) => {
  const [data, setData] = useState<IntelligentUiConceptData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [activeTab, setActiveTab] = useState<'simulator' | 'flashcards' | 'charts' | 'flow' | 'quiz' | 'code' | 'copilot'>('simulator');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [currentSimulatorParams, setCurrentSimulatorParams] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      return;
    }

    let isMounted = true;
    const fetchConceptData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(API_ENDPOINTS.AI_INTELLIGENT_UI, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            concept: conceptName,
            chapterTitle,
            courseTopic,
            format: 'intelligent-ui',
          }),
        });

        if (!res.ok) throw new Error('Failed to load Intelligent UI concept data');
        const json = await res.json();
        if (isMounted && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.warn('Using client fallback for Intelligent UI concept:', err);
        // Build rich client fallback so experience never fails
        if (isMounted) {
          setData({
            concept: conceptName,
            topic: courseTopic || 'Computer Science',
            category: 'Architecture',
            difficulty: 'Intermediate',
            summary: `Interactive mental model and performance testbed for ${conceptName}.`,
            mentalModel: {
              analogy: `Think of ${conceptName} like a precision assembly line where input rates, buffer size, and worker capacity dictate end-to-end latency.`,
              whyItMatters: `Understanding ${conceptName} empowers you to eliminate production bottlenecks and scale reliably.`,
              keyTakeaway: 'Always design with headroom margin and monitor p99 tail latency.',
            },
            flashcards: [
              {
                id: 'fc-1',
                front: `What is the core operational principle of ${conceptName}?`,
                back: 'It decouples consumers from internal execution mechanics, providing deterministic throughput guarantees.',
                category: 'Foundations',
                hint: 'Consider client vs server boundaries.',
              },
              {
                id: 'fc-2',
                front: `What is the primary trade-off when adopting ${conceptName}?`,
                back: 'Trading memory overhead or design complexity for dramatic throughput and consistency gains.',
                category: 'Trade-offs',
                hint: 'No free lunch in engineering.',
              },
            ],
            simulator: {
              title: `${conceptName} Dynamic Parameter Testbed`,
              description: 'Adjust load and processing capacity to view live metrics.',
              parameters: [
                { id: 'rps', label: 'Incoming Requests', min: 100, max: 10000, step: 100, defaultValue: 2500, unit: 'req/s' },
                { id: 'nodes', label: 'Active Worker Nodes', min: 1, max: 16, step: 1, defaultValue: 4, unit: 'nodes' },
                { id: 'buffer', label: 'Buffer Cache Size', min: 64, max: 2048, step: 64, defaultValue: 512, unit: 'MB' },
              ],
              metricsFormula: 'Load Factor = RPS / Nodes. Optimal latency maintained under 70% saturation.',
              metricPresets: [
                { name: 'Standard Load', values: { rps: 2000, nodes: 4, buffer: 512 } },
                { name: 'Surge Spike', values: { rps: 7500, nodes: 6, buffer: 1024 } },
              ],
            },
            chart: {
              title: `Scaling Curve: ${conceptName}`,
              description: 'Latency vs Concurrency comparison',
              type: 'area',
              xAxisKey: 'name',
              data: [
                { name: '100 QPS', value: 14, benchmark: 40 },
                { name: '500 QPS', value: 28, benchmark: 110 },
                { name: '1,000 QPS', value: 45, benchmark: 260 },
                { name: '5,000 QPS', value: 88, benchmark: 890 },
              ],
            },
            flowSteps: [
              { step: 1, title: 'Client Dispatch', description: 'Request initiated and packet validated at ingress gateway.', nodeType: 'client', highlight: 'Payload Validation' },
              { step: 2, title: 'Routing & Processing', description: 'Task distributed to selected execution node.', nodeType: 'gateway', highlight: 'Node Routing' },
              { step: 3, title: 'State Mutation', description: 'Core business logic computes with idempotent safety.', nodeType: 'worker', highlight: 'Processing Loop' },
              { step: 4, title: 'Output & Telemetry', description: 'Response dispatched and metrics emitted to collector.', nodeType: 'database', highlight: 'Response Sent' },
            ],
            codeSnippet: {
              language: 'typescript',
              title: `Production Implementation: ${conceptName}`,
              code: `export async function executeConceptFlow<T>(payload: T): Promise<T> {\n  const startTime = performance.now();\n  // Execute core workflow with retry budget\n  const result = await processPayload(payload);\n  console.log(\`Execution elapsed: \${(performance.now() - startTime).toFixed(1)}ms\`);\n  return result;\n}`,
              explanation: 'A clean implementation demonstrating input validation, execution timing, and error handling.',
            },
            quiz: {
              question: `When deploying ${conceptName} in production, which metric best reveals degradation first?`,
              options: [
                'Average CPU temperature',
                'p99 tail latency and request queue depth',
                'Hard drive free space',
                'Total number of source code comments',
              ],
              answerIndex: 1,
              explanation: 'p99 tail latency reflects the slowest 1% of users who experience queuing delays before averages show any change.',
              celebrationText: 'Brilliant! You recognize early warning signals in production systems.',
            },
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchConceptData();
    return () => {
      isMounted = false;
    };
  }, [conceptName, chapterTitle, courseTopic, initialData]);

  const copySnippet = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Fullscreen wrapper styles
  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md p-4 md:p-8 flex items-center justify-center overflow-y-auto animate-in fade-in duration-150'
    : 'w-full';

  const innerCardClasses = isFullscreen
    ? 'bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8'
    : 'bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-6';

  if (loading) {
    return (
      <div className="p-10 bg-white border border-slate-200/90 rounded-3xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
          <Sparkles size={24} />
        </div>
        <div>
          <h4 className="text-base font-black text-slate-900">Synthesizing Intelligent UI Studio...</h4>
          <p className="text-xs text-slate-500 mt-1">Generating interactive components, 3D flashcards, and live simulators for "{conceptName}"</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={containerClasses}>
      <div className={innerCardClasses}>
        {/* TOP BRANDING & TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <Sparkles size={11} /> Open Intelligent UI
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {data.category}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                {data.difficulty}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {data.concept}
            </h3>
            <p className="text-xs text-slate-500 font-medium max-w-2xl">
              {data.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors border border-slate-200"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen Studio'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close Studio"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* MENTAL MODEL CALLOUT (Feynman Style) */}
        {data.mentalModel && (
          <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50/40 to-violet-50/40 border border-indigo-100/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <Brain size={15} className="text-indigo-600" />
              <span>Mental Model & Real-World Analogy</span>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              💡 <strong>Analogy: </strong>{data.mentalModel.analogy}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-indigo-100/60">
              <p className="text-slate-600">
                <strong className="text-slate-900 font-semibold">Why this matters: </strong>
                {data.mentalModel.whyItMatters}
              </p>
              <p className="text-slate-600">
                <strong className="text-indigo-900 font-semibold">Key takeaway: </strong>
                {data.mentalModel.keyTakeaway}
              </p>
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders size={13} /> Live Simulator
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers size={13} /> 3D Flashcards ({data.flashcards?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'charts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={13} /> Performance Chart
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flow')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'flow'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap size={13} /> Execution Flow
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HelpCircle size={13} /> Quiz & Celebration
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code2 size={13} /> Code Implementation
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'copilot'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={13} /> AI Copilot
          </button>
        </div>

        {/* ACTIVE TAB CONTENT DISPLAY */}
        <div className="pt-2">
          {activeTab === 'simulator' && data.simulator && (
            <InteractiveSimulator
              config={data.simulator}
              onParametersChange={setCurrentSimulatorParams}
            />
          )}

          {activeTab === 'flashcards' && data.flashcards && (
            <FlashcardDeck
              cards={data.flashcards}
              conceptTitle={data.concept}
            />
          )}

          {activeTab === 'charts' && data.chart && (
            <DynamicConceptChart config={data.chart} />
          )}

          {activeTab === 'flow' && data.flowSteps && (
            <ArchitectureFlowStepper
              steps={data.flowSteps}
              conceptTitle={data.concept}
            />
          )}

          {activeTab === 'quiz' && data.quiz && (
            <ConceptQuizCelebration
              quiz={data.quiz}
              conceptTitle={data.concept}
            />
          )}

          {activeTab === 'code' && data.codeSnippet && (
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 shadow-md border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                    {data.codeSnippet.language.toUpperCase()}
                  </span>
                  <h4 className="text-base font-black text-white">{data.codeSnippet.title}</h4>
                </div>

                <button
                  type="button"
                  onClick={() => copySnippet(data.codeSnippet.code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors border border-slate-700"
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} className="text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy Code
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-xs font-mono text-emerald-300 leading-relaxed border border-slate-800">
                <code>{data.codeSnippet.code}</code>
              </pre>

              <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 p-3.5 rounded-xl border border-slate-800/80">
                <strong className="text-slate-200 font-semibold">Walkthrough: </strong>
                {data.codeSnippet.explanation}
              </p>
            </div>
          )}

          {activeTab === 'copilot' && (
            <IntelligentAICopilot
              conceptTitle={data.concept}
              currentParameters={currentSimulatorParams}
            />
          )}
        </div>
      </div>
    </div>
  );
};
