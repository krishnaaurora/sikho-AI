import React from 'react';
import {
  BookOpen, CheckCircle2, AlertOctagon, Scale, ShieldCheck,
  Building2, Zap, ArrowRight, Layers, Sparkles
} from 'lucide-react';
import type { ConceptExplanationConfig } from './types';

interface ConceptExplanationProps {
  conceptTitle: string;
  explanation?: ConceptExplanationConfig;
  onExploreQuiz?: () => void;
  onExploreSimulation?: () => void;
}

export const ConceptExplanation: React.FC<ConceptExplanationProps> = ({
  conceptTitle,
  explanation,
  onExploreQuiz,
  onExploreSimulation
}) => {
  // Rich fallback explanation defaults tailored for systems architecture
  const data: ConceptExplanationConfig = explanation || {
    title: `In-Depth Architecture Breakdown: ${conceptTitle}`,
    tagline: 'How modern distributed systems eliminate single points of failure and scale horizontally',
    overview: `${conceptTitle} serves as the traffic conductor of modern cloud systems. By sitting between incoming client requests and backend server clusters, it prevents catastrophic server overload, routes around degraded hardware, and guarantees uninterrupted 99.99% availability.`,
    problemSolved: 'Without this mechanism, all client traffic floods a single server. A sudden spike crashes the CPU, causing total outage, lost user transactions, and unrecoverable downtime. With horizontal distribution, traffic is dynamically spread across healthy application workers.',
    architectureBreakdown: [
      {
        component: 'Frontend / Client Ingress',
        role: 'Client Handshake & Security',
        details: 'Terminates TLS/SSL connections, validates initial request headers, and buffers network slow-loris attacks before they reach internal application nodes.',
      },
      {
        component: 'Central Load Balancer / Gateway',
        role: 'Traffic Routing & Health Checks',
        details: 'Executes continuous health pings (e.g., GET /health every 5s). Automatically isolates degraded or crashed servers within milliseconds so no client receives a 500 error.',
      },
      {
        component: 'Backend Server Pool',
        role: 'Stateless Application Execution',
        details: 'Homogeneous worker nodes executing business logic. Because nodes are stateless, instances can auto-scale from 2 to 200 nodes during traffic surges.',
      },
      {
        component: 'Shared Cache & Persistent Database',
        role: 'Centralized State Management',
        details: 'Redis and distributed SQL/NoSQL databases manage user sessions and persistence, allowing any backend worker to service any user request idempotently.',
      },
    ],
    tradeoffs: [
      {
        factor: 'Layer 4 (Transport) vs Layer 7 (Application)',
        pro: 'Layer 4 operates on raw TCP/IP packets at extreme wire-speed with minimal CPU overhead.',
        con: 'Layer 7 inspects HTTP paths and cookies for smart microservice routing, but requires SSL termination and higher CPU usage.',
      },
      {
        factor: 'Round Robin vs Least Connections',
        pro: 'Round Robin is simple, predictable, and requires zero state tracking.',
        con: 'Least Connections is vastly superior when requests have varying execution times (e.g. video rendering vs simple JSON read).',
      },
      {
        factor: 'Sticky Sessions vs Stateless Tokens (JWT)',
        pro: 'Sticky sessions route a user to the exact same server where in-memory session data resides.',
        con: 'If that specific server crashes, the user is logged out. Modern architectures strictly favor stateless JWT tokens and external Redis caches.',
      },
    ],
    productionCaseStudy: {
      company: 'Netflix & AWS Production Fleet',
      scenario: 'Handling 300+ million concurrent video streaming requests during peak worldwide releases.',
      impact: 'Using dynamic routing proxies (Zuul / Envoy) combined with AWS Application Load Balancers, Netflix reroutes traffic across regions in under 60 seconds with zero customer interruption.',
    },
    failureModes: [
      'Thundering Herd on Health Check: If health check intervals are too aggressive, thousands of health pings overwhelm an already struggling server.',
      'Cascading Failure: If Server 1 dies, its traffic dumps onto Server 2 and 3. Without circuit breakers, Server 2 crashes next, followed immediately by Server 3.',
      'Stale DNS Caching: Client-side DNS resolvers caching expired IP addresses can bypass the load balancer and hit decommissioned instances.',
    ],
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
      {/* HEADER HERO */}
      <div className="space-y-2 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <BookOpen size={20} />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
            Concept Deep-Dive
          </span>
        </div>

        <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {data.title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium">
          {data.tagline}
        </p>
      </div>

      {/* OVERVIEW & PROBLEM STATEMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
            <Zap size={15} className="text-indigo-600" />
            <span>How It Works In Plain English</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {data.overview}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon size={15} className="text-amber-600" />
            <span>The Core Problem It Eliminates</span>
          </div>
          <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
            {data.problemSolved}
          </p>
        </div>
      </div>

      {/* ARCHITECTURAL COMPONENT BREAKDOWN */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            Architectural Tier Breakdown
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Every layer in the distributed pipeline has a dedicated, isolated responsibility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.architectureBreakdown.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-200 hover:shadow-xs transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Tier {idx + 1}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">
                  {item.role}
                </span>
              </div>
              <h5 className="text-xs font-black text-slate-900">{item.component}</h5>
              <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KEY TRADE-OFFS & DECISION MATRIX */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Scale size={16} className="text-indigo-600" />
            Engineering Trade-Offs & Decision Matrix
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Senior software engineers balance these trade-offs when architecting high-scale infrastructure.
          </p>
        </div>

        <div className="space-y-3">
          {data.tradeoffs.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 items-start"
            >
              <div className="text-xs font-black text-slate-900 md:col-span-1">
                {t.factor}
              </div>
              <div className="text-xs text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60 md:col-span-1">
                <strong className="block text-emerald-950 font-bold mb-0.5">Advantage:</strong>
                {t.pro}
              </div>
              <div className="text-xs text-rose-800 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200/60 md:col-span-1">
                <strong className="block text-rose-950 font-bold mb-0.5">Trade-off / Cost:</strong>
                {t.con}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REAL-WORLD PRODUCTION CASE STUDY */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 shadow-md">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Building2 size={16} />
          <span>Real-World Production Case Study</span>
        </div>
        <h4 className="text-base font-black text-white">{data.productionCaseStudy.company}</h4>
        <p className="text-xs text-indigo-100 leading-relaxed font-medium">
          <strong>Scenario: </strong>{data.productionCaseStudy.scenario}
        </p>
        <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-indigo-200">
          <strong className="text-white">Business Impact: </strong>
          {data.productionCaseStudy.impact}
        </div>
      </div>

      {/* KNOWN FAILURE MODES & EDGE CASES */}
      <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3">
        <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
          <AlertOctagon size={16} className="text-rose-600" />
          <span>Critical Failure Modes to Defend Against</span>
        </div>
        <ul className="space-y-2 text-xs text-rose-950">
          {data.failureModes.map((fm, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <span>{fm}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* BOTTOM ACTION CTA */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium">
          Ready to verify your mastery? Test your understanding with the interactive quiz.
        </span>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onExploreSimulation && (
            <button
              type="button"
              onClick={onExploreSimulation}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap size={14} /> Open Live Simulator
            </button>
          )}

          {onExploreQuiz && (
            <button
              type="button"
              onClick={onExploreQuiz}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              Take Concept Quiz <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
