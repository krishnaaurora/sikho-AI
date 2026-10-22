import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Sliders, Layers, BarChart3, HelpCircle,
  Code2, MessageSquare, Maximize2, Minimize2, Copy, Check,
  BookOpen, Brain, Zap, CheckCircle2, RefreshCw, X, Eye
} from 'lucide-react';
import { DynamicConceptChart } from './DynamicConceptChart';
import { InteractiveArchitectureSimulator } from './InteractiveArchitectureSimulator';
import { ConceptExplanation } from './ConceptExplanation';
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
  const [activeTab, setActiveTab] = useState<'simulation' | 'chart' | 'explanation' | 'quiz' | 'code' | 'copilot'>('simulation');
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
            summary: `Interactive architectural model and live traffic simulation for ${conceptName}.`,
            mentalModel: {
              analogy: `Think of ${conceptName} like an airport air traffic control tower directing incoming flights to open runways, preventing collisions and runway congestion.`,
              whyItMatters: `Without ${conceptName}, all traffic overwhelms a single node, causing catastrophic crashes during peak hours.`,
              keyTakeaway: 'Decouple client ingress from backend compute; always design for dynamic failover.',
            },
            explanation: {
              title: `In-Depth Architecture Breakdown: ${conceptName}`,
              tagline: 'How modern distributed systems eliminate single points of failure and scale horizontally',
              overview: `${conceptName} orchestrates traffic across distributed compute nodes. By continuously performing health evaluations and managing routing algorithms, it ensures zero-downtime operation under intense concurrent load.`,
              problemSolved: 'Eliminates single points of failure, throttles rogue traffic bursts, and seamlessly redistributes load away from degraded or crashed application servers.',
              architectureBreakdown: [
                {
                  component: 'Client / Ingress Layer',
                  role: 'HTTPS Termination & Handshake',
                  details: 'Validates transport protocol, terminates TLS encryption, and forwards requests to internal mesh network.',
                },
                {
                  component: 'Load Balancer / Gateway',
                  role: 'Routing & Health Inspection',
                  details: 'Executes active heartbeat checks and selects the optimal backend worker instance via Round Robin or Least Connections.',
                },
                {
                  component: 'Backend Server Cluster',
                  role: 'Application Logic Execution',
                  details: 'Multiple stateless instances running application code. Nodes can scale horizontally or be drained for maintenance without downtime.',
                },
                {
                  component: 'Database & Redis Cluster',
                  role: 'Centralized State Persistence',
                  details: 'Shared persistent storage and cache layer keeping backend workers stateless and resilient.',
                },
              ],
              tradeoffs: [
                {
                  factor: 'Round Robin vs Least Connections',
                  pro: 'Round Robin requires no state tracking and provides deterministic rotation.',
                  con: 'Least Connections prevents queue pileups when request processing durations are uneven.',
                },
                {
                  factor: 'Layer 4 (Transport) vs Layer 7 (Application)',
                  pro: 'Layer 4 routes millions of packets per second with ultra-low latency.',
                  con: 'Layer 7 inspects HTTP headers, cookies, and paths for fine-grained microservice routing at the cost of higher CPU.',
                },
                {
                  factor: 'Stateless JWT vs Sticky Sessions',
                  pro: 'Stateless architecture allows any server to fail without logging out users.',
                  con: 'Sticky sessions reduce cache misses but create traffic hotspots if a single user executes heavy tasks.',
                },
              ],
              productionCaseStudy: {
                company: 'Netflix & AWS Production Infrastructure',
                scenario: 'Directing over 300 million concurrent global streaming requests during peak releases.',
                impact: 'Using dynamic routing proxies and Application Load Balancers, traffic reroutes in sub-seconds during regional cloud outages with zero downtime.',
              },
              failureModes: [
                'Thundering Herd on Health Check: Overly frequent polling knocks down recovering servers.',
                'Cascading Failures: When one server crashes, remaining servers inherit 100% of the load and crash sequentially.',
                'Stale DNS Caching: Clients bypassing load balancer IP directly hitting dead nodes.',
              ],
            },
            architectureSim: {
              title: `${conceptName} Architecture Simulation`,
              description: 'Frontend Ingress → Load Balancing Gateway → Backend Server Cluster',
              diagramImage: '/architecture_diagram.jpg',
              frontendTitle: 'Client Ingress',
              gatewayTitle: 'Central Load Balancer',
              algorithms: ['Round Robin', 'Least Connections', 'IP Hash'],
              servers: [
                { id: 'srv-1', name: 'Backend Instance A', port: 8081, initialHealthy: true },
                { id: 'srv-2', name: 'Backend Instance B', port: 8082, initialHealthy: true },
                { id: 'srv-3', name: 'Backend Instance C', port: 8083, initialHealthy: true },
              ],
              databaseTitle: 'Primary DB & Redis Cache',
            },
            chart: {
              title: `Latency (ms) vs Number of Scaled Nodes: ${conceptName}`,
              description: 'Visualizing p99 tail latency reduction as node count increases under constant concurrent load.',
              type: 'area',
              xAxisKey: 'name',
              data: [
                { name: '1 Node', value: 480, benchmark: 50, secondary: 98 },
                { name: '2 Nodes', value: 240, benchmark: 50, secondary: 75 },
                { name: '4 Nodes', value: 72, benchmark: 50, secondary: 38 },
                { name: '6 Nodes', value: 36, benchmark: 50, secondary: 22 },
                { name: '8 Nodes', value: 24, benchmark: 50, secondary: 15 },
                { name: '12 Nodes', value: 18, benchmark: 50, secondary: 12 },
              ],
            },
            flowSteps: [
              { step: 1, title: 'Client Ingress', description: 'User browser or mobile app dispatches HTTPS request to public gateway.', nodeType: 'client', highlight: 'TLS Handshake' },
              { step: 2, title: 'Load Balancing & Health Check', description: 'Gateway verifies server health and picks target instance via selected algorithm.', nodeType: 'gateway', highlight: 'Algorithm Routing' },
              { step: 3, title: 'Backend Worker Processing', description: 'Selected healthy server instance executes business logic.', nodeType: 'worker', highlight: 'Compute Execution' },
              { step: 4, title: 'Storage & Response', description: 'State committed to cache/database, 200 OK returned to client.', nodeType: 'database', highlight: '200 OK Emitted' },
            ],
            codeSnippet: {
              language: 'typescript',
              title: `Production Load Balancer Router: ${conceptName}`,
              code: `export class LoadBalancerRouter {\n  private servers = [\n    { id: "s1", url: "http://10.0.0.1:8081", healthy: true, activeConns: 3 },\n    { id: "s2", url: "http://10.0.0.2:8082", healthy: true, activeConns: 1 },\n    { id: "s3", url: "http://10.0.0.3:8083", healthy: true, activeConns: 2 }\n  ];\n  private index = 0;\n\n  // Round Robin with automated health failover\n  public getNextServer(): string {\n    const healthy = this.servers.filter(s => s.healthy);\n    if (healthy.length === 0) throw new Error("503 Service Unavailable: All nodes down");\n    const server = healthy[this.index % healthy.length];\n    this.index = (this.index + 1) % healthy.length;\n    return server.url;\n  }\n}`,
              explanation: 'TypeScript implementation of a production-grade round-robin load balancer router with active health check filtering.',
            },
            quiz: {
              question: `In a high-scale production setup with a load balancer, what is the best strategy if one of three backend servers suddenly crashes?`,
              options: [
                'Immediately shut down all remaining servers',
                'Load balancer marks the node unhealthy via health checks and automatically routes 100% of subsequent traffic to the surviving healthy servers',
                'Force all users to refresh their browsers manually',
                'Wait 24 hours before redirecting network packets',
              ],
              answerIndex: 1,
              explanation: 'Continuous health check pings detect node failures within milliseconds, gracefully removing the dead server from the pool so users experience zero dropped requests.',
              celebrationText: 'Outstanding! You master high-availability cloud architecture.',
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
          <p className="text-xs text-slate-500 mt-1">Generating interactive architecture diagrams, live simulation testbed, and performance metrics for "{conceptName}"</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                <Brain size={15} className="text-indigo-600" />
                <span>Mental Model & Real-World Analogy</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('simulation')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <Eye size={13} /> View Architecture & Simulation
              </button>
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 no-scrollbar">
          {/* COMBINED INTERACTIVE ARCHITECTURE FLOW & LIVE SIMULATOR */}
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'simulation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap size={13} /> Architecture & Live Simulator
          </button>

          {/* PERFORMANCE CHART WITH SIMPLE EXPLANATION */}
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'chart'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={13} /> Performance Chart
          </button>

          {/* DEEP CONCEPT EXPLANATION */}
          <button
            type="button"
            onClick={() => setActiveTab('explanation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'explanation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={13} /> Deep Explanation
          </button>

          {/* QUIZ & CELEBRATION (Matches User Screenshot Style) */}
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                : 'text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <HelpCircle size={14} className="shrink-0" /> Quiz & Celebration
          </button>

          {/* CODE IMPLEMENTATION */}
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

          {/* AI COPILOT */}
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
          {/* COMBINED ARCHITECTURE & SIMULATION */}
          {activeTab === 'simulation' && (
            <InteractiveArchitectureSimulator
              steps={data.flowSteps}
              conceptTitle={data.concept}
              config={data.architectureSim}
            />
          )}

          {/* PERFORMANCE CHART WITH PLAIN-ENGLISH EXPLANATION */}
          {activeTab === 'chart' && (
            <DynamicConceptChart
              config={
                data.chart || {
                  title: `Latency (ms) vs Number of Scaled Nodes: ${data.concept}`,
                  description: 'Visualizing p99 tail latency reduction as node count increases under constant concurrent load.',
                  type: 'area',
                  xAxisKey: 'name',
                  data: [
                    { name: '1 Node', value: 480, benchmark: 50, secondary: 98 },
                    { name: '2 Nodes', value: 240, benchmark: 50, secondary: 75 },
                    { name: '4 Nodes', value: 72, benchmark: 50, secondary: 38 },
                    { name: '6 Nodes', value: 36, benchmark: 50, secondary: 22 },
                    { name: '8 Nodes', value: 24, benchmark: 50, secondary: 15 },
                    { name: '12 Nodes', value: 18, benchmark: 50, secondary: 12 },
                  ],
                }
              }
            />
          )}

          {/* DEEP EXPLANATION TAB */}
          {activeTab === 'explanation' && (
            <ConceptExplanation
              conceptTitle={data.concept}
              explanation={data.explanation}
              onExploreQuiz={() => setActiveTab('quiz')}
              onExploreSimulation={() => setActiveTab('simulation')}
            />
          )}

          {/* QUIZ & CELEBRATION */}
          {activeTab === 'quiz' && data.quiz && (
            <ConceptQuizCelebration
              quiz={data.quiz}
              conceptTitle={data.concept}
            />
          )}

          {/* CODE IMPLEMENTATION */}
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

          {/* AI COPILOT */}
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
