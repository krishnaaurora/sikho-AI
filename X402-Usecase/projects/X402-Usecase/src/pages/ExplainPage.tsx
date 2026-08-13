import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles, BookOpen, Layers, Terminal, ListChecks, Cpu,
  Globe, Play, AlertCircle, Brain, Zap, Code2, Eye,
  GitBranch, MessageSquare, CheckSquare, AlertTriangle,
  ArrowRight, ChevronRight, Loader2, Copy, Check, Upload, Link, FileText, ChevronDown, CheckCircle, HelpCircle, History, X
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExplanationBlock {
  id: string;
  type: string;
  title: string;
  content?: string;
  items?: string[];
  nodes?: string[];
  code?: string;
  language?: string;
}

interface SourceReference {
  sourceId: string;
  sourceName: string;
  pageOrUrl?: string;
  chunkText: string;
}

interface ExplanationResult {
  topic: string;
  preferences: {
    learningStyle: string;
    depth: string;
    examples: string;
    language: string;
  };
  blocks: ExplanationBlock[];
  sources?: SourceReference[];
}

interface ConceptStatus {
  concept: string;
  status: 'mastered' | 'understood' | 'partial' | 'weak' | 'unknown';
}

interface LearningSession {
  _id: string;
  topic: string;
  sourceId?: string;
  knowledgeMap: ConceptStatus[];
  preferredStyle: string;
  preferredLanguage: string;
}

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

interface MindMapData {
  type: 'mindmap';
  root: string;
  children: MindMapNode[];
}

interface SynthesisReport {
  understood: string[];
  partiallyUnderstood: string[];
  missing: string[];
  misconceptions: string[];
}

// ─── Block config ─────────────────────────────────────────────────────────────

const BLOCK_META: Record<string, { icon: React.ReactNode; accent: string; bg: string; border: string }> = {
  definition:           { icon: <BookOpen size={16} />,       accent: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  explanation:          { icon: <Layers size={16} />,         accent: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  'why-it-exists':      { icon: <Brain size={16} />,          accent: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-200' },
  'how-it-works':       { icon: <Cpu size={16} />,            accent: 'text-cyan-600',    bg: 'bg-cyan-50',     border: 'border-cyan-200' },
  'mental-model':       { icon: <Brain size={16} />,          accent: 'text-purple-600',  bg: 'bg-purple-50',   border: 'border-purple-200' },
  architecture:         { icon: <GitBranch size={16} />,      accent: 'text-sky-600',     bg: 'bg-sky-50',      border: 'border-sky-200' },
  flow:                 { icon: <GitBranch size={16} />,      accent: 'text-teal-600',    bg: 'bg-teal-50',     border: 'border-teal-200' },
  code:                 { icon: <Code2 size={16} />,          accent: 'text-emerald-600', bg: 'bg-[#0f172a]',   border: 'border-slate-700' },
  output:               { icon: <Terminal size={16} />,       accent: 'text-lime-400',    bg: 'bg-[#0f172a]',   border: 'border-slate-700' },
  example:              { icon: <Eye size={16} />,            accent: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  'real-world':         { icon: <Zap size={16} />,            accent: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  'common-mistakes':    { icon: <AlertTriangle size={16} />,  accent: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  'edge-cases':         { icon: <AlertTriangle size={16} />,  accent: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200' },
  'trade-offs':         { icon: <CheckSquare size={16} />,    accent: 'text-rose-600',    bg: 'bg-rose-50',     border: 'border-rose-200' },
  advantages:           { icon: <CheckSquare size={16} />,    accent: 'text-green-600',   bg: 'bg-green-50',    border: 'border-green-200' },
  limitations:          { icon: <AlertCircle size={16} />,    accent: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  terminology:          { icon: <BookOpen size={16} />,       accent: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200' },
  'related-concepts':   { icon: <Layers size={16} />,         accent: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200' },
  'interview-answer':   { icon: <MessageSquare size={16} />,  accent: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  'follow-ups':         { icon: <ChevronRight size={16} />,   accent: 'text-purple-600',  bg: 'bg-purple-50',   border: 'border-purple-200' },
  trap:                 { icon: <AlertTriangle size={16} />,  accent: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
  comparison:           { icon: <CheckSquare size={16} />,    accent: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  background:           { icon: <BookOpen size={16} />,       accent: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200' },
  summary:              { icon: <ListChecks size={16} />,      accent: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  'interview-perspective': { icon: <MessageSquare size={16} />, accent: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  takeaways:            { icon: <ListChecks size={16} />,      accent: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
};

function getBlockMeta(type: string) {
  return BLOCK_META[type] ?? { icon: <BookOpen size={16} />, accent: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
}

// ─── Code Block with copy ─────────────────────────────────────────────────────

const CodeBlock: React.FC<{ code: string; lang?: string; isOutput?: boolean }> = ({ code, lang, isOutput }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 text-sm font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          {lang && (
            <span className="ml-2 text-xs text-slate-400 font-sans">{isOutput ? 'output' : lang}</span>
          )}
        </div>
        {!isOutput && (
          <button onClick={copy} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>
      <pre className={`px-5 py-4 overflow-x-auto leading-relaxed ${isOutput ? 'text-lime-400 bg-[#0a0f1e]' : 'text-slate-100 bg-[#0d1117]'}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ─── Flow Diagram ─────────────────────────────────────────────────────────────

const FlowDiagram: React.FC<{ nodes: string[] }> = ({ nodes }) => (
  <div className="flex flex-wrap items-center gap-2 py-2">
    {nodes.map((node, i) => (
      <React.Fragment key={i}>
        <div className="px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold whitespace-nowrap shadow-sm">
          {node}
        </div>
        {i < nodes.length - 1 && (
          <ArrowRight size={16} className="text-teal-400 flex-shrink-0" />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Mind Map Renderer (Dynamic SVG Tree) ─────────────────────────────────────

const InteractiveMindMap: React.FC<{ data: MindMapData; onNodeClick: (name: string) => void }> = ({ data, onNodeClick }) => {
  const renderNode = (node: MindMapNode, depth = 0): React.ReactNode => (
    <div key={node.name} style={{ marginLeft: `${depth * 24}px` }} className="border-l border-slate-200 pl-4 py-1.5">
      <div 
        onClick={() => onNodeClick(node.name)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all text-xs font-semibold text-slate-800 shadow-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        {node.name}
      </div>
      {node.children && node.children.map(child => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
        <Brain className="text-blue-500" size={18} />
        <h4 className="text-sm font-bold text-slate-900">Interactive Concept Mind Map</h4>
      </div>
      <div className="overflow-y-auto max-h-[400px] space-y-2">
        <div className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm mb-4">
          {data.root}
        </div>
        {data.children && data.children.map(child => renderNode(child, 1))}
      </div>
    </div>
  );
};

// ─── Individual Block Renderer ────────────────────────────────────────────────

const ExplainBlock: React.FC<{ block: ExplanationBlock; index: number; onCitationClick?: (text: string) => void }> = ({ block, index, onCitationClick }) => {
  const meta = getBlockMeta(block.type);
  const isCode = block.type === 'code';
  const isOutput = block.type === 'output';
  const isFlow = block.type === 'flow';
  const isDark = isCode || isOutput;

  // Search text for citations like [Source: X] or [1]
  const renderContent = (text: string) => {
    const citationRegex = /(\[Source:[^\]]+\]|\[\d+\])/g;
    const parts = text.split(citationRegex);
    return parts.map((part, idx) => {
      if (citationRegex.test(part)) {
        return (
          <span 
            key={idx} 
            onClick={() => onCitationClick && onCitationClick(part)}
            className="inline-block px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold font-mono cursor-pointer hover:bg-blue-100 transition-colors ml-1"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700 bg-[#0d1117]' : `${meta.border} bg-white`}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={`px-5 py-3.5 border-b flex items-center gap-2.5 ${isDark ? 'border-slate-700 bg-slate-800/60' : `${meta.border} ${meta.bg}`}`}>
        <span className={`${isDark ? 'text-slate-300' : meta.accent}`}>{meta.icon}</span>
        <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {block.title}
        </h3>
        <span className={`ml-auto text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-white/70 text-slate-400 border border-slate-200'}`}>
          {block.type}
        </span>
      </div>

      <div className="px-5 py-4">
        {isFlow && block.nodes && block.nodes.length > 0 && (
          <FlowDiagram nodes={block.nodes} />
        )}

        {(isCode || isOutput) && block.code && (
          <CodeBlock code={block.code} lang={block.language} isOutput={isOutput} />
        )}

        {block.content && !isCode && !isOutput && (
          <p className="text-slate-700 text-sm leading-relaxed font-medium whitespace-pre-wrap">
            {renderContent(block.content)}
          </p>
        )}

        {block.items && block.items.length > 0 && (
          <ul className="space-y-2.5 mt-1">
            {block.items.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-slate-700 font-medium leading-relaxed">
                <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${meta.bg} ${meta.accent} border ${meta.border}`}>
                  {idx + 1}
                </span>
                <span>{renderContent(item)}</span>
              </li>
            ))}
          </ul>
        )}

        {isFlow && block.content && (
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">{renderContent(block.content)}</p>
        )}
      </div>
    </div>
  );
};

const STYLE_LABELS: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
  academic:   { label: 'Academic',   desc: 'Formal, textbook precision',    icon: <BookOpen size={14} /> },
  visual:     { label: 'Visual',     desc: 'Flow diagrams & mental models', icon: <Eye size={14} /> },
  practical:  { label: 'Practical',  desc: 'Code-first, build-it approach', icon: <Code2 size={14} /> },
  interview:  { label: 'Interview',  desc: '30-sec answer + follow-ups',    icon: <MessageSquare size={14} /> },
  beginner:   { label: 'Beginner',   desc: 'Zero-jargon, step-by-step',     icon: <Brain size={14} /> },
};

const ExplainPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [learningStyle, setLearningStyle] = useState<'academic' | 'visual' | 'practical' | 'interview' | 'beginner'>(() => {
    const style = searchParams.get('style');
    if (style === 'interview' || style === 'practical' || style === 'visual' || style === 'beginner') return style;
    return 'academic';
  });
  const depth = 'deep' as const;
  const examples = 'example-heavy' as const;
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Source upload states
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedSource, setUploadedSource] = useState<{ id: string; name: string; type: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  
  // Workspace & Version states
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [sessionVersions, setSessionVersions] = useState<any[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  
  // Mindmap, Comparison, Synthesis
  const [mindmapData, setMindmapData] = useState<MindMapData | null>(null);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  
  const [synthesisText, setSynthesisText] = useState('');
  const [synthesisResult, setSynthesisResult] = useState<SynthesisReport | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const [compareV1, setCompareV1] = useState<string | null>(null);
  const [compareV2, setCompareV2] = useState<string | null>(null);
  const [compareReport, setCompareReport] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/v1/ai/explain/history', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        setHistorySessions(data.data || []);
      }
    } catch (_) {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadStatus('Processing PDF...');

    try {
      const response = await fetch('/api/v1/ai/explain/source/pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setUploadedSource({
          id: data.data.sourceId,
          name: data.data.name,
          type: data.data.type
        });
        setUploadStatus('✓ Source ready');
      } else {
        setUploadStatus('Upload failed. Choose a valid PDF.');
      }
    } catch (_) {
      setUploadStatus('Upload error.');
    }
  };

  const handleUrlIngestion = async () => {
    if (!urlInput.trim()) return;
    setUploadStatus('Ingesting website...');

    try {
      const response = await fetch('/api/v1/ai/explain/source/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ url: urlInput })
      });
      const data = await response.json();
      if (data.success) {
        setUploadedSource({
          id: data.data.sourceId,
          name: data.data.name,
          type: data.data.type
        });
        setUploadStatus('✓ Source ready');
        setUrlInput('');
      } else {
        setUploadStatus('Ingestion failed. Verify the URL.');
      }
    } catch (_) {
      setUploadStatus('Ingestion error.');
    }
  };

  const loadSessionWorkspace = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/ai/explain/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        setActiveSession(data.data);
        setSessionVersions(data.data.history || []);
        if (data.data.history?.length > 0) {
          const latest = data.data.history[data.data.history.length - 1];
          setResult({
            topic: data.data.topic,
            preferences: {
              learningStyle: latest.learningStyle,
              depth: latest.depth,
              examples: latest.examples || 'example-heavy',
              language: latest.language
            },
            blocks: latest.blocks,
            sources: latest.sources
          });
          setActiveVersionId(latest._id);
        }
      }
    } catch (_) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a concept or question to explain.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setMindmapData(null);
    setSynthesisResult(null);

    try {
      // 1. Initialize session
      const sessionResponse = await fetch('/api/v1/ai/explain/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          topic: trimmed,
          sourceId: uploadedSource?.id,
          preferredStyle: learningStyle,
          preferredLanguage: language
        })
      });
      const sessionData = await sessionResponse.json();
      if (!sessionData.success) throw new Error('Could not start session.');
      const session = sessionData.data;
      setActiveSession(session);

      // 2. Fetch explanation
      const response = await fetch('/api/v1/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          query: trimmed,
          learningStyle,
          depth,
          examples,
          language,
          sourceId: uploadedSource?.id
        })
      });
      const explainData = await response.json();

      if (explainData.success && explainData.data) {
        setResult(explainData.data);
        
        // 3. Save as V1 version
        const vResponse = await fetch(`/api/v1/ai/explain/${session._id}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            versionName: `V${session.history.length + 1} - ${learningStyle}`,
            learningStyle,
            depth,
            language,
            blocks: explainData.data.blocks,
            sources: explainData.data.sources
          })
        });
        const vData = await vResponse.json();
        if (vData.success) {
          setActiveVersionId(vData.data._id);
          loadSessionWorkspace(session._id);
        }
        fetchHistory();
      } else {
        setError(explainData.message || 'Failed to generate explanation.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Verify auth.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMindMapGeneration = async () => {
    if (!activeSession) return;
    setIsGeneratingMindmap(true);

    try {
      const response = await fetch('/api/v1/ai/explain/mind-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          topic: activeSession.topic,
          sourceId: activeSession.sourceId
        })
      });
      const data = await response.json();
      if (data.success) {
        setMindmapData(data.data);
      }
    } catch (_) {
    } finally {
      setIsGeneratingMindmap(false);
    }
  };

  const handleCompare = async () => {
    if (!compareV1 || !compareV2) return;
    setIsComparing(true);
    setCompareReport(null);

    try {
      const response = await fetch('/api/v1/ai/explain/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          v1Id: compareV1,
          v2Id: compareV2,
          topic: activeSession?.topic
        })
      });
      const data = await response.json();
      if (data.success) {
        setCompareReport(data.data);
      }
    } catch (_) {
    } finally {
      setIsComparing(false);
    }
  };

  const handleSynthesisSubmit = async () => {
    if (!activeSession || !synthesisText.trim()) return;
    setIsSynthesizing(true);
    setSynthesisResult(null);

    try {
      const response = await fetch('/api/v1/ai/explain/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          sessionId: activeSession._id,
          studentExplanation: synthesisText,
          topic: activeSession.topic
        })
      });
      const data = await response.json();
      if (data.success) {
        setSynthesisResult(data.data.report);
        loadSessionWorkspace(activeSession._id);
      }
    } catch (_) {
    } finally {
      setIsSynthesizing(false);
    }
  };

  const loadVersion = (version: any) => {
    setResult({
      topic: activeSession?.topic || 'Explanation',
      preferences: {
        learningStyle: version.learningStyle,
        depth: version.depth,
        examples: 'example-heavy',
        language: version.language
      },
      blocks: version.blocks,
      sources: version.sources
    });
    setActiveVersionId(version._id);
  };

  // Preference badge helper
  const prefBadge = (label: string) => (
    <span key={label} className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-20">
      
      {/* ── Source Ingestion Header panel ── */}
      <div className="bg-white border-b border-slate-200 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-blue-500 animate-pulse" size={24} />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Source-Grounded Learning Workspace</h2>
              <p className="text-xs text-slate-500">Ground explanations in PDFs or website documentation</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* PDF Upload */}
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-250 rounded-xl cursor-pointer text-xs font-bold transition-all border border-slate-200 text-slate-800">
              <Upload size={14} className="text-blue-500" />
              <span>Upload PDF</span>
              <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {uploadStatus && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 pl-2">
            <span className="text-[11px] font-mono bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-blue-600">
              {uploadStatus}
            </span>
            {uploadedSource && (
              <span className="text-[11px] font-mono text-slate-600 font-semibold">
                📄 {uploadedSource.name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Main Form query box */}
        {!result && !isLoading && (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm mb-12">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Concept or question
                </label>
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Explain WebSockets for system design"
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                  Learning Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(STYLE_LABELS).map(style => {
                    const active = learningStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setLearningStyle(style as any)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 border-slate-250 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {STYLE_LABELS[style].icon}
                        {STYLE_LABELS[style].label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                    Language
                  </label>
                  <select 
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Spanish">Spanish</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={!query.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-slate-400 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Play size={12} />
                Build Grounded Explanation
              </button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="max-w-2xl mx-auto space-y-4 py-12 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-800 rounded w-1/2" />
            <div className="h-24 bg-slate-800 rounded-xl w-full" />
            <div className="h-24 bg-slate-800 rounded-xl w-full" />
          </div>
        )}

        {/* ── 3-Column Grounded Learning Workspace ── */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Learning Map & Workspace Actions */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* History / Version Snapshots */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                  <History className="text-slate-500" size={16} />
                  <h3 className="text-xs font-bold tracking-widest text-slate-750 uppercase">Version History</h3>
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {sessionVersions.map((version) => (
                    <button
                      key={version._id}
                      onClick={() => loadVersion(version)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        activeVersionId === version._id
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {version.versionName}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-3.5 space-y-2">
                  <button 
                    onClick={handleMindMapGeneration}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <Brain size={12} className="text-blue-500" />
                    {isGeneratingMindmap ? 'Building Mindmap...' : 'Interactive Mind Map'}
                  </button>
                </div>
              </div>

              {/* Concept Knowledge Map */}
              {activeSession && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold tracking-widest text-slate-750 uppercase border-b border-slate-200 pb-2.5">
                    Concept Knowledge Map
                  </h3>
                  <div className="space-y-2.5">
                    {activeSession.knowledgeMap.map((concept, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2">
                        <span className="text-xs font-semibold text-slate-700">{concept.concept}</span>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                          concept.status === 'mastered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          concept.status === 'partial' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                          concept.status === 'weak' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                          'bg-slate-200 text-slate-600 border border-slate-300'
                        }`}>
                          {concept.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center Column: Explanation Contents & active synthesis */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Workspace Header */}
              <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[9px] font-mono bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full uppercase font-bold">
                    Active Workspace
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1.5">{result.topic}</h2>
                </div>
                <div className="flex gap-1.5">
                  {prefBadge(STYLE_LABELS[result.preferences.learningStyle]?.label ?? result.preferences.learningStyle)}
                  {prefBadge(result.preferences.language)}
                </div>
              </div>

              {/* Mind map tree rendering */}
              {mindmapData && (
                <InteractiveMindMap data={mindmapData} onNodeClick={(node) => {
                  setQuery(`Explain ${node} in context of ${result.topic}`);
                  handleSubmit({ preventDefault: () => {} } as any);
                }} />
              )}

              {/* Version Comparison Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h3 className="text-xs font-bold tracking-widest text-slate-750 uppercase">Version Comparison</h3>
                  <button 
                    onClick={handleCompare} 
                    disabled={!compareV1 || !compareV2 || isComparing}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-[10px] font-bold text-white rounded-lg transition-all"
                  >
                    {isComparing ? 'Comparing...' : 'Compare Selected'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Version A</label>
                    <select 
                      value={compareV1 || ''} 
                      onChange={e => setCompareV1(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="">Select...</option>
                      {sessionVersions.map(v => <option key={v._id} value={v._id}>{v.versionName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-1">Version B</label>
                    <select 
                      value={compareV2 || ''} 
                      onChange={e => setCompareV2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="">Select...</option>
                      {sessionVersions.map(v => <option key={v._id} value={v._id}>{v.versionName}</option>)}
                    </select>
                  </div>
                </div>

                {compareReport && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5 text-xs text-slate-700 leading-relaxed font-semibold">
                    <div>
                      <h4 className="text-blue-600 font-bold mb-1">Key Differences</h4>
                      <ul className="list-disc list-inside space-y-0.5">
                        {compareReport.keyDifferences.map((d: string, i: number) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <h4 className="text-emerald-600 font-bold mb-1">V1 Explains Better</h4>
                        <p>{compareReport.v1ExplainsBetter.join(", ")}</p>
                      </div>
                      <div>
                        <h4 className="text-indigo-600 font-bold mb-1">V2 Explains Better</h4>
                        <p>{compareReport.v2ExplainsBetter.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* explanation blocks */}
              <div className="space-y-4">
                {result.blocks.map((block, idx) => (
                  <ExplainBlock 
                    key={block.id} 
                    block={block} 
                    index={idx} 
                    onCitationClick={(citation) => setSelectedCitation(citation)}
                  />
                ))}
              </div>

              {/* Synthesize section */}
              {activeSession && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <CheckCircle className="text-blue-500" size={18} />
                    <h4 className="text-sm font-bold text-slate-900">Synthesize what you learned</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Explain this concept back in your own words. The engine will evaluate and identify knowledge gaps.
                  </p>
                  <textarea
                    rows={4}
                    value={synthesisText}
                    onChange={e => setSynthesisText(e.target.value)}
                    placeholder="Enter your explanation..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold placeholder:text-slate-400 text-slate-900 outline-none focus:border-blue-500 transition-all"
                  />
                  <button
                    onClick={handleSynthesisSubmit}
                    disabled={isSynthesizing || !synthesisText.trim()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl text-xs font-bold text-white transition-all"
                  >
                    {isSynthesizing ? 'Evaluating explanation...' : 'Submit Evaluation'}
                  </button>

                  {synthesisResult && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                      <div>
                        <h5 className="text-emerald-600 font-bold">✓ Understood</h5>
                        <ul className="list-disc list-inside mt-1 text-slate-700">{synthesisResult.understood.map((u, i) => <li key={i}>{u}</li>)}</ul>
                      </div>
                      {synthesisResult.partiallyUnderstood.length > 0 && (
                        <div>
                          <h5 className="text-amber-600 font-bold">△ Partially Understood</h5>
                          <ul className="list-disc list-inside mt-1 text-slate-700">{synthesisResult.partiallyUnderstood.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                      {synthesisResult.missing.length > 0 && (
                        <div>
                          <h5 className="text-rose-600 font-bold">✗ Missing / Gaps</h5>
                          <ul className="list-disc list-inside mt-1 text-slate-700">{synthesisResult.missing.map((m, i) => <li key={i}>{m}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Grounded Sources & Citations */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Citations panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold tracking-widest text-slate-750 uppercase border-b border-slate-200 pb-2.5 flex items-center justify-between">
                  <span>Verified Sources</span>
                  <span className="text-[10px] text-blue-600 font-mono">Grounded</span>
                </h3>
                
                {result.sources && result.sources.length > 0 ? (
                  <div className="space-y-3">
                    {result.sources.map((source, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{source.sourceName}</span>
                          <span className="text-[9px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-300">
                            {source.pageOrUrl}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal line-clamp-3 italic">
                          "{source.chunkText}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No grounded sources attached to this explanation.</p>
                )}
              </div>

              {selectedCitation && (
                <div className="bg-white border border-blue-200 rounded-2xl p-5 space-y-3 relative shadow-sm">
                  <button onClick={() => setSelectedCitation(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                  </button>
                  <h4 className="text-xs font-bold text-blue-600">Selected Citation Reference</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {selectedCitation}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ExplainPage;
