import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Send, Server, Globe, Shield, Database,
  Cpu, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft,
  Activity, ArrowRight, Layers, Eye, RefreshCw, Zap
} from 'lucide-react';
import type { FlowStepNode, ArchitectureSimulationConfig } from './types';

interface InteractiveArchitectureSimulatorProps {
  steps: FlowStepNode[];
  conceptTitle: string;
  config?: ArchitectureSimulationConfig;
}

interface ServerNodeState {
  id: string;
  name: string;
  port: number;
  isHealthy: boolean;
  requestsHandled: number;
  currentLoad: number; // percentage
}

export const InteractiveArchitectureSimulator: React.FC<InteractiveArchitectureSimulatorProps> = ({
  steps,
  conceptTitle,
  config
}) => {
  // View mode: interactive live nodes vs 3D architecture isometric visual
  const [viewMode, setViewMode] = useState<'interactive' | 'isometric'>('interactive');

  // Architecture Simulation Server State
  const defaultServers: ServerNodeState[] = [
    { id: 'srv-1', name: 'Backend App Instance A', port: 8081, isHealthy: true, requestsHandled: 12, currentLoad: 35 },
    { id: 'srv-2', name: 'Backend App Instance B', port: 8082, isHealthy: true, requestsHandled: 14, currentLoad: 42 },
    { id: 'srv-3', name: 'Backend App Instance C', port: 8083, isHealthy: true, requestsHandled: 11, currentLoad: 30 },
  ];

  const [servers, setServers] = useState<ServerNodeState[]>(defaultServers);
  const [algorithm, setAlgorithm] = useState<'Round Robin' | 'Least Connections' | 'IP Hash'>('Round Robin');
  const [roundRobinPtr, setRoundRobinPtr] = useState(0);

  // Packet animation state
  const [isPacketInFlight, setIsPacketInFlight] = useState(false);
  const [packetTargetServerId, setPacketTargetServerId] = useState<string | null>(null);
  const [packetStage, setPacketStage] = useState<'idle' | 'client' | 'gateway' | 'server' | 'database' | 'response'>('idle');
  const [lastLog, setLastLog] = useState<string>('System initialized. Ready to route client requests.');

  // Live Auto-Traffic generator
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [totalRequests, setTotalRequests] = useState(37);
  const [failoverCount, setFailoverCount] = useState(0);

  // Flow Stepper State (Execution Flow)
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoStepping, setIsAutoStepping] = useState(false);

  // Fallback steps if empty
  const activeSteps = steps && steps.length > 0 ? steps : [
    { step: 1, title: 'Client Ingress', description: 'Browser/Client issues HTTP/TCP request to public IP.', nodeType: 'client' as const, highlight: 'Ingress Handshake' },
    { step: 2, title: 'Gateway & Load Balancing', description: 'Inspects health checks and selects target backend instance.', nodeType: 'gateway' as const, highlight: 'Algorithm Routing' },
    { step: 3, title: 'Backend Worker Processing', description: 'Healthy server executes business logic and prepares payload.', nodeType: 'worker' as const, highlight: 'Compute Execution' },
    { step: 4, title: 'Database & Client Response', description: 'State committed to cache/database, 200 OK returned to client.', nodeType: 'database' as const, highlight: '200 OK Response' },
  ];

  // Auto-Step Timer
  useEffect(() => {
    if (!isAutoStepping) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % activeSteps.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isAutoStepping, activeSteps.length]);

  // Auto-traffic simulation loop
  useEffect(() => {
    if (!isAutoSimulating) return;
    const interval = setInterval(() => {
      triggerRequest();
    }, 1600);
    return () => clearInterval(interval);
  }, [isAutoSimulating, servers, algorithm, roundRobinPtr]);

  // Dispatch single request packet through architecture
  const triggerRequest = () => {
    if (isPacketInFlight) return;

    // Filter healthy servers
    const healthyServers = servers.filter((s) => s.isHealthy);
    if (healthyServers.length === 0) {
      setLastLog('⚠️ 503 Service Unavailable: All backend servers are down! Health checks failed.');
      return;
    }

    // Determine target based on algorithm
    let selectedServer: ServerNodeState;
    let didFailover = false;

    if (algorithm === 'Least Connections') {
      // Pick server with least load
      selectedServer = [...healthyServers].sort((a, b) => a.currentLoad - b.currentLoad)[0];
    } else if (algorithm === 'IP Hash') {
      // Deterministic hash mod
      const hash = Math.floor(Math.random() * 100);
      selectedServer = healthyServers[hash % healthyServers.length];
    } else {
      // Round Robin across all servers, checking health
      const nextIdx = roundRobinPtr % servers.length;
      setRoundRobinPtr((prev) => (prev + 1) % servers.length);

      const candidate = servers[nextIdx];
      if (candidate.isHealthy) {
        selectedServer = candidate;
      } else {
        // Failover triggered!
        selectedServer = healthyServers[0];
        didFailover = true;
        setFailoverCount((c) => c + 1);
      }
    }

    setIsPacketInFlight(true);
    setPacketTargetServerId(selectedServer.id);
    setTotalRequests((t) => t + 1);

    // Animation timeline sequence:
    // 1. Client -> Gateway
    setPacketStage('client');
    setLastLog(`[Client] Dispatched request -> Routing via ${algorithm}`);

    setTimeout(() => {
      setPacketStage('gateway');
      if (didFailover) {
        setLastLog(`⚡ Failover active! Original target is down, load balancer rerouted to ${selectedServer.name}`);
      } else {
        setLastLog(`[Load Balancer] Health check OK. Forwarding traffic to ${selectedServer.name} (Port ${selectedServer.port})`);
      }

      setTimeout(() => {
        setPacketStage('server');
        // Update server stats
        setServers((prev) =>
          prev.map((s) =>
            s.id === selectedServer.id
              ? {
                  ...s,
                  requestsHandled: s.requestsHandled + 1,
                  currentLoad: Math.min(95, s.currentLoad + 5),
                }
              : { ...s, currentLoad: Math.max(15, s.currentLoad - 2) }
          )
        );
        setLastLog(`[${selectedServer.name}] Processing request payload at port :${selectedServer.port}...`);

        setTimeout(() => {
          setPacketStage('database');
          setLastLog('[Database/Cache] Cache hit / query state committed.');

          setTimeout(() => {
            setPacketStage('response');
            setLastLog(`[Client] Received HTTP 200 OK from ${selectedServer.name} in 16ms.`);

            setTimeout(() => {
              setIsPacketInFlight(false);
              setPacketStage('idle');
              setPacketTargetServerId(null);
            }, 600);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  };

  // Toggle server health state
  const toggleServerHealth = (serverId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id === serverId) {
          const newStatus = !s.isHealthy;
          setLastLog(
            newStatus
              ? `🟢 ${s.name} recovered and marked HEALTHY. Added back to pool.`
              : `🔴 ${s.name} CRASHED! Health check failed. Load balancer will bypass this node.`
          );
          return {
            ...s,
            isHealthy: newStatus,
            currentLoad: newStatus ? 30 : 0,
          };
        }
        return s;
      })
    );
  };

  const currentStep = activeSteps[activeStep];
  const healthyCount = servers.filter((s) => s.isHealthy).length;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Zap size={18} />
            </span>
            <h4 className="text-base font-black text-slate-900">
              Interactive Architecture & Live Simulation
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate real-world traffic, test failovers, switch algorithms, and trace step-by-step execution.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'interactive'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={13} /> Interactive Simulator
            </button>
            <button
              type="button"
              onClick={() => setViewMode('isometric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'isometric'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye size={13} /> 3D Architecture Diagram
            </button>
          </div>
        </div>
      </div>

      {/* ISOMETRIC 3D DIAGRAM VIEW */}
      {viewMode === 'isometric' ? (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 group">
            <img
              src="/architecture_diagram.jpg"
              alt={`${conceptTitle} 3D Architecture`}
              className="w-full h-auto max-h-[500px] object-cover rounded-2xl"
              onError={(e) => {
                // Graceful fallback if image isn't loaded yet
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                  3D Isometric System Architecture
                </span>
                <h5 className="text-sm font-black text-white">
                  Frontend Ingress → Load Balancing Gateway → Multi-Instance Backend Racks
                </h5>
                <p className="text-xs text-slate-300 mt-0.5">
                  High-availability distributed cluster with automated health checks, routing, and database synchronization.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-sm shrink-0 flex items-center gap-1.5"
              >
                <Zap size={13} /> Switch to Live Testbed
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE SIMULATION TESTBED */
        <div className="space-y-6">
          {/* SIMULATION ACTION BAR */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isPacketInFlight || healthyCount === 0}
                onClick={triggerRequest}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Send size={13} /> Send Request Packet
              </button>

              <button
                type="button"
                onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isAutoSimulating
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {isAutoSimulating ? <Pause size={13} /> : <Play size={13} />}
                {isAutoSimulating ? 'Stop Auto-Traffic' : 'Auto-Traffic Stream'}
              </button>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-500 font-semibold">Algorithm:</span>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="bg-transparent font-bold text-indigo-600 focus:outline-none cursor-pointer"
                >
                  <option value="Round Robin">Round Robin</option>
                  <option value="Least Connections">Least Connections</option>
                  <option value="IP Hash">IP Hash</option>
                </select>
              </div>
            </div>

            {/* Live Stats counters */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Total Requests:</span>
                <span className="font-mono font-bold text-slate-800">{totalRequests}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Healthy Nodes:</span>
                <span className={`font-mono font-bold ${healthyCount === 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {healthyCount}/3
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Failovers:</span>
                <span className="font-mono font-bold text-indigo-600">{failoverCount}</span>
              </div>
            </div>
          </div>

          {/* INTERACTIVE DIAGRAM CANVAS */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-inner overflow-hidden">
            {/* Background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* TIER 1: FRONTEND CLIENT */}
              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    packetStage === 'client' || packetStage === 'response'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-105 ring-4 ring-blue-400/30'
                      : 'bg-slate-800 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  <Globe size={26} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Frontend Tier</span>
                  <h5 className="text-xs font-black text-white">Client Ingress</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Browser & Mobile Clients</p>
                </div>
                <div className="px-2 py-0.5 bg-blue-950/60 border border-blue-800/60 rounded-full text-[10px] text-blue-300 font-mono">
                  port: 443 (HTTPS)
                </div>
              </div>

              {/* TIER 2: LOAD BALANCER / GATEWAY */}
              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 backdrop-blur-sm relative">
                {packetStage === 'gateway' && (
                  <span className="absolute -top-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-extrabold uppercase rounded-full animate-bounce">
                    Inspecting Health & Dispatching
                  </span>
                )}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    packetStage === 'gateway'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 scale-105 ring-4 ring-indigo-400/30'
                      : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                  }`}
                >
                  <Shield size={26} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Gateway Tier</span>
                  <h5 className="text-xs font-black text-white">Load Balancer</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Active Strategy: {algorithm}</p>
                </div>
                <div className="px-2 py-0.5 bg-indigo-900/60 border border-indigo-700/60 rounded-full text-[10px] text-indigo-200 font-mono">
                  HA Proxy / NGINX / ALB
                </div>
              </div>

              {/* TIER 3: BACKEND APP SERVERS */}
              <div className="space-y-3">
                <div className="text-center pb-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Compute Tier</span>
                  <h5 className="text-xs font-black text-white">Backend Server Pool</h5>
                </div>

                <div className="space-y-2">
                  {servers.map((srv) => {
                    const isTargeted = packetTargetServerId === srv.id && packetStage === 'server';

                    return (
                      <div
                        key={srv.id}
                        onClick={() => toggleServerHealth(srv.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                          !srv.isHealthy
                            ? 'bg-rose-950/40 border-rose-800/80 opacity-70 hover:opacity-100'
                            : isTargeted
                            ? 'bg-purple-900/60 border-purple-400 shadow-md shadow-purple-500/40 scale-[1.02]'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        }`}
                        title="Click to toggle server healthy / down"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Server
                              size={14}
                              className={
                                !srv.isHealthy
                                  ? 'text-rose-400'
                                  : isTargeted
                                  ? 'text-purple-300 animate-pulse'
                                  : 'text-purple-400'
                              }
                            />
                            <div>
                              <div className="text-[11px] font-bold text-white flex items-center gap-1">
                                {srv.name}
                                <span className="text-[9px] font-mono text-slate-400">:{srv.port}</span>
                              </div>
                              <span className="text-[9px] text-slate-400">
                                {srv.requestsHandled} reqs • {srv.currentLoad}% load
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                srv.isHealthy
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                              }`}
                            >
                              {srv.isHealthy ? 'Healthy' : 'Crashed'}
                            </span>
                          </div>
                        </div>

                        {/* Load bar */}
                        {srv.isHealthy && (
                          <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 transition-all duration-300"
                              style={{ width: `${srv.currentLoad}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[9px] text-center text-slate-400 italic">
                  💡 Tip: Click any server to toggle crash / recovery simulation
                </p>
              </div>

              {/* TIER 4: DATABASE & CACHE */}
              <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 backdrop-blur-sm">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    packetStage === 'database'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105 ring-4 ring-emerald-400/30'
                      : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <Database size={26} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Storage Tier</span>
                  <h5 className="text-xs font-black text-white">Database & Redis</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shared State & Replicas</p>
                </div>
                <div className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-[10px] text-emerald-300 font-mono">
                  Primary + Read Replica
                </div>
              </div>
            </div>

            {/* LIVE EVENT LOG TERMINAL */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-mono text-[11px] truncate text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-indigo-400 font-bold shrink-0">[Live Telemetry]</span>
                <span className="truncate">{lastLog}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setServers(defaultServers);
                  setTotalRequests(0);
                  setFailoverCount(0);
                  setLastLog('Simulation reset to baseline state.');
                }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                title="Reset simulation counters"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* STEP-BY-STEP EXECUTION FLOW SECTION */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-black text-slate-900">
                  {conceptTitle} Step-by-Step Execution Lifecycle
                </h5>
                <p className="text-xs text-slate-500">
                  Step {activeStep + 1} of {activeSteps.length} — Deep dive into each component's responsibility
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoStepping(!isAutoStepping)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAutoStepping
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {isAutoStepping ? <Pause size={12} /> : <Play size={12} />}
                  {isAutoStepping ? 'Pause Auto-Step' : 'Auto-Step'}
                </button>
              </div>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {activeSteps.map((st, idx) => {
                const isSelected = idx === activeStep;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsAutoStepping(false);
                      setActiveStep(idx);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        STAGE {idx + 1}
                      </span>
                      {idx < activeStep && <CheckCircle2 size={13} className={isSelected ? 'text-white' : 'text-indigo-600'} />}
                    </div>
                    <div className="text-xs font-black truncate">{st.title}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                      {activeStep + 1}
                    </span>
                    <h4 className="text-sm font-black text-indigo-950">{currentStep.title}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-indigo-700 border border-indigo-200 text-xs font-mono font-bold shadow-xs">
                    {currentStep.highlight}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {currentStep.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={activeStep === 0}
                onClick={() => {
                  setIsAutoStepping(false);
                  setActiveStep((p) => Math.max(0, p - 1));
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={13} /> Previous Stage
              </button>

              <button
                type="button"
                disabled={activeStep === activeSteps.length - 1}
                onClick={() => {
                  setIsAutoStepping(false);
                  setActiveStep((p) => Math.min(activeSteps.length - 1, p + 1));
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
              >
                Next Stage <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
