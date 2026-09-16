import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Server, Cpu, Globe, Users, ArrowRight, ShieldCheck, Zap, Activity, Layers, Code, HardDrive, RefreshCw } from 'lucide-react';

interface UniversalVisualizerProps {
  concept: string;
  visualType: string;
  stepNumber: number;
  isPlaying: boolean;
  highlightNodes?: string[];
  animationMode?: string;
  stepTitle?: string;
}

export const UniversalVisualizer: React.FC<UniversalVisualizerProps> = ({
  concept,
  visualType,
  stepNumber,
  isPlaying,
  highlightNodes = [],
  animationMode,
  stepTitle,
}) => {
  const [packetKey, setPacketKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPacketKey((prev) => (prev + 1) % 1000);
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Determine stage layout nodes based on concept / visualType
  const isCaching = visualType.includes('cache') || concept.toLowerCase().includes('cach') || concept.toLowerCase().includes('redis');
  const isDataPipeline = visualType.includes('pipeline') || visualType.includes('data') || concept.toLowerCase().includes('kafka') || concept.toLowerCase().includes('queue');
  const isSearchAlgo = concept.toLowerCase().includes('search') || concept.toLowerCase().includes('binary') || concept.toLowerCase().includes('tree') || concept.toLowerCase().includes('sort');

  const getNodeHighlightClass = (nodeId: string) => {
    const isHighlighted = highlightNodes.some(h => h.toLowerCase().includes(nodeId.toLowerCase())) ||
      (stepNumber === 1 && (nodeId === 'input' || nodeId === 'client')) ||
      (stepNumber === 2 && (nodeId === 'core' || nodeId === 'engine' || nodeId === 'cache')) ||
      (stepNumber === 3 && (nodeId === 'output' || nodeId === 'db' || nodeId === 'worker'));

    return isHighlighted
      ? 'border-cyan-400 bg-cyan-950/80 shadow-[0_0_25px_rgba(6,182,212,0.45)] text-cyan-200 scale-105 ring-2 ring-cyan-400/50'
      : 'border-slate-800 bg-slate-900/80 text-slate-400 opacity-75 hover:opacity-100 hover:border-slate-700';
  };

  return (
    <div className="relative w-full max-w-3xl min-h-[380px] flex flex-col items-center justify-center p-4">
      {/* Background SVG Conduit Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox="0 0 600 360">
        <defs>
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Conduit Connectors */}
        <line x1="140" y1="180" x2="280" y2="180" stroke="url(#cyanGradient)" strokeWidth="2.5" strokeDasharray="4 4" filter="url(#neonGlow)" />
        <line x1="320" y1="180" x2="460" y2="180" stroke="url(#cyanGradient)" strokeWidth="2.5" strokeDasharray="4 4" filter="url(#neonGlow)" />
        <path d="M 300 140 L 300 80" stroke="url(#amberGradient)" strokeWidth="2" strokeDasharray="3 3" filter="url(#neonGlow)" />
        <path d="M 300 220 L 300 280" stroke="url(#cyanGradient)" strokeWidth="2" strokeDasharray="3 3" filter="url(#neonGlow)" />

        {/* Dynamic Animated Flow Packets */}
        {isPlaying && (
          <>
            <motion.circle
              key={`p1-${packetKey}`}
              r="4.5"
              fill="#06b6d4"
              filter="url(#neonGlow)"
              initial={{ cx: 140, cy: 180, opacity: 0 }}
              animate={{ cx: 280, cy: 180, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
            <motion.circle
              key={`p2-${packetKey}`}
              r="4.5"
              fill="#818cf8"
              filter="url(#neonGlow)"
              initial={{ cx: 320, cy: 180, opacity: 0 }}
              animate={{ cx: 460, cy: 180, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, delay: 0.4, ease: "easeInOut" }}
            />
            {stepNumber >= 2 && (
              <motion.circle
                key={`p3-${packetKey}`}
                r="3.5"
                fill="#f59e0b"
                filter="url(#neonGlow)"
                initial={{ cx: 300, cy: 150, opacity: 0 }}
                animate={{ cx: 300, cy: 80, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.9, delay: 0.2, ease: "easeInOut" }}
              />
            )}
          </>
        )}
      </svg>

      {/* Main Node Topology Grid */}
      <div className="relative z-10 w-full grid grid-cols-3 gap-6 items-center text-center">
        
        {/* Node 1: Input / Client Gateway */}
        <div className="flex flex-col items-center space-y-2">
          <motion.div
            animate={{ scale: stepNumber === 1 ? [1, 1.06, 1] : 1 }}
            transition={{ repeat: stepNumber === 1 ? Infinity : 0, duration: 2 }}
            onClick={() => setSelectedNode('Client Gateway: Dispatches high-frequency queries and payload packets.')}
            className={`w-28 h-28 rounded-3xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-300 cursor-pointer ${getNodeHighlightClass('input')}`}
          >
            {isCaching ? <Users size={28} className="text-cyan-400 mb-1" /> : isDataPipeline ? <Globe size={28} className="text-cyan-400 mb-1" /> : <Layers size={28} className="text-cyan-400 mb-1" />}
            <span className="text-xs font-bold text-slate-100">Incoming Input</span>
            <span className="text-[9px] font-mono text-cyan-300/80 uppercase mt-0.5">Stage 1</span>
          </motion.div>
          <span className="text-[10px] font-mono text-slate-400">Payload Ingestion</span>
        </div>

        {/* Node 2: Core Processing / Engine / Cache */}
        <div className="flex flex-col items-center space-y-4">
          {/* Upper Sub-node (e.g. Cache / In-memory state) */}
          <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono flex items-center gap-1.5 transition-all ${getNodeHighlightClass('cache')}`}>
            <Zap size={12} className="text-amber-400" />
            <span>{isCaching ? "Redis Cache (0.1ms)" : "In-Memory Buffer"}</span>
          </div>

          <motion.div
            animate={{ scale: stepNumber === 2 ? [1, 1.06, 1] : 1 }}
            transition={{ repeat: stepNumber === 2 ? Infinity : 0, duration: 2 }}
            onClick={() => setSelectedNode('Orchestration Core: Evaluates algorithmic invariants and distributes workloads.')}
            className={`w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-300 cursor-pointer ${getNodeHighlightClass('core')}`}
          >
            <Cpu size={32} className="text-indigo-400 mb-1" />
            <span className="text-xs font-black text-slate-100">{concept}</span>
            <span className="text-[9px] font-mono text-indigo-300/80 uppercase mt-0.5">Active Engine</span>
          </motion.div>

          {/* Lower Sub-node (e.g. Telemetry / Health check) */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
            <Activity size={12} className="animate-pulse text-emerald-400" />
            <span>Optimal Throughput</span>
          </div>
        </div>

        {/* Node 3: Storage / Target Worker / Output */}
        <div className="flex flex-col items-center space-y-2">
          <motion.div
            animate={{ scale: stepNumber === 3 ? [1, 1.06, 1] : 1 }}
            transition={{ repeat: stepNumber === 3 ? Infinity : 0, duration: 2 }}
            onClick={() => setSelectedNode('Target Execution: Persists state or delivers processed results back to client.')}
            className={`w-28 h-28 rounded-3xl border-2 flex flex-col items-center justify-center p-3 transition-all duration-300 cursor-pointer ${getNodeHighlightClass('output')}`}
          >
            {isCaching ? <Database size={28} className="text-emerald-400 mb-1" /> : isDataPipeline ? <Server size={28} className="text-emerald-400 mb-1" /> : <HardDrive size={28} className="text-emerald-400 mb-1" />}
            <span className="text-xs font-bold text-slate-100">Target Output</span>
            <span className="text-[9px] font-mono text-emerald-300/80 uppercase mt-0.5">Stage 3</span>
          </motion.div>
          <span className="text-[10px] font-mono text-slate-400">Execution / Storage</span>
        </div>

      </div>

      {/* Interactive Tooltip on Node Click */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-6 px-4 py-2 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-xs text-cyan-200 font-mono flex items-center gap-2 shadow-xl backdrop-blur-md"
          >
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>{selectedNode}</span>
            <button onClick={() => setSelectedNode(null)} className="ml-2 text-slate-500 hover:text-white text-xs font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
