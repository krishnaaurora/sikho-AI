import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, FileText, ChevronDown, ChevronUp, ChevronRight,
  BookOpen, ExternalLink, Sparkles, Clock, CheckCircle2,
  AlertCircle, Play, RotateCcw, Layers, MessageSquare, Zap, Target,
  Code2, Check, ArrowLeft, ArrowRight, ShieldCheck, BookmarkCheck,
  Award, Copy, Terminal, Compass, Mic, MicOff, Send, Lightbulb,
  BrainCircuit, HelpCircle, CheckCheck, Cpu, ArrowUpRight, CheckCircle,
  Lock, KeyRound, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { createX402Fetch } from '../utils/x402';
import { API_BASE_URL } from '../config/api';

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface InterviewQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  sampleAnswer?: string;
}

interface KeyConcept {
  title: string;
  description: string;
}

interface CodeSnippet {
  language: string;
  code: string;
}

interface RealWorldApplication {
  domain: string;
  pattern: string;
  productionNote: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  subtext: string;
  step: number;
  tag: string;
  color: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple';
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
}

export interface Chapter1Content {
  definition: string;
  keyConcepts: KeyConcept[];
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
    explanation: string;
  };
  spaceComplexity: {
    auxiliary: string;
    explanation: string;
  };
  edgeCases: string[];
  mathProof: string;
}

export interface Chapter2Content {
  diagramTitle: string;
  diagramDescription: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  codeLanguage: string;
  codeSnippet: string;
  codeExplanation: string;
}

export interface Chapter3Content {
  architectureOverview: string;
  realWorld: RealWorldApplication[];
  scenario: string;
  progressiveHints: string[];
  followUpQuestions: string[];
}

interface ModuleDetail {
  id: string;
  title: string;
  difficulty?: string;
  estimatedTime?: string;
  overview?: string;
  why?: string;
  what?: string;
  how?: string;
  realWorld?: RealWorldApplication[];
  scenario?: string;
  progressiveHints?: string[];
  followUpQuestions?: string[];
  keyConcepts?: KeyConcept[];
  codeExample?: CodeSnippet;
  completed?: boolean;
  ch1?: Chapter1Content;
  ch2?: Chapter2Content;
  ch3?: Chapter3Content;
}

interface LearningTrack {
  trackTitle: string;
  description?: string;
  modules: ModuleDetail[];
}

// ─── SVG Line-and-Box Diagram Visualizer (ChatGPT Style) ───────────────────────
const SVGDiagramVisualizer: React.FC<{
  title: string;
  description: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
}> = ({ title, description, nodes, connections }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const getColorClasses = (color: DiagramNode['color']) => {
    switch (color) {
      case 'indigo':
        return { bg: 'bg-indigo-950/40 hover:bg-indigo-900/50', border: 'border-indigo-500/50', text: 'text-indigo-200', badge: 'bg-indigo-600 text-white' };
      case 'emerald':
        return { bg: 'bg-emerald-950/40 hover:bg-emerald-900/50', border: 'border-emerald-500/50', text: 'text-emerald-200', badge: 'bg-emerald-600 text-white' };
      case 'amber':
        return { bg: 'bg-amber-950/40 hover:bg-amber-900/50', border: 'border-amber-500/50', text: 'text-amber-200', badge: 'bg-amber-600 text-white' };
      case 'blue':
        return { bg: 'bg-blue-950/40 hover:bg-blue-900/50', border: 'border-blue-500/50', text: 'text-blue-200', badge: 'bg-blue-600 text-white' };
      case 'purple':
        return { bg: 'bg-purple-950/40 hover:bg-purple-900/50', border: 'border-purple-500/50', text: 'text-purple-200', badge: 'bg-purple-600 text-white' };
      default:
        return { bg: 'bg-indigo-950/40 hover:bg-indigo-900/50', border: 'border-indigo-500/50', text: 'text-indigo-200', badge: 'bg-indigo-600 text-white' };
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">{title}</h4>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">{description}</p>
        </div>
        <span className="text-[10px] font-mono bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-700 font-bold">
          ChatGPT Connected Line &amp; Node Flow
        </span>
      </div>

      {/* Nodes Grid & Connecting Lines */}
      <div className="relative py-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {nodes.map((node, index) => {
            const styles = getColorClasses(node.color);
            const isSelected = selectedNode === node.id;

            return (
              <div key={node.id} className="relative flex flex-col items-center">
                {/* Node Box */}
                <div
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  className={`w-full p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${styles.bg} ${
                    isSelected ? 'ring-2 ring-indigo-400 scale-105 shadow-xl bg-slate-800' : styles.border
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                      Step {node.step}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {node.tag}
                    </span>
                  </div>
                  <h5 className={`text-xs font-extrabold ${styles.text} leading-snug`}>{node.label}</h5>
                  <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">{node.subtext}</p>
                </div>

                {/* Connecting Arrow for Desktop */}
                {index < nodes.length - 1 && (
                  <div className="hidden md:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
                      <ChevronRight size={14} className="animate-pulse text-indigo-400" />
                    </div>
                  </div>
                )}
                {/* Connecting Arrow for Mobile */}
                {index < nodes.length - 1 && (
                  <div className="flex md:hidden items-center justify-center my-2">
                    <ChevronDown size={18} className="text-indigo-400 animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Operational Flow Summary */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Operational Connections: {connections.map(c => `${c.from} ➔ ${c.to}`).join(' | ')}</span>
          </div>
          <span className="text-emerald-400 font-bold">Sub-millisecond Pipeline</span>
        </div>
      </div>
    </div>
  );
};

interface Chapter {
  id?: string;
  title: string;
  description?: string;
  modules?: Array<{ title: string; completed?: boolean; description?: string }>;
  skills?: string[];
  estimatedTime?: string;
  completed?: boolean;
}

interface Resource {
  title: string;
  url: string;
  type: string;
  category: string;
}

export interface GapMissingSkill {
  skill: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  importanceInJd?: string;
  reason: string;
  recommendation: string;
}

export interface GapStrengthenSkill {
  skill: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  currentEvidence: string;
  targetDepth: string;
  recommendation: string;
}

export interface GapExperience {
  area: string;
  gap: string;
  impact: 'Critical' | 'Moderate' | 'Minor';
  howToBridge: string;
}

export interface GapStrength {
  skill: string;
  evidence: string;
  relevanceToJd: string;
}

export interface GapActionPlanPhase {
  phase: string;
  timeframe: string;
  focus: string;
  tasks: string[];
}

export interface GapAnalysisData {
  overallMatchScore: number;
  skillsMatchScore: number;
  experienceMatchScore: number;
  domainFitScore: number;
  summary: string;
  missingSkills: GapMissingSkill[];
  strengthenSkills: GapStrengthenSkill[];
  experienceGaps: GapExperience[];
  matchedStrengths: GapStrength[];
  quickWins: string[];
  actionPlan: GapActionPlanPhase[];
}

interface ScenarioEvaluation {
  overallScore: number;
  conceptUnderstanding: number;
  realWorldUnderstanding: number;
  engineeringReasoning: number;
  interviewReadiness: number;
  whatYouIdentified: string[];
  whatToConsider: string[];
  seniorEngineerSolution: string;
  followUpQuestions: string[];
}

interface PrepResult {
  resumeMatchScore: number;
  estimatedLearningTime?: number;
  experienceLevel?: string;
  existingSkills?: string[];
  focusAreas?: string[];
  gapAnalysis?: GapAnalysisData;
  learningTracks?: LearningTrack[];
  chapters: Chapter[];
  interviewQuestions: InterviewQuestion[];
  resources?: Resource[];
}

// Interview Prep backend — always resolves to /api/v1/interview-pro
const _RAW_INTERVIEW_URL = import.meta.env.VITE_INTERVIEW_API_URL as string | undefined;
const PYTHON_API_BASE = (() => {
  let base = (_RAW_INTERVIEW_URL || API_BASE_URL).replace(/\/$/, '');
  // Force main backend if stale/dead separate render service URL is set in env
  if (base.includes('interview-pro-backend.onrender.com') || base.includes('sikho-ai-1.onrender.com')) {
    base = API_BASE_URL;
  }
  if (base.includes('/interview-pro')) return base;
  if (base.includes('/api/v1')) return base + '/interview-pro';
  if (base.includes('/api/')) return base + '/interview-pro';
  return base + '/interview-pro';
})();

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  medium: { label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  hard:   { label: 'Hard',   color: 'text-rose-700 bg-rose-50 border-rose-200' },
};

const InterviewPrep: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const [resumeMode, setResumeMode] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [jdMode, setJdMode] = useState<'paste' | 'file'>('paste');
  const [jobDescription, setJobDescription] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [daysToInterview, setDaysToInterview] = useState(7);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrepResult | null>(null);

  // Active view tabs: "gaps" (AI Gap Analysis), "learningPath" (the interactive 9-step learning studio), "questions", "resources"
  const [activeMainTab, setActiveMainTab] = useState<'gaps' | 'learningPath' | 'questions' | 'resources'>('gaps');
  
  // Gap filter state
  const [gapFilter, setGapFilter] = useState<'all' | 'missing' | 'strengthen' | 'experience' | 'strengths' | 'actionPlan'>('all');

  // Learning Path Navigation State
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [expandedModuleIndex, setExpandedModuleIndex] = useState<number | null>(0);
  const [activeChapterTab, setActiveChapterTab] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // ─── Scenario Engineering & 9-Step State ───
  const [studentApproach, setStudentApproach] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [revealedHintIndex, setRevealedHintIndex] = useState(-1);
  const [isEvaluatingScenario, setIsEvaluatingScenario] = useState(false);
  const [evaluationsMap, setEvaluationsMap] = useState<Record<string, ScenarioEvaluation>>({});
  const [followUpResponses, setFollowUpResponses] = useState<Record<string, Record<number, string>>>({});
  const [moduleMastery, setModuleMastery] = useState<Record<string, { concept: number; realWorld: number; engineering: number; interview: number; completed: boolean }>>({});
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Filter states for questions tab
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // ─── x402 Payment States & Unlocks ──────────────────────────────────────────
  const { activeAddress, signTransactions } = useWallet();
  const [isQuestionsUnlocked, setIsQuestionsUnlocked] = useState(false);
  const [unlockedBatchCount, setUnlockedBatchCount] = useState(0); // Modules locked until unlocked via x402
  const [isResourcesUnlocked, setIsResourcesUnlocked] = useState(false);
  const [isPayingFor, setIsPayingFor] = useState<'questions' | 'learningPath' | 'resources' | null>(null);

  const hasResume = !!file || !!resumeText.trim();
  const hasJd = !!jobDescription.trim() || !!jdFile;

  // ─── x402 Payment Handlers ───
  const unlockQuestions = async () => {
    if (!activeAddress) {
      alert("Please connect your Algorand wallet (Pera/Defly/Lute) using the Connect Wallet button in the header.");
      return;
    }
    setIsPayingFor('questions');
    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const url = `${API_BASE_URL}/interview-pro/interview-questions?role=Full+Stack+Software+Engineer&experience=${encodeURIComponent(experienceLevel)}`;
      const res = await x402Fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.reason || `x402 payment verification failed with status ${res.status}`);
      }
      const data = await res.json();
      const newQs = data?.data?.questions || data?.questions || [];
      if (newQs.length > 0 && result) {
        setResult({
          ...result,
          interviewQuestions: [...newQs, ...(result.interviewQuestions || [])]
        });
      }
      setIsQuestionsUnlocked(true);
    } catch (err: any) {
      console.error("unlockQuestions error:", err);
      alert(`Interview Questions unlock failed: ${err.message || 'Payment cancelled or network error.'}`);
    } finally {
      setIsPayingFor(null);
    }
  };

  const unlockLearningPathBatch = async () => {
    if (!activeAddress) {
      alert("Please connect your Algorand wallet (Pera/Defly/Lute) using the Connect Wallet button in the header.");
      return;
    }
    const nextBatch = unlockedBatchCount + 1;
    setIsPayingFor('learningPath');
    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const url = `${API_BASE_URL}/interview-pro/learning-path?batch=${nextBatch}&role=Full+Stack+Software+Engineer&modulesToUnlock=3`;
      const res = await x402Fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.reason || `x402 payment verification failed with status ${res.status}`);
      }
      const data = await res.json();
      const newModules = data?.data?.modules || data?.modules || [];
      if (newModules.length > 0 && result) {
        const updatedChapters = [...(result.chapters || [])];
        if (updatedChapters.length > 0) {
          const firstCh = updatedChapters[0];
          const existingMods = firstCh.modules || [];
          firstCh.modules = [
            ...existingMods,
            ...newModules.map((m: any) => ({ title: m.title, completed: false, description: m.why }))
          ];
        }
        setResult({
          ...result,
          chapters: updatedChapters
        });
      }
      setUnlockedBatchCount(prev => prev + 1);
    } catch (err: any) {
      console.error("unlockLearningPathBatch error:", err);
      alert(`Learning Path batch unlock failed: ${err.message || 'Payment cancelled or network error.'}`);
    } finally {
      setIsPayingFor(null);
    }
  };

  const unlockStudyResources = async () => {
    if (!activeAddress) {
      alert("Please connect your Algorand wallet (Pera/Defly/Lute) using the Connect Wallet button in the header.");
      return;
    }
    setIsPayingFor('resources');
    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const url = `${API_BASE_URL}/interview-pro/study-resources?topic=System+Design+%26+Modern+Backend+Architecture`;
      const res = await x402Fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.reason || `x402 payment verification failed with status ${res.status}`);
      }
      const data = await res.json();
      const newResources = data?.data?.resources || data?.resources || [];
      if (newResources.length > 0 && result) {
        setResult({
          ...result,
          resources: newResources
        });
      }
      setIsResourcesUnlocked(true);
    } catch (err: any) {
      console.error("unlockStudyResources error:", err);
      alert(`Study resources unlock failed: ${err.message || 'Payment cancelled or network error.'}`);
    } finally {
      setIsPayingFor(null);
    }
  };

  // Initialize Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setStudentApproach(prev => prev + (prev ? ' ' : '') + transcript);
        }
      };

      rec.onerror = () => {
        setIsRecordingVoice(false);
      };

      rec.onend = () => {
        setIsRecordingVoice(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecordingVoice) {
      recognitionRef.current.stop();
      setIsRecordingVoice(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecordingVoice(true);
      } catch (e) {
        setIsRecordingVoice(false);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  const analyse = async () => {
    if (!hasResume && !hasJd) {
      setError('⚠️ Both Resume and Job Description are required. Please upload or paste both to proceed.');
      return;
    }
    if (!hasResume) {
      setError('⚠️ Please upload or paste your Resume before running the analysis.');
      return;
    }
    if (!hasJd) {
      setError('⚠️ Please provide the target Job Description (paste text or upload file) to proceed.');
      return;
    }

    setIsLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (resumeText.trim()) {
        formData.append('resume_text_form', resumeText.trim());
      }
      if (jobDescription.trim()) {
        formData.append('job_description', jobDescription.trim());
      }
      if (jdFile) {
        formData.append('jd_file', jdFile);
      }
      formData.append('experience_level', experienceLevel);
      formData.append('days_to_interview', String(daysToInterview));

      const res = await fetch(`${PYTHON_API_BASE}/upload`, { method: 'POST', body: formData });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
        throw new Error(errJson.detail || errJson.message || `Error ${res.status}`);
      }
      const rawData: any = await res.json();
      const dataPayload: any = rawData?.data || rawData;

      // Ensure gapAnalysis is fully normalized and never empty
      const rawGap = dataPayload.gapAnalysis || dataPayload;
      const normalizedGap: GapAnalysisData = {
        overallMatchScore: rawGap.overallMatchScore ?? dataPayload.resumeMatchScore ?? 75,
        skillsMatchScore: rawGap.skillsMatchScore ?? dataPayload.resumeMatchScore ?? 72,
        experienceMatchScore: rawGap.experienceMatchScore ?? (dataPayload.resumeMatchScore ? Math.max(50, dataPayload.resumeMatchScore - 5) : 70),
        domainFitScore: rawGap.domainFitScore ?? 78,
        summary: rawGap.summary || rawGap.executiveSummary || (dataPayload.focusAreas?.join('. ') || 'AI has evaluated your resume against the target job requirements and extracted the core technical, scale, and domain gaps.'),
        missingSkills: (rawGap.missingSkills && rawGap.missingSkills.length > 0)
          ? rawGap.missingSkills
          : (dataPayload.focusAreas && dataPayload.focusAreas.length > 0)
          ? dataPayload.focusAreas.map((f: string, i: number) => ({
              skill: f,
              category: i % 2 === 0 ? 'Architecture' : 'Core Tech',
              priority: i === 0 ? 'High' : 'Medium',
              importanceInJd: 'Key requirement emphasized in the job description.',
              reason: `No direct evidence of ${f} found in resume background.`,
              recommendation: `Study essential patterns, indexing strategies, and build a project module for ${f}.`
            }))
          : [
              {
                skill: 'Database Indexing & Query Profiling',
                category: 'Database',
                priority: 'High',
                importanceInJd: 'Crucial for high-throughput queries and transaction scale.',
                reason: 'Resume does not show production query tuning or B-Tree indexing.',
                recommendation: 'Master EXPLAIN ANALYZE, composite indexes, and buffer hit ratio analysis.'
              },
              {
                skill: 'Distributed Caching (Redis)',
                category: 'Architecture',
                priority: 'High',
                importanceInJd: 'Sub-millisecond latency requirements across API endpoints.',
                reason: 'No in-memory caching or cache invalidation patterns evidenced.',
                recommendation: 'Implement Cache-Aside pattern with TTL expiration.'
              }
            ],
        strengthenSkills: (rawGap.strengthenSkills && rawGap.strengthenSkills.length > 0)
          ? rawGap.strengthenSkills
          : [
              {
                skill: dataPayload.existingSkills?.[0] ? `${dataPayload.existingSkills[0]} & API Architecture` : 'REST API Architecture',
                category: 'Backend',
                priority: 'Medium',
                currentEvidence: 'Demonstrates baseline implementation in previous projects.',
                targetDepth: 'Enterprise rate limiting, idempotency keys, and defensive error handlers.',
                recommendation: 'Deepen knowledge of RFC specifications and microservice resilience.'
              }
            ],
        experienceGaps: (rawGap.experienceGaps && rawGap.experienceGaps.length > 0)
          ? rawGap.experienceGaps
          : [
              {
                area: 'High-Concurrency & Distributed Scale',
                gap: 'Experience limited to standard low-traffic web services.',
                impact: 'Critical',
                howToBridge: 'Design and benchmark load-tested services simulating 10k RPS with Redis caching.'
              }
            ],
        matchedStrengths: (rawGap.matchedStrengths && rawGap.matchedStrengths.length > 0)
          ? rawGap.matchedStrengths
          : (dataPayload.existingSkills || ['JavaScript', 'TypeScript', 'Web Development']).map((s: string) => ({
              skill: s,
              evidence: 'Demonstrated in candidate resume project history and skill inventory.',
              relevanceToJd: 'Directly matches core technical requirements of the job description.'
            })),
        quickWins: (rawGap.quickWins && rawGap.quickWins.length > 0)
          ? rawGap.quickWins
          : [
              'Review database indexing mechanics and EXPLAIN ANALYZE query plans.',
              'Implement a Redis Cache-Aside helper in your project to demonstrate caching.',
              'Prepare STAR format examples highlighting production trade-offs.'
            ],
        actionPlan: (rawGap.actionPlan && rawGap.actionPlan.length > 0)
          ? rawGap.actionPlan
          : [
              {
                phase: 'Phase 1: Foundational Gaps',
                timeframe: 'Days 1-2',
                focus: 'Database Indexing & Caching Architecture',
                tasks: ['Study B-Trees & composite indexes', 'Build Redis caching layer', 'Solve 5 SQL tuning exercises']
              },
              {
                phase: 'Phase 2: Architectural Scale',
                timeframe: 'Days 3-5',
                focus: 'Distributed Microservices & Resilience',
                tasks: ['Design rate limiting & Circuit Breakers', 'Review Idempotency Keys', 'Complete scenario mock']
              },
              {
                phase: 'Phase 3: Interview Mastery',
                timeframe: 'Days 6-7',
                focus: 'Scenario Defense & STAR Method',
                tasks: ['Practice 8 architectural interview questions', 'Run readiness drill', 'Final review']
              }
            ]
      };

      const normalizedResult: PrepResult = {
        resumeMatchScore: dataPayload.resumeMatchScore ?? normalizedGap.overallMatchScore ?? 75,
        estimatedLearningTime: dataPayload.estimatedLearningTime ?? 20,
        experienceLevel: dataPayload.experienceLevel ?? experienceLevel,
        existingSkills: dataPayload.existingSkills ?? [],
        focusAreas: dataPayload.focusAreas ?? [],
        gapAnalysis: normalizedGap,
        learningTracks: dataPayload.learningTracks,
        chapters: dataPayload.chapters ?? [],
        interviewQuestions: dataPayload.interviewQuestions ?? [],
        resources: dataPayload.resources ?? []
      };

      setResult(normalizedResult);
      setActiveMainTab('gaps');
      setGapFilter('all');
      setActiveTrackIndex(0);
      setActiveModuleIndex(0);
      setExpandedModuleIndex(0);
      setRevealedHintIndex(-1);
      setStudentApproach('');
    } catch (err: any) {
      setError(
        err.message?.includes('Failed to fetch')
          ? `Cannot connect to Interview Prep server (${PYTHON_API_BASE}). Please ensure the backend is running.`
          : err.message || 'An error occurred during analysis.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setResumeText(''); setJobDescription(''); setJdFile(null);
    setResult(null); setError(null); setIsLoading(false);
    setExpandedQuestion(null);
    setEvaluationsMap({});
    setStudentApproach('');
    setRevealedHintIndex(-1);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (jdFileInputRef.current) jdFileInputRef.current.value = '';
  };

  // Harmonized tracks for rendering
  const tracks: LearningTrack[] = useMemo(() => {
    if (!result) return [];
    if (result.learningTracks && result.learningTracks.length > 0) {
      return result.learningTracks;
    }
    // Convert chapters to structured tracks with 3 chapters per module
    return (result.chapters || []).map((ch, chIdx) => ({
      trackTitle: ch.title,
      description: ch.description,
      modules: (ch.modules || [{ title: ch.title, completed: ch.completed }]).map((m, mIdx) => {
        const title = m.title;
        return {
          id: `mod-${chIdx}-${mIdx}`,
          title: title,
          difficulty: chIdx === 0 ? 'Beginner' : 'Intermediate',
          estimatedTime: ch.estimatedTime || '30 mins',
          overview: ch.description || 'Master core concepts and prepare for interview-grade technical challenges.',
          why: `Why does ${title} exist? Searching, computing, or managing state sequentially fails at modern scale. This concept provides optimized time complexity and bounded resource usage.`,
          what: `${title} provides a fundamental architecture to store, manipulate, and query data with predictable operational guarantees.`,
          how: `Internally, it executes via a pipeline of inputs, algorithmic transformations, hash/index lookups, and memory-efficient data structures.`,
          // ── Chapter 1: Academic Theory & Mathematical Complexity (GeeksforGeeks Style) ──
          ch1: {
            definition: `${title} is a foundational engineering abstraction designed to optimize data manipulation, storage, and retrieval under rigorous operational constraints.`,
            keyConcepts: (ch.skills || ['Core Foundations', 'Algorithmic Invariants', 'Memory Access', 'Optimization']).map(s => ({
              title: s,
              description: `Deep theoretical principles, mathematical bounds, and execution properties governing ${s}.`
            })),
            timeComplexity: {
              best: 'O(1)',
              average: 'O(1)',
              worst: 'O(N)',
              explanation: 'Best/Average case lookups execute in constant or logarithmic time due to memory indexing. Worst-case latency degrades under adverse input distribution or structural imbalance.'
            },
            spaceComplexity: {
              auxiliary: 'O(N)',
              explanation: 'Requires O(N) auxiliary memory for buffer allocation, pointer nodes, or contiguous array backing stores.'
            },
            edgeCases: [
              'High Key Collision Rate: Adverse input distribution causing maximum bucket or tree depth degradation.',
              'Concurrent Mutability: Unsynchronized thread access leading to race conditions or stale reader state.',
              'Memory Fragmentation: Re-allocation during dynamic capacity expansion causing transient heap latency spikes.'
            ],
            mathProof: 'Given input size N, operational complexity satisfies T(N) = T(N/2) + O(1) in balanced states, achieving logarithmic depth bounds according to the Master Theorem.'
          },
          // ── Chapter 2: Internal Mechanics, SVG Line Diagram & Code ──
          ch2: {
            diagramTitle: `ChatGPT Line Diagram: ${title} System Execution Pipeline`,
            diagramDescription: 'Connected line & box architecture showing step-by-step request flow from client payload to memory lookup and database persistence.',
            nodes: [
              { id: 'node-1', label: '1. Client Request Payload', subtext: `Inbound ${title} parameters`, step: 1, tag: 'INBOUND', color: 'indigo' },
              { id: 'node-2', label: '2. Algorithmic Transformation', subtext: 'Hashing / Index Evaluation', step: 2, tag: 'PROCESSING', color: 'blue' },
              { id: 'node-3', label: '3. Memory & Index Lookup', subtext: 'O(1) Cache / Memory Check', step: 3, tag: 'LOOKUP', color: 'emerald' },
              { id: 'node-4', label: '4. DB Fallback & Sync', subtext: 'ACID Persist & Sync Guard', step: 4, tag: 'PERSISTENCE', color: 'amber' }
            ],
            connections: [
              { from: 'Node 1', to: 'Node 2', label: 'Transform Key' },
              { from: 'Node 2', to: 'Node 3', label: 'Evaluate Index' },
              { from: 'Node 3', to: 'Node 4', label: 'On Cache Miss' }
            ],
            codeLanguage: 'typescript',
            codeSnippet: `// Production-Grade Execution Snippet for ${title}
export class DataEngine {
  private cache: Map<string, any> = new Map();

  constructor(private readonly maxCapacity: number = 1000) {}

  public execute(key: string, data: any): { status: string; latencyMs: number } {
    const startTime = performance.now();
    
    // Step 1: Check memory cache
    if (this.cache.has(key)) {
      return { status: 'CACHE_HIT', latencyMs: performance.now() - startTime };
    }

    // Step 2: Algorithmic processing & store
    this.cache.set(key, data);
    return { status: 'PROCESSED', latencyMs: performance.now() - startTime };
  }
}`,
            codeExplanation: `This implementation encapsulates the core operational pipeline of ${title}, leveraging an in-memory map store with constant-time O(1) lookup guarantees.`
          },
          // ── Chapter 3: Enterprise Architecture & Production Scenario ──
          ch3: {
            architectureOverview: `At enterprise scale (e.g. AWS, Stripe, Netflix), ${title} is integrated into microservice API gateways, distributed Redis caches, and relational index engines.`,
            realWorld: [
              { domain: '🛒 E-Commerce & Retail', pattern: 'High-speed Product & Cart Lookup', productionNote: 'Implemented using in-memory caches and indexed storage.' },
              { domain: '🏦 Banking & FinTech', pattern: 'Transaction ID & Account Ledger', productionNote: 'Backed by ACID relational databases with foreign keys.' },
              { domain: '🌐 Web Applications', pattern: 'Session Authentication & Tokens', productionNote: 'Stored in distributed Redis clusters with TTL expiration.' },
              { domain: '⚡ Microservices', pattern: 'Idempotency Keys & Request Deduplication', productionNote: 'Evaluated at the API Gateway middleware layer.' }
            ],
            scenario: `You are building a high-traffic production application with millions of daily requests. Repeated queries are causing high latency. How would you solve this using ${title}? Explain your approach, trade-offs, and failure handling.`,
            progressiveHints: [
              'Think about what data is read frequently versus written rarely.',
              'Consider placing an in-memory caching layer with TTL expiration.',
              'Review cache invalidation strategies (Cache-Aside vs Write-Through).'
            ],
            followUpQuestions: [
              'How do you prevent cache stampede when multiple requests miss simultaneously?',
              'What happens if the primary cache node fails?',
              'How do you maintain consistency between the cache and underlying database?'
            ]
          },
          realWorld: [
            { domain: '🛒 E-Commerce', pattern: 'High-speed Product & Cart Lookup', productionNote: 'Implemented using in-memory caches and indexed storage.' },
            { domain: '🏦 Banking & FinTech', pattern: 'Transaction ID & Account Ledger', productionNote: 'Backed by ACID relational databases with foreign keys.' },
            { domain: '🌐 Web Applications', pattern: 'Session Authentication & Tokens', productionNote: 'Stored in distributed Redis clusters with TTL expiration.' },
            { domain: '⚡ Microservices', pattern: 'Idempotency Keys & Request Deduplication', productionNote: 'Evaluated at the API Gateway middleware layer.' }
          ],
          scenario: `You are building a high-traffic production application with millions of daily requests. Repeated queries are causing high latency. How would you solve this using ${title}? Explain your approach, trade-offs, and failure handling.`,
          progressiveHints: [
            'Think about what data is read frequently versus written rarely.',
            'Consider placing an in-memory caching layer with TTL expiration.',
            'Review cache invalidation strategies (Cache-Aside vs Write-Through).'
          ],
          followUpQuestions: [
            'How do you prevent cache stampede when multiple requests miss simultaneously?',
            'What happens if the primary cache node fails?',
            'How do you maintain consistency between the cache and underlying database?'
          ],
          keyConcepts: (ch.skills || ['Core Concepts', 'Implementation']).map(s => ({
            title: s,
            description: `Key technical principles and common interview patterns for ${s}.`
          }))
        };
      })
    }));
  }, [result]);

  const currentTrack = tracks[activeTrackIndex] || tracks[0];
  const currentModule = currentTrack?.modules?.[activeModuleIndex] || currentTrack?.modules?.[0];
  const currentModuleKey = currentModule ? `${activeTrackIndex}-${activeModuleIndex}-${currentModule.id || currentModule.title}` : '';
  const currentEvaluation = evaluationsMap[currentModuleKey] || null;

  // Handle Engineering Scenario AI Evaluation
  const handleEvaluateScenario = async () => {
    if (!studentApproach.trim() || !currentModule) return;
    setIsEvaluatingScenario(true);
    try {
      const res = await fetch(`${PYTHON_API_BASE}/evaluate-scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_title: currentModule.title,
          scenario_text: currentModule.scenario || `How would you apply ${currentModule.title} in a high-scale system?`,
          student_answer: studentApproach.trim(),
          experience_level: experienceLevel,
          target_role: 'Software Engineer'
        })
      });

      if (!res.ok) {
        throw new Error(`Evaluation request failed (${res.status})`);
      }

      const evalData: ScenarioEvaluation = await res.json();
      setEvaluationsMap(prev => ({
        ...prev,
        [currentModuleKey]: evalData
      }));

      // Update multi-dimensional mastery
      setModuleMastery(prev => ({
        ...prev,
        [currentModuleKey]: {
          concept: evalData.conceptUnderstanding || evalData.overallScore,
          realWorld: evalData.realWorldUnderstanding || evalData.overallScore,
          engineering: evalData.engineeringReasoning || evalData.overallScore,
          interview: evalData.interviewReadiness || evalData.overallScore,
          completed: true
        }
      }));
    } catch (err: any) {
      alert(`AI Evaluation error: ${err.message || 'Could not evaluate approach'}`);
    } finally {
      setIsEvaluatingScenario(false);
    }
  };

  const handleNextConcept = () => {
    if (!currentTrack) return;
    if (activeModuleIndex < currentTrack.modules.length - 1) {
      setActiveModuleIndex(prev => prev + 1);
    } else if (activeTrackIndex < tracks.length - 1) {
      setActiveTrackIndex(prev => prev + 1);
      setActiveModuleIndex(0);
    }
    setActiveChapterTab(0);
    setStudentApproach('');
    setRevealedHintIndex(-1);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const categories = useMemo(() => {
    if (!result?.interviewQuestions) return [];
    return ['All', ...Array.from(new Set(result.interviewQuestions.map(q => q.category).filter(Boolean)))];
  }, [result]);

  const filteredQs = useMemo(() => {
    if (!result?.interviewQuestions) return [];
    return result.interviewQuestions.filter(q =>
      (categoryFilter === 'All' || q.category === categoryFilter) &&
      (difficultyFilter === 'All' || q.difficulty === difficultyFilter)
    );
  }, [result, categoryFilter, difficultyFilter]);

  const gapData = result?.gapAnalysis;
  const missingCount = gapData?.missingSkills?.length || 0;
  const strengthenCount = gapData?.strengthenSkills?.length || 0;
  const experienceCount = gapData?.experienceGaps?.length || 0;
  const strengthsCount = gapData?.matchedStrengths?.length || result?.existingSkills?.length || 0;

  // Track overall completion
  const totalModulesCount = tracks.reduce((acc, t) => acc + t.modules.length, 0);
  const completedModulesCount = Object.values(moduleMastery).filter(m => m.completed).length;
  const overallMasteryScore = completedModulesCount > 0
    ? Math.round(Object.values(moduleMastery).reduce((acc, m) => acc + (m.concept + m.engineering + m.interview + m.realWorld) / 4, 0) / completedModulesCount)
    : (gapData?.overallMatchScore || 70);

  return (
    <div className="pt-16 min-h-screen bg-[#F8FAFC] font-sans antialiased text-slate-800">

      {/* ── TOP NAV BAR ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Zap size={20} className="text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Interview Prep &amp; AI Gap Intelligence</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Resume &amp; JD Gap Extraction, 9-Step Learning Path &amp; Interview Readiness</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {result && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm"
              >
                <RotateCcw size={13} />
                <span className="hidden md:inline">Analyse Another</span>
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard/learner')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/20"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── SCREEN 1: UPLOAD & CONFIGURATION ──────────────────────────────── */}
        {!result ? (
          <div className="max-w-4xl mx-auto space-y-6">

            <div className="text-center space-y-2 py-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wide uppercase">
                <Sparkles size={13} className="text-indigo-600" /> AI Resume &amp; JD Gap Extraction
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Identify Resume Gaps &amp; Target Role Deficits
              </h2>
              <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">
                Upload your resume and your target job description. Our AI analyzes both documents side-by-side to highlight missing requirements, skills to strengthen, and tailored prep missions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Resume Card */}
              <div className={`bg-white border rounded-2xl p-5 shadow-sm transition ${hasResume ? 'border-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">Your Resume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      hasResume
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-rose-500 bg-rose-50 border-rose-100'
                    }`}>
                      {hasResume ? '✓ Ready' : 'Required'}
                    </span>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(['file', 'paste'] as const).map(m => (
                        <button
                          key={m} onClick={() => setResumeMode(m)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md transition ${
                            resumeMode === m
                              ? 'bg-white text-indigo-600 font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {m === 'file' ? 'Upload' : 'Paste'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {resumeMode === 'file' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDrag} onDragOver={handleDrag}
                    onDragLeave={handleDrag} onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 px-4 cursor-pointer transition-all h-[152px] ${
                      isDragActive
                        ? 'border-indigo-500 bg-indigo-50/60'
                        : file
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file" accept=".pdf,.doc,.docx,.txt"
                      ref={fileInputRef} className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                    />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <UploadCloud size={20} />
                    </div>

                    {file ? (
                      <div className="text-center">
                        <p className="text-xs font-bold text-emerald-800 line-clamp-1">{file.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-0.5">
                        <p className="text-xs font-bold text-slate-700">Click or drag resume here</p>
                        <p className="text-[11px] text-slate-400">PDF, DOC, DOCX, or TXT</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Paste your resume text, work experience, projects, and technical skills here..."
                    className="w-full h-[152px] text-xs text-slate-700 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:border-indigo-400 placeholder-slate-400 font-medium bg-slate-50/50 focus:bg-white transition"
                  />
                )}
              </div>

              {/* Job Description Card */}
              <div className={`bg-white border rounded-2xl p-5 shadow-sm transition ${hasJd ? 'border-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">Job Description (JD)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      hasJd
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-rose-500 bg-rose-50 border-rose-100'
                    }`}>
                      {hasJd ? '✓ Ready' : 'Required'}
                    </span>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(['paste', 'file'] as const).map(m => (
                        <button
                          key={m} onClick={() => setJdMode(m)}
                          className={`text-xs font-semibold px-2 py-0.5 rounded-md transition ${
                            jdMode === m
                              ? 'bg-white text-indigo-600 font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {m === 'paste' ? 'Paste' : 'Upload'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {jdMode === 'paste' ? (
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description, required tech stack, and responsibilities here..."
                    className="w-full h-[152px] text-xs text-slate-700 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:border-indigo-400 placeholder-slate-400 font-medium bg-slate-50/50 focus:bg-white transition"
                  />
                ) : (
                  <div
                    onClick={() => jdFileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition h-[152px] ${
                      jdFile
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file" accept=".pdf,.doc,.docx,.txt"
                      ref={jdFileInputRef} className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setJdFile(f); }}
                    />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${jdFile ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <UploadCloud size={20} />
                    </div>
                    {jdFile ? (
                      <div className="text-center">
                        <p className="text-xs font-bold text-emerald-800 line-clamp-1">{jdFile.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{(jdFile.size / 1024).toFixed(0)} KB · Click to replace</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">Click to upload JD file (PDF, DOCX, TXT)</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Experience Level and Days to Interview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Target Experience Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map(lvl => (
                      <button
                        key={lvl} onClick={() => setExperienceLevel(lvl)}
                        className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition ${
                          experienceLevel === lvl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Days to Interview</label>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-0.5">
                      {daysToInterview} Days Left
                    </span>
                  </div>
                  <input
                    type="range" min={1} max={90} value={daysToInterview}
                    onChange={e => setDaysToInterview(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                    <span>1 day</span><span>90 days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm font-medium"
                >
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              onClick={analyse}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition shadow-lg cursor-pointer ${
                hasResume && hasJd && !isLoading
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-indigo-500/25 hover:opacity-95'
                  : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-indigo-500/20'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Resume vs JD with AI (Identifying Gaps)...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyze Resume &amp; Show Identified Gaps</span>
                </>
              )}
            </button>
          </div>
        ) : (

          /* ── SCREEN 2: RICH GAP INTELLIGENCE & MISSION DASHBOARD ──────────────────── */
          <div className="space-y-6">

            {/* Top KPI Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-lg">
                  {gapData?.overallMatchScore ?? result.resumeMatchScore}%
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Match Score</p>
                  <p className="text-sm font-extrabold text-slate-800">Job Fit Score</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time to Bridge</p>
                  <p className="text-sm font-extrabold text-slate-800">{result.estimatedLearningTime || 24} hours</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-extrabold text-sm">
                  {missingCount}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Critical Gaps</p>
                  <p className="text-sm font-extrabold text-slate-800">{missingCount} Missing Skills</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Experience Level</p>
                  <p className="text-sm font-extrabold text-slate-800 capitalize">{result.experienceLevel || experienceLevel}</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveMainTab('gaps')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeMainTab === 'gaps'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Target size={14} className={activeMainTab === 'gaps' ? 'text-white' : 'text-indigo-600'} />
                  <span>AI Identified Gaps</span>
                  {missingCount > 0 && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      activeMainTab === 'gaps' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {missingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveMainTab('learningPath')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeMainTab === 'learningPath'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Compass size={14} className={activeMainTab === 'learningPath' ? 'text-white' : 'text-indigo-600'} />
                  <span>Learning Path</span>
                  {completedModulesCount > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      {completedModulesCount}/{totalModulesCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveMainTab('questions')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeMainTab === 'questions'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <MessageSquare size={14} className={activeMainTab === 'questions' ? 'text-white' : 'text-indigo-600'} />
                  <span>Interview Questions ({result.interviewQuestions?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveMainTab('resources')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeMainTab === 'resources'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ExternalLink size={14} className={activeMainTab === 'resources' ? 'text-white' : 'text-indigo-600'} />
                  <span>Study Resources</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 0: AI IDENTIFIED GAPS */}
            {activeMainTab === 'gaps' && (
              <div className="space-y-6">

                {/* Match Breakdown & Executive Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Executive AI Summary */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">AI Gap Evaluation</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Resume vs Job Description Alignment</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Target: {experienceLevel}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 border border-slate-100 rounded-xl p-4">
                      {gapData?.summary || result.focusAreas?.join('. ') || 'AI has analyzed your resume against the target role requirements and extracted the core technical, experience, and domain gaps.'}
                    </p>

                    {/* Quick Wins */}
                    {gapData?.quickWins && gapData.quickWins.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                          <Zap size={13} className="text-amber-500" />
                          <span>Immediate Quick Wins (Next 24-48 Hours)</span>
                        </div>
                        <div className="space-y-1.5">
                          {gapData.quickWins.map((win, wi) => (
                            <div key={wi} className="flex items-start gap-2 text-xs text-slate-600 bg-amber-50/60 border border-amber-100/80 rounded-lg p-2 font-medium">
                              <CheckCircle2 size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{win}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Detailed Score Radar */}
                  <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Match Breakdown</h4>
                    <div className="space-y-3.5">
                      {[
                        { label: 'Technical Skills Fit', score: gapData?.skillsMatchScore ?? result.resumeMatchScore, color: 'bg-indigo-600' },
                        { label: 'Experience Depth Fit', score: gapData?.experienceMatchScore ?? (result.resumeMatchScore - 5), color: 'bg-violet-600' },
                        { label: 'Domain & Architecture', score: gapData?.domainFitScore ?? result.resumeMatchScore, color: 'bg-blue-600' },
                        { label: 'Interview Readiness', score: Math.min(100, (gapData?.overallMatchScore ?? result.resumeMatchScore) + 5), color: 'bg-emerald-600' }
                      ].map((bar, bi) => (
                        <div key={bi} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-slate-700">
                            <span>{bar.label}</span>
                            <span>{bar.score}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${bar.color} rounded-full transition-all duration-500`} style={{ width: `${bar.score}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Identified Focus Gaps</span>
                      <span className="text-xs font-extrabold text-indigo-600">{result.focusAreas?.length || missingCount} Critical Areas</span>
                    </div>
                  </div>
                </div>

                {/* Sub Filter Pills for Gaps */}
                <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-200 pb-3">
                  {[
                    { id: 'all', label: 'All Gap Intelligence', count: missingCount + strengthenCount + experienceCount, color: 'text-indigo-600' },
                    { id: 'missing', label: 'Missing Skills (Critical)', count: missingCount, color: 'text-rose-600' },
                    { id: 'strengthen', label: 'Needs Strengthening', count: strengthenCount, color: 'text-amber-600' },
                    { id: 'experience', label: 'Experience & Scale Gaps', count: experienceCount, color: 'text-purple-600' },
                    { id: 'strengths', label: 'Matching Strengths', count: strengthsCount, color: 'text-emerald-600' },
                    { id: 'actionPlan', label: 'Action Plan', count: gapData?.actionPlan?.length || 0, color: 'text-indigo-600' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setGapFilter(tab.id as any)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                        gapFilter === tab.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          gapFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 1. Missing Skills Section */}
                {(gapFilter === 'all' || gapFilter === 'missing') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <h4 className="text-sm font-bold text-slate-900">Critical Missing Skills &amp; Requirements ({missingCount})</h4>
                      </div>
                      <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                        Demanded by JD, Not evidenced in Resume
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(gapData?.missingSkills || []).map((item, idx) => (
                        <div key={idx} className="bg-white border border-rose-100/90 rounded-2xl p-5 shadow-sm space-y-3.5 hover:border-rose-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  item.priority === 'High'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : item.priority === 'Medium'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  {item.priority} Priority Gap
                                </span>
                                {item.category && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-base font-bold text-slate-900 leading-snug">{item.skill}</h5>
                            </div>
                            <span className="text-xs font-bold text-rose-500 bg-rose-50 p-1.5 rounded-lg">✕ Missing</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            {item.importanceInJd && (
                              <div className="bg-rose-50/40 border border-rose-100/60 rounded-xl p-2.5">
                                <p className="font-bold text-rose-800 text-[11px] uppercase tracking-wider mb-0.5">Why Job Requires This:</p>
                                <p className="text-slate-600 font-medium">{item.importanceInJd}</p>
                              </div>
                            )}

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                              <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-0.5">Resume Deficit:</p>
                              <p className="text-slate-600 font-medium">{item.reason}</p>
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5">
                              <p className="font-bold text-indigo-800 text-[11px] uppercase tracking-wider mb-0.5">AI Bridging Advice:</p>
                              <p className="text-indigo-900 font-medium">{item.recommendation}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => { setActiveMainTab('learningPath'); }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>Bridge in Learning Path</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Skills Needing Strengthening Section */}
                {(gapFilter === 'all' || gapFilter === 'strengthen') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <h4 className="text-sm font-bold text-slate-900">Skills Needing Greater Depth ({strengthenCount})</h4>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                        Present in Resume, but JD Requires Higher Mastery
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(gapData?.strengthenSkills || []).map((item, idx) => (
                        <div key={idx} className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm space-y-3.5 hover:border-amber-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                  {item.priority} Priority
                                </span>
                                {item.category && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-base font-bold text-slate-900 leading-snug">{item.skill}</h5>
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 p-1.5 rounded-lg">▲ Deepen</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                              <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-0.5">Current Resume Proof:</p>
                              <p className="text-slate-600 font-medium">{item.currentEvidence}</p>
                            </div>

                            <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-2.5">
                              <p className="font-bold text-amber-800 text-[11px] uppercase tracking-wider mb-0.5">JD Target Depth:</p>
                              <p className="text-slate-700 font-medium">{item.targetDepth}</p>
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5">
                              <p className="font-bold text-indigo-800 text-[11px] uppercase tracking-wider mb-0.5">Interview Strategy:</p>
                              <p className="text-indigo-900 font-medium">{item.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Experience & Scale Deficits */}
                {(gapFilter === 'all' || gapFilter === 'experience') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <h4 className="text-sm font-bold text-slate-900">Experience, Scale &amp; Architectural Gaps ({experienceCount})</h4>
                      </div>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-100">
                        Seniority &amp; Scale Expectations
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(gapData?.experienceGaps || []).map((item, idx) => (
                        <div key={idx} className="bg-white border border-purple-100 rounded-2xl p-5 shadow-sm space-y-3 hover:border-purple-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-bold text-slate-900">{item.area}</h5>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              item.impact === 'Critical'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {item.impact} Impact
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                              <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-0.5">Identified Gap:</p>
                              <p className="text-slate-600 font-medium">{item.gap}</p>
                            </div>

                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5">
                              <p className="font-bold text-purple-800 text-[11px] uppercase tracking-wider mb-0.5">Interview Defense Strategy:</p>
                              <p className="text-purple-900 font-medium">{item.howToBridge}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Candidate Strengths / JD Matches */}
                {(gapFilter === 'all' || gapFilter === 'strengths') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h4 className="text-sm font-bold text-slate-900">Your Matched Strengths &amp; JD Advantages ({strengthsCount})</h4>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                        Strong Evidence in Resume
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(gapData?.matchedStrengths || []).map((s, idx) => (
                        <div key={idx} className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm space-y-2 hover:border-emerald-300 transition">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{s.skill}</h5>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">{s.evidence}</p>
                          {s.relevanceToJd && (
                            <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md">
                              ✓ {s.relevanceToJd}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Action Plan Section */}
                {(gapFilter === 'all' || gapFilter === 'actionPlan') && gapData?.actionPlan && gapData.actionPlan.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <h4 className="text-sm font-bold text-slate-900">Customized {daysToInterview}-Day Gap-Bridging Action Plan</h4>
                      </div>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        Chronological Preparation Roadmap
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {gapData.actionPlan.map((phase, pi) => (
                        <div key={pi} className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-3 hover:border-indigo-300 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                              {phase.timeframe}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">Step {pi + 1}</span>
                          </div>

                          <div>
                            <h5 className="text-sm font-bold text-slate-900">{phase.phase}</h5>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{phase.focus}</p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {phase.tasks.map((task, ti) => (
                              <div key={ti} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                                <div className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                                  {ti + 1}
                                </div>
                                <span>{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT 1: 9-STEP DEEP LEARNING PATH STUDIO */}
            {activeMainTab === 'learningPath' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Sidebar: Module Accordion Nav */}
                <div className="lg:col-span-4 space-y-3">

                  {/* Progress Header */}
                  <div className="space-y-1.5 px-1 pb-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                      <span>{Math.min(9, unlockedBatchCount * 3)} of 9 Chapters Unlocked</span>
                      <span className="font-bold text-slate-800">{Math.round((Math.min(9, unlockedBatchCount * 3) / 9) * 100)}%</span>
                    </div>
                    {/* Slim Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(Math.min(9, unlockedBatchCount * 3) / 9) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Module Accordions — 3 Modules */}
                  <div className="space-y-3">
                    {tracks.slice(0, 3).map((track, trackIdx) => {
                      const isModuleLocked = trackIdx >= unlockedBatchCount;
                      const isExpanded = expandedModuleIndex === trackIdx;
                      const cleanTitle = track.trackTitle.replace(/^Module\s*\d+\s*:\s*/i, '');
                      const isSelected = activeTrackIndex === trackIdx;

                      // Badge Colors: Module 1 = blue, Module 2 = emerald, Module 3 = purple
                      const badgeStyles = trackIdx === 0
                        ? 'bg-blue-400 text-white'
                        : trackIdx === 1
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-purple-100 text-purple-600';

                      const moduleLabelColor = isExpanded || isSelected
                        ? 'text-blue-600'
                        : 'text-slate-800';

                      return (
                        <div
                          key={trackIdx}
                          className={`rounded-2xl border transition-all ${
                            isExpanded
                              ? 'border-blue-100 bg-white shadow-sm p-4'
                              : 'border-slate-200/90 bg-white hover:border-slate-300 p-4'
                          }`}
                        >
                          {/* Module Accordion Header */}
                          <div
                            className="cursor-pointer select-none"
                            onClick={() => {
                              setActiveTrackIndex(trackIdx);
                              setActiveModuleIndex(0);
                              setExpandedModuleIndex(isExpanded ? null : trackIdx);
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                {/* Circular Number Badge */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${badgeStyles}`}>
                                  {trackIdx + 1}
                                </div>

                                <div className="min-w-0">
                                  <p className={`text-xs font-bold leading-tight ${moduleLabelColor}`}>
                                    Module {trackIdx + 1}
                                  </p>
                                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug mt-0.5">
                                    {cleanTitle}
                                  </h3>
                                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                    3 chapters
                                  </p>
                                </div>
                              </div>

                              {/* Chevron at Top Right */}
                              <div className="flex-shrink-0 text-slate-600 pt-0.5">
                                {isExpanded ? (
                                  <ChevronUp size={18} className="text-slate-700" />
                                ) : (
                                  <ChevronDown size={18} className="text-slate-700" />
                                )}
                              </div>
                            </div>

                            {/* Unlock Button Row aligned to the right */}
                            <div className="flex justify-end mt-2">
                              {isModuleLocked ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTrackIndex(trackIdx);
                                    unlockLearningPathBatch();
                                  }}
                                  disabled={isPayingFor === 'learningPath'}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-60 cursor-pointer"
                                >
                                  <Lock size={12} />
                                  <span>Unlock $0.09</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  ✓ Unlocked
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expanded Chapter List inside Inset Card */}
                          {isExpanded && (
                            <div className="mt-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-2 space-y-1">
                              {(track.modules || []).slice(0, 3).map((mod, chIdx) => {
                                const isChSelected = activeTrackIndex === trackIdx && activeModuleIndex === chIdx;
                                const mKey = `${trackIdx}-${chIdx}-${mod.id || mod.title}`;
                                const mStatus = moduleMastery[mKey];
                                const isCompleted = mStatus?.completed;

                                return (
                                  <div
                                    key={chIdx}
                                    onClick={() => {
                                      setActiveTrackIndex(trackIdx);
                                      setActiveModuleIndex(chIdx);
                                      setActiveChapterTab(0);
                                      setRevealedHintIndex(-1);
                                      setStudentApproach('');
                                    }}
                                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition cursor-pointer ${
                                      isChSelected && !isModuleLocked
                                        ? 'bg-blue-50/80 text-blue-900 border border-blue-100 font-semibold'
                                        : 'hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Chapter Circular Badge */}
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                        isCompleted
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : isChSelected && !isModuleLocked
                                          ? 'bg-blue-600 text-white shadow-xs'
                                          : 'bg-slate-50 border border-slate-200/70 text-slate-800'
                                      }`}>
                                        {isCompleted ? '✓' : chIdx + 1}
                                      </div>
                                      <p className="text-xs font-semibold leading-tight line-clamp-1">
                                        {mod.title}
                                      </p>
                                    </div>

                                    <div className="flex-shrink-0">
                                      {isModuleLocked ? (
                                        <Lock size={14} className="text-slate-400" />
                                      ) : isCompleted ? (
                                        <span className="text-[10px] font-bold text-emerald-600">Done</span>
                                      ) : (
                                        <ChevronRight size={14} className="text-slate-300" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Right Panel: The 9-Step Concept Learning Studio */}
                <div className="lg:col-span-8 space-y-6">
                  {(() => {
                    const isCurrentModuleLocked = activeTrackIndex >= unlockedBatchCount;
                    const cleanCurrentTrackTitle = currentTrack?.trackTitle.replace(/^Module\s*\d+\s*:\s*/i, '') || 'Module Overview';

                    if (isCurrentModuleLocked) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center space-y-6">
                          {/* Yellow Pill Tag */}
                          <div>
                            <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
                              X402 MICRO-TRANSACTION GATE · $0.09 USDC
                            </span>
                          </div>

                          {/* Titles */}
                          <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                              Unlock Module {activeTrackIndex + 1}
                            </h2>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                              ({cleanCurrentTrackTitle})
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xl mx-auto leading-relaxed pt-1">
                              This module includes 3 chapters. Unlock the full module to get access to all chapters, real-world examples, practice questions, and AI-powered feedback for only $0.09 USDC.
                            </p>
                          </div>

                          {/* 2 Side-by-Side Pricing Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fixed Micro-Price</p>
                              <p className="text-2xl font-black text-slate-900">0.09 USDC</p>
                              <p className="text-[11px] font-mono text-slate-500 font-semibold">90,000 micro-units</p>
                            </div>

                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-0.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Chain</p>
                              <p className="text-2xl font-black text-indigo-600">Algorand MainNet</p>
                              <p className="text-[11px] font-mono text-slate-500 font-semibold">ASA ID: 31566704</p>
                            </div>
                          </div>

                          {/* Big CTA Unlock Button */}
                          <div className="max-w-xl mx-auto space-y-2">
                            <button
                              type="button"
                              onClick={unlockLearningPathBatch}
                              disabled={isPayingFor === 'learningPath'}
                              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#e06a28] to-[#4338ca] text-white text-base font-bold shadow-lg shadow-indigo-500/20 hover:opacity-95 transition cursor-pointer"
                            >
                              {isPayingFor === 'learningPath' ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Signing Algorand Transaction in Wallet...</span>
                                </>
                              ) : (
                                <>
                                  <KeyRound size={18} />
                                  <span>Unlock 3 Chapters (0.09 USDC)</span>
                                </>
                              )}
                            </button>
                            <p className="text-[11px] text-slate-400 font-medium">
                              Signed directly via your connected Pera / Defly / Lute wallet via x402 HTTP 402 protocol.
                            </p>
                          </div>

                          {/* What you'll learn in this module Card */}
                          <div className="bg-slate-50/60 border border-slate-200/80 rounded-3xl p-6 text-left max-w-xl mx-auto space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                              <Target size={16} className="text-indigo-600" />
                              <span>What you'll learn in this module</span>
                            </div>

                            <div className="space-y-3.5">
                              {(currentTrack?.modules || []).slice(0, 3).map((mod, idx) => {
                                const icons = [
                                  <BookOpen key="0" size={16} className="text-purple-600" />,
                                  <Layers key="1" size={16} className="text-blue-600" />,
                                  <ShieldCheck key="2" size={16} className="text-indigo-600" />
                                ];
                                const iconBgs = ['bg-purple-50', 'bg-blue-50', 'bg-indigo-50'];

                                return (
                                  <div key={idx} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-xl ${iconBgs[idx % 3]} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                      {icons[idx % 3]}
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                                        {mod.overview || (idx === 0 ? 'Learn the core principles of good architecture and communication.' : idx === 1 ? 'Create professional designs and implementations from blueprints.' : 'Understand system needs and validate designs effectively.')}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (!currentModule) {
                      return (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-medium">
                          Select a concept from the left sidebar to start your learning path.
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Module Header Banner & Chapter Navigation Tabs */}
                        <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-violet-700 rounded-3xl p-6 text-white shadow-sm space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                              {currentTrack?.trackTitle}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-xs">
                                $0.09 USDC Batch Module Pass
                              </span>
                              <span className="text-xs font-medium text-indigo-100">
                                ⏱ {currentModule.estimatedTime || '30 mins'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{currentModule.title}</h2>
                            <p className="text-xs sm:text-sm text-indigo-100 font-medium max-w-2xl leading-relaxed mt-1">
                              {currentModule.overview || 'Master core concepts and prepare for interview-grade technical challenges.'}
                            </p>
                          </div>

                          {/* 3 Chapters Selection Tabs */}
                          <div className="pt-2 flex flex-wrap gap-2 border-t border-white/15">
                            {[
                              { id: 0, label: '📘 Chapter 1: Academic Theory & Math Foundations', desc: 'GeeksforGeeks Academic Analysis' },
                              { id: 1, label: '⚡ Chapter 2: Internal Mechanics & Visual SVG Line Diagram', desc: 'ChatGPT Line Diagram & Code' },
                              { id: 2, label: '🏛️ Chapter 3: Enterprise Architecture & Scenario Challenge', desc: '9-Step AI Challenge' }
                            ].map((chTab) => (
                              <button
                                key={chTab.id}
                                onClick={() => setActiveChapterTab(chTab.id)}
                                className={`text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex flex-col items-start ${
                                  activeChapterTab === chTab.id
                                    ? 'bg-white text-indigo-950 shadow-md font-extrabold'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                              >
                                <span>{chTab.label}</span>
                                <span className={`text-[10px] font-medium ${activeChapterTab === chTab.id ? 'text-indigo-700' : 'text-indigo-200'}`}>
                                  {chTab.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── CHAPTER 1: ACADEMIC THEORY & MATHEMATICAL FOUNDATIONS (GeeksforGeeks Style) ── */}
                        {activeChapterTab === 0 && (
                          <div className="space-y-6">
                            {/* Academic Definition & Core Theory */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                  CHAPTER 1
                                </span>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Academic Theory &amp; Foundational Concepts</h3>
                              </div>

                              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-2">
                                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Formal GeeksforGeeks Definition:</p>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                                  {currentModule.ch1?.definition || `${currentModule.title} is a core computer science data structure and algorithmic paradigm designed to optimize search, lookup, and data manipulation operations under tight operational constraints.`}
                                </p>
                              </div>

                              {/* Time & Space Complexity Grid */}
                              <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mathematical Complexity Analysis (Big-O Bounds)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Best Case Time</p>
                                    <p className="text-2xl font-black text-emerald-700">{currentModule.ch1?.timeComplexity?.best || 'O(1)'}</p>
                                    <p className="text-[11px] text-emerald-900 font-medium">Direct memory lookup or optimal hash bucket match.</p>
                                  </div>
                                  <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Average Case Time</p>
                                    <p className="text-2xl font-black text-indigo-700">{currentModule.ch1?.timeComplexity?.average || 'O(1)'}</p>
                                    <p className="text-[11px] text-indigo-900 font-medium">Expected runtime under uniform distribution assumption.</p>
                                  </div>
                                  <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Worst Case Time</p>
                                    <p className="text-2xl font-black text-rose-700">{currentModule.ch1?.timeComplexity?.worst || 'O(N)'}</p>
                                    <p className="text-[11px] text-rose-900 font-medium">Adverse collision or tree degeneration under bad inputs.</p>
                                  </div>
                                </div>

                                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs space-y-1">
                                  <span className="text-amber-400 font-bold">Auxiliary Space Complexity: {currentModule.ch1?.spaceComplexity?.auxiliary || 'O(N)'}</span>
                                  <p className="text-slate-300 font-sans text-xs">{currentModule.ch1?.spaceComplexity?.explanation || 'Allocates proportional memory for pointers and storage buffers.'}</p>
                                </div>
                              </div>

                              {/* Key Academic Invariants */}
                              <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Theoretical Invariants</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {(currentModule.ch1?.keyConcepts || currentModule.keyConcepts || []).map((kc, kci) => (
                                    <div key={kci} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                                      <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                        {kc.title}
                                      </p>
                                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{kc.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Edge Cases & Algorithmic Pitfalls */}
                              <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Academic Edge Cases &amp; Pitfalls</h4>
                                <div className="space-y-2">
                                  {(currentModule.ch1?.edgeCases || [
                                    'High Collision Clustering: Poor hash distribution degrades lookup from O(1) to O(N).',
                                    'Concurrent Mutation: Modifying data structure while iterating causes race conditions.',
                                    'Capacity Resizing Overhead: Re-allocating arrays causes transient latency spikes.'
                                  ]).map((ec, eci) => (
                                    <div key={eci} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-medium flex items-start gap-2">
                                      <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                      <span>{ec}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Navigation to Chapter 2 */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => setActiveChapterTab(1)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                              >
                                <span>Next: Chapter 2 (SVG Diagram &amp; Code)</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── CHAPTER 2: INTERNAL MECHANICS, SVG LINE DIAGRAM & CODE ── */}
                        {activeChapterTab === 1 && (
                          <div className="space-y-6">
                            {/* ChatGPT Style Connected Line & Box SVG Diagram */}
                            <SVGDiagramVisualizer
                              title={currentModule.ch2?.diagramTitle || `ChatGPT Line Diagram: ${currentModule.title} Pipeline`}
                              description={currentModule.ch2?.diagramDescription || 'Interactive connected line & box system visualizer showing request transformations.'}
                              nodes={currentModule.ch2?.nodes || [
                                { id: 'node-1', label: '1. Client Request Payload', subtext: `Inbound ${currentModule.title} parameters`, step: 1, tag: 'INBOUND', color: 'indigo' },
                                { id: 'node-2', label: '2. Algorithmic Transformation', subtext: 'Hashing / Index Evaluation', step: 2, tag: 'PROCESSING', color: 'blue' },
                                { id: 'node-3', label: '3. Memory & Index Lookup', subtext: 'O(1) Cache / Memory Check', step: 3, tag: 'LOOKUP', color: 'emerald' },
                                { id: 'node-4', label: '4. DB Fallback & Sync', subtext: 'ACID Persist & Sync Guard', step: 4, tag: 'PERSISTENCE', color: 'amber' }
                              ]}
                              connections={currentModule.ch2?.connections || [
                                { from: 'Node 1', to: 'Node 2' },
                                { from: 'Node 2', to: 'Node 3' },
                                { from: 'Node 3', to: 'Node 4' }
                              ]}
                            />

                            {/* Internal Execution Code Implementation */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                    CHAPTER 2 CODE
                                  </span>
                                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Production Code Implementation</h3>
                                </div>
                                <button
                                  onClick={() => handleCopyCode(currentModule.ch2?.codeSnippet || currentModule.codeExample?.code || '')}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                                >
                                  {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                                </button>
                              </div>

                              <div className="bg-slate-900 rounded-2xl p-5 font-mono text-xs text-slate-200 overflow-x-auto shadow-inner border border-slate-800">
                                <pre>
                                  <code>{currentModule.ch2?.codeSnippet || currentModule.codeExample?.code || `// Production Implementation for ${currentModule.title}
export class DataEngine {
  private memory = new Map();
  execute(key: string, val: any) {
    if (this.memory.has(key)) return this.memory.get(key);
    this.memory.set(key, val);
    return val;
  }
}`}</code>
                                </pre>
                              </div>

                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                                <p className="text-xs font-bold text-slate-900">Line-by-Line Academic Breakdown:</p>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                  {currentModule.ch2?.codeExplanation || `This production snippet encapsulates the internal execution flow of ${currentModule.title}, leveraging memory indexing and constant-time search guarantees.`}
                                </p>
                              </div>
                            </div>

                            {/* Chapter Navigation Buttons */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setActiveChapterTab(0)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition cursor-pointer"
                              >
                                <ArrowLeft size={14} />
                                <span>Previous: Chapter 1 (Theory)</span>
                              </button>

                              <button
                                onClick={() => setActiveChapterTab(2)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                              >
                                <span>Next: Chapter 3 (Architecture &amp; AI Challenge)</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── CHAPTER 3: ENTERPRISE ARCHITECTURE & SENIOR AI SCENARIO ── */}
                        {activeChapterTab === 2 && (
                          <div className="space-y-6">
                            {/* Real-World Production Applications */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                    CHAPTER 3
                                  </span>
                                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Where Is This Used In Production Systems?</h3>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                  Enterprise Stack Fits
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                {(currentModule.ch3?.realWorld || currentModule.realWorld || [
                                  { domain: '🛒 E-Commerce Platforms', pattern: 'Product ID → Cached Pricing & Inventory', productionNote: 'Distributed cache layer (Redis Cluster) with cache-aside pattern.' },
                                  { domain: '🏦 Banking & Payments', pattern: 'Account Ledger & Transaction Deduplication', productionNote: 'ACID PostgreSQL / CockroachDB with unique constraint indexes.' },
                                  { domain: '🌐 Web Applications', pattern: 'JWT Session Lookup & Rate Limiting', productionNote: 'In-memory token stores with sliding-window rate limit counters.' },
                                  { domain: '⚡ Cloud & APIs', pattern: 'Idempotency Keys & Deduplication Guard', productionNote: 'Distributed locks and Redis TTL keys at API gateway level.' }
                                ]).map((rw, rwi) => (
                                  <div key={rwi} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                                    <p className="text-xs font-bold text-slate-800">{rw.domain}</p>
                                    <div className="bg-white border border-slate-200/80 rounded-xl p-2 text-xs font-medium text-indigo-900">
                                      📌 {rw.pattern}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                      <span className="font-bold text-slate-700">Production Tech: </span>
                                      {rw.productionNote}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Engineering Scenario & Live AI Evaluation */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                    SCENARIO CHALLENGE
                                  </span>
                                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Senior AI Engineering Scenario</h3>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  AI Evaluated
                                </span>
                              </div>

                              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">Production Architecture Scenario:</p>
                                <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                                  {currentModule.ch3?.scenario || currentModule.scenario || `You are building a high-throughput system with millions of daily users. Repeated database queries for hot resources are causing response latency to spike to >2.5s. How would you solve this using ${currentModule.title}?`}
                                </p>
                              </div>

                              {/* Progressive Hints Accordion */}
                              {(currentModule.ch3?.progressiveHints || currentModule.progressiveHints || []).length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                      <Lightbulb size={14} className="text-amber-500" />
                                      Progressive Hints ({Math.max(0, revealedHintIndex + 1)}/{(currentModule.ch3?.progressiveHints || currentModule.progressiveHints)?.length} Revealed)
                                    </span>
                                    {revealedHintIndex < (currentModule.ch3?.progressiveHints || currentModule.progressiveHints || []).length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setRevealedHintIndex(prev => prev + 1)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                      >
                                        + Reveal Hint {revealedHintIndex + 2}
                                      </button>
                                    )}
                                  </div>

                                  {(currentModule.ch3?.progressiveHints || currentModule.progressiveHints || []).map((hint, hi) => (
                                    hi <= revealedHintIndex && (
                                      <motion.div
                                        key={hi}
                                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-amber-50/70 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs font-medium flex items-start gap-2"
                                      >
                                        <span className="font-bold text-amber-700">Hint {hi + 1}:</span>
                                        <span>{hint}</span>
                                      </motion.div>
                                    )
                                  ))}
                                </div>
                              )}

                              {/* Student Approach Input */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-700">Your Engineering Approach &amp; Reasoning:</label>
                                  {speechRecognitionSupported && (
                                    <button
                                      type="button"
                                      onClick={toggleVoiceRecording}
                                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                                        isRecordingVoice
                                          ? 'bg-rose-500 text-white animate-pulse'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      }`}
                                    >
                                      {isRecordingVoice ? <MicOff size={13} /> : <Mic size={13} />}
                                      <span>{isRecordingVoice ? 'Listening (Speak approach)...' : 'Voice Input'}</span>
                                    </button>
                                  )}
                                </div>

                                <textarea
                                  value={studentApproach}
                                  onChange={e => setStudentApproach(e.target.value)}
                                  placeholder="Explain what technologies you would use, why you would use them, how the workflow operates, trade-offs (e.g. cache invalidation, consistency), and failure modes..."
                                  className="w-full h-32 text-xs sm:text-sm text-slate-800 border border-slate-200 rounded-2xl p-4 outline-none focus:border-indigo-500 focus:bg-white bg-slate-50/50 transition font-medium"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleEvaluateScenario}
                                disabled={!studentApproach.trim() || isEvaluatingScenario}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-md cursor-pointer ${
                                  studentApproach.trim() && !isEvaluatingScenario
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                              >
                                {isEvaluatingScenario ? (
                                  <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Senior Principal Engineer AI Evaluating Your Approach...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={15} />
                                    <span>Submit Engineering Approach &amp; Get AI Evaluation</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* AI Evaluation & Scorecard */}
                            {currentEvaluation && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-sm space-y-5"
                              >
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-white bg-emerald-600 px-2.5 py-1 rounded-lg">
                                      EVALUATION SCORE
                                    </span>
                                    <h3 className="text-base font-black text-slate-900">AI Engineering Reasoning Evaluation</h3>
                                  </div>
                                  <span className="text-2xl font-black text-emerald-600">
                                    {currentEvaluation.overallScore} / 100
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Identified Strengths */}
                                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                                    <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                      <CheckCircle2 size={15} className="text-emerald-600" />
                                      What You Correctly Identified:
                                    </p>
                                    <div className="space-y-1.5">
                                      {currentEvaluation.whatYouIdentified?.map((str, si) => (
                                        <div key={si} className="flex items-start gap-2 text-xs text-emerald-950 font-medium">
                                          <span className="text-emerald-600 font-bold">✓</span>
                                          <span>{str}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* What to Consider */}
                                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                      <AlertCircle size={15} className="text-amber-600" />
                                      What You Should Consider (Edge Cases):
                                    </p>
                                    <div className="space-y-1.5">
                                      {currentEvaluation.whatToConsider?.map((con, ci) => (
                                        <div key={ci} className="flex items-start gap-2 text-xs text-amber-950 font-medium">
                                          <span className="text-amber-600 font-bold">⚠</span>
                                          <span>{con}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* Chapter Navigation Buttons */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setActiveChapterTab(1)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition cursor-pointer"
                              >
                                <ArrowLeft size={14} />
                                <span>Previous: Chapter 2 (Diagram &amp; Code)</span>
                              </button>

                              <button
                                onClick={handleNextConcept}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                              >
                                <span>Next Module in Track</span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

              </div>
            )}

            {/* TAB CONTENT 2: INTERVIEW QUESTIONS EXPLORER */}
            {activeMainTab === 'questions' && (
              !isQuestionsUnlocked ? (
                <div className="bg-white border border-indigo-200 rounded-3xl p-8 shadow-sm space-y-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <Lock size={32} />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      x402 Pay-Per-Use Pass · $0.03 USDC
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">
                      Unlock Tailored Technical &amp; Architectural Interview Questions
                    </h2>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Access 8+ high-yield system design, database indexing, and backend architecture interview questions with complete Senior Engineer STAR answers and trade-off defense.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-md mx-auto grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Micro-Price</p>
                      <p className="text-base font-black text-slate-800">0.03 USDC</p>
                      <p className="text-[10px] text-slate-400 font-mono">30,000 micro-units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Network &amp; Method</p>
                      <p className="text-base font-black text-indigo-600">Algorand MainNet</p>
                      <p className="text-[10px] text-slate-400 font-mono">GET &amp; POST Supported</p>
                    </div>
                  </div>

                    <div className="max-w-md mx-auto space-y-2">
                    <button
                      type="button"
                      onClick={unlockQuestions}
                      disabled={isPayingFor === 'questions'}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition cursor-pointer"
                    >
                      {isPayingFor === 'questions' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing Algorand Transaction in Wallet...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={16} />
                          <span>Unlock All Questions ($0.03 USDC)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Signed securely via connected Pera / Algorand wallet
                    </p>
                  </div>

                  {/* Blurred Question Previews */}
                  <div className="pt-4 max-w-2xl mx-auto opacity-40 blur-[2px] pointer-events-none space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700">Hard</span>
                        <span className="text-[10px] font-semibold text-slate-500">System Design</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">How would you design an idempotent payment processing pipeline to prevent duplicate charges upon network timeouts?</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">Medium</span>
                        <span className="text-[10px] font-semibold text-slate-500">Database Indexing</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">Explain the difference between Cache-Aside, Write-Through, and Write-Behind caching strategies with trade-offs.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Category:</span>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                            categoryFilter === cat
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Difficulty:</span>
                      {['All', 'easy', 'medium', 'hard'].map(diff => (
                        <button
                          key={diff}
                          onClick={() => setDifficultyFilter(diff)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border capitalize transition cursor-pointer ${
                            difficultyFilter === diff
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredQs.map((q, idx) => {
                      const isExpanded = expandedQuestion === idx;
                      const diffStyle = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium;

                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-slate-300 transition">
                          <div
                            onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                            className="flex items-start justify-between gap-4 cursor-pointer"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${diffStyle.color}`}>
                                  {diffStyle.label}
                                </span>
                                {q.category && (
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {q.category}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 leading-snug">{q.question}</h4>
                            </div>

                            <button className="text-slate-400 hover:text-slate-600 p-1">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>

                          {isExpanded && q.sampleAnswer && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                              className="pt-3 border-t border-slate-100 space-y-2 text-xs"
                            >
                              <p className="font-bold text-indigo-700 uppercase tracking-wider text-[11px]">Senior Engineer STAR Answer &amp; Architecture:</p>
                              <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 border border-slate-100 rounded-xl p-3.5 whitespace-pre-line">
                                {q.sampleAnswer}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* TAB CONTENT 3: CONTEXTUAL STUDY RESOURCES */}
            {activeMainTab === 'resources' && (
              !isResourcesUnlocked ? (
                <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-sm space-y-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <BookOpen size={32} />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      x402 Pay-Per-Use Pass · $0.03 USDC
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">
                      Unlock Verified Architectural &amp; System Design Study Primers
                    </h2>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Access authoritative documentation, PostgreSQL query optimization blueprints, Redis distributed caching patterns, and API security specifications curated for your gaps.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-md mx-auto grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Micro-Price</p>
                      <p className="text-base font-black text-slate-800">0.03 USDC</p>
                      <p className="text-[10px] text-slate-400 font-mono">30,000 micro-units</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Network &amp; Method</p>
                      <p className="text-base font-black text-emerald-600">Algorand MainNet</p>
                      <p className="text-[10px] text-slate-400 font-mono">GET &amp; POST Supported</p>
                    </div>
                  </div>

                  <div className="max-w-md mx-auto space-y-2">
                    <button
                      type="button"
                      onClick={unlockStudyResources}
                      disabled={isPayingFor === 'resources'}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-700 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                    >
                      {isPayingFor === 'resources' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing Algorand Transaction in Wallet...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={16} />
                          <span>Unlock Study Resources ($0.03 USDC)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Signed securely via connected Pera / Algorand wallet
                    </p>
                  </div>

                  {/* Blurred Previews */}
                  <div className="pt-4 max-w-2xl mx-auto opacity-40 blur-[2px] pointer-events-none grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">Documentation</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">The System Design Primer - Interactive Blueprint</h4>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">Tutorial</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">PostgreSQL Query Optimization &amp; EXPLAIN ANALYZE</h4>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={18} className="text-indigo-600" />
                      <h3 className="text-sm font-extrabold text-slate-900">Contextual High-Yield Study Resources</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Verified documentation, system design primers, and practice repositories directly bridging your identified gaps.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(result.resources || [
                      { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'Documentation', category: 'System Design' },
                      { title: 'LeetCode Top Interview 150', url: 'https://leetcode.com/studyplan/top-interview-150/', type: 'Practice Platform', category: 'Algorithms' },
                      { title: 'MDN Web HTTP Architecture', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'Documentation', category: 'Web Fundamentals' }
                    ]).map((resItem, ri) => (
                      <a
                        key={ri}
                        href={resItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {resItem.type || 'Resource'}
                            </span>
                            {resItem.category && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {resItem.category}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                            {resItem.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs font-medium font-mono">
                            {resItem.url}
                          </p>
                        </div>
                        <ArrowUpRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition mt-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )
            )}

          </div>
        )}

      </main>
    </div>
  );
};

export default InterviewPrep;
