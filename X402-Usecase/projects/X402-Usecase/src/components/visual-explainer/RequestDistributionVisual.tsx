import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Cpu, Server, AlertTriangle, ShieldCheck, Activity, ArrowDown, Zap } from 'lucide-react';

interface RequestDistributionVisualProps {
  stepNumber: number;
  isPlaying: boolean;
  highlightNodes?: string[];
  animationMode?: string;
}

export const RequestDistributionVisual: React.FC<RequestDistributionVisualProps> = ({
  stepNumber,
  isPlaying,
  highlightNodes = [],
}) => {
  const [server2Offline, setServer2Offline] = useState(false);
  const [packetKey, setPacketKey] = useState(0);

  // Packet animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPacketKey((prev) => (prev + 1) % 1000);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="relative w-full max-w-3xl flex flex-col items-center">
      {/* Interactive Control Pill */}
      <div className="absolute top-0 right-0 z-20">
        <button
          onClick={() => setServer2Offline(!server2Offline)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
            server2Offline
              ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 hover:bg-rose-900/80'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-amber-500/50 hover:text-amber-300'
          }`}
          title="Click to simulate a server going down"
        >
          {server2Offline ? (
            <>
              <AlertTriangle size={13} className="text-rose-400 animate-pulse" />
              <span>Server 2: DOWN (Rerouting)</span>
            </>
          ) : (
            <>
              <Zap size={13} className="text-amber-400" />
              <span>Break Server 2</span>
            </>
          )}
        </button>
      </div>

      {/* SVG Circuit / Conduit Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox="0 0 600 420">
        <defs>
          <linearGradient id="cyanLine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="orangeLine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Users to Balancer Trunk */}
        <line
          x1="300"
          y1="85"
          x2="300"
          y2="160"
          stroke="url(#cyanLine)"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          filter="url(#glow)"
        />

        {/* Balancer to Server 1 (Left) */}
        <path
          d="M 300 220 L 140 310"
          stroke="url(#cyanLine)"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          filter="url(#glow)"
        />

        {/* Balancer to Server 2 (Center) */}
        <path
          d="M 300 220 L 300 310"
          stroke={server2Offline ? "url(#orangeLine)" : "url(#cyanLine)"}
          strokeWidth="2.5"
          strokeDasharray={server2Offline ? "2 6" : "4 4"}
          filter="url(#glow)"
          opacity={server2Offline ? 0.3 : 1}
        />

        {/* Balancer to Server 3 (Right) */}
        <path
          d="M 300 220 L 460 310"
          stroke="url(#cyanLine)"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          filter="url(#glow)"
        />
      </svg>

      {/* ── NODE 1: USERS (TOP) ── */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center mb-12"
      >
        <div className="relative px-6 py-3 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0c1427] border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">Client Layer</div>
            <div className="text-sm font-black text-white">Global Users (Requests)</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse ml-2" />
        </div>

        {/* Moving Packets: Users -> Load Balancer */}
        {isPlaying && (
          <motion.div
            key={`trunk-${packetKey}`}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 65, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute top-12 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9] flex items-center justify-center text-[8px] font-bold text-slate-900 z-30"
          >
            GET
          </motion.div>
        )}
      </motion.div>

      {/* ── NODE 2: LOAD BALANCER (CENTER) ── */}
      <motion.div
        animate={{
          scale: stepNumber >= 2 ? [1, 1.03, 1] : 1,
          borderColor: stepNumber >= 2 ? '#06b6d4' : '#1e293b'
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative z-10 flex flex-col items-center mb-16"
      >
        <div className="relative px-8 py-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0e172e] border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.4)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <Cpu size={26} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400">Layer 7 Reverse Proxy</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
                Round-Robin
              </span>
            </div>
            <div className="text-base font-black text-white tracking-tight">Load Balancer (NGINX / HAProxy)</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Health Checking: <span className="text-emerald-400 font-semibold">{server2Offline ? '2/3 Healthy' : '3/3 Healthy'}</span>
            </div>
          </div>
        </div>

        {/* Animated Packets leaving Load Balancer towards Servers */}
        {isPlaying && stepNumber >= 2 && (
          <>
            {/* Packet to Server 1 */}
            <motion.div
              key={`s1-${packetKey}`}
              initial={{ x: 0, y: 10, opacity: 0 }}
              animate={{ x: -160, y: 90, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
              className="absolute top-16 left-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-30"
            />

            {/* Packet to Server 2 (or rerouted to Server 3 if S2 is down) */}
            {!server2Offline ? (
              <motion.div
                key={`s2-${packetKey}`}
                initial={{ x: 0, y: 10, opacity: 0 }}
                animate={{ x: 0, y: 90, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
                className="absolute top-16 left-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-30"
              />
            ) : (
              <motion.div
                key={`reroute-${packetKey}`}
                initial={{ x: 0, y: 10, opacity: 0 }}
                animate={{ x: 160, y: 90, opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
                className="absolute top-16 left-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24] z-30"
              />
            )}

            {/* Packet to Server 3 */}
            <motion.div
              key={`s3-${packetKey}`}
              initial={{ x: 0, y: 10, opacity: 0 }}
              animate={{ x: 160, y: 90, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.6 }}
              className="absolute top-16 left-1/2 w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-30"
            />
          </>
        )}
      </motion.div>

      {/* ── NODES 3,4,5: SERVER BAYS (BOTTOM 3 NODES) ── */}
      <div className="relative z-10 w-full grid grid-cols-3 gap-4 md:gap-8">
        {/* Server 1 */}
        <motion.div
          animate={{
            borderColor: stepNumber >= 3 ? '#06b6d4' : '#1e293b',
            boxShadow: stepNumber >= 3 ? '0 0 20px rgba(6,182,212,0.25)' : 'none'
          }}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0b1220] border-2 border-slate-800 flex flex-col items-center text-center transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
            <Server size={18} />
          </div>
          <div className="text-xs font-black text-white">Server 1</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">33% Load</div>
          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Healthy (200 OK)</span>
          </div>
        </motion.div>

        {/* Server 2 (Simulated Failover Node) */}
        <motion.div
          animate={{
            borderColor: server2Offline ? '#f43f5e' : stepNumber >= 3 ? '#06b6d4' : '#1e293b',
            boxShadow: server2Offline
              ? '0 0 25px rgba(244,63,94,0.35)'
              : stepNumber >= 3
              ? '0 0 20px rgba(6,182,212,0.25)'
              : 'none'
          }}
          className={`p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0b1220] border-2 flex flex-col items-center text-center transition-all ${
            server2Offline ? 'border-rose-500/80 bg-rose-950/20' : 'border-slate-800'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-2 ${
              server2Offline
                ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {server2Offline ? <AlertTriangle size={18} /> : <Server size={18} />}
          </div>
          <div className="text-xs font-black text-white">Server 2</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {server2Offline ? '0% (Isolated)' : '33% Load'}
          </div>
          <div
            className={`mt-2 flex items-center gap-1.5 text-[9px] font-mono ${
              server2Offline ? 'text-rose-400 font-bold' : 'text-emerald-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                server2Offline ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span>{server2Offline ? '503 Out of Service' : 'Healthy (200 OK)'}</span>
          </div>
        </motion.div>

        {/* Server 3 */}
        <motion.div
          animate={{
            borderColor: stepNumber >= 3 ? '#06b6d4' : '#1e293b',
            boxShadow: stepNumber >= 3 ? '0 0 20px rgba(6,182,212,0.25)' : 'none'
          }}
          className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0b1220] border-2 border-slate-800 flex flex-col items-center text-center transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
            <Server size={18} />
          </div>
          <div className="text-xs font-black text-white">Server 3</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {server2Offline ? '50% Load (Handling Extra)' : '34% Load'}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Healthy (200 OK)</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
