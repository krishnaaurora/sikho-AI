import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, Zap, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { SimulatorConfig } from './types';

interface InteractiveSimulatorProps {
  config: SimulatorConfig;
  onParametersChange?: (params: Record<string, number>) => void;
}

export const InteractiveSimulator: React.FC<InteractiveSimulatorProps> = ({ config, onParametersChange }) => {
  // Initialize parameter state from default values
  const [params, setParams] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    config.parameters.forEach((p) => {
      initial[p.id] = p.defaultValue;
    });
    return initial;
  });

  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    onParametersChange?.(params);
  }, [params, onParametersChange]);

  const handleSliderChange = (id: string, value: number) => {
    setActivePreset(null);
    setParams((prev) => ({ ...prev, [id]: value }));
  };

  const applyPreset = (presetName: string, values: Record<string, number>) => {
    setActivePreset(presetName);
    setParams((prev) => ({ ...prev, ...values }));
  };

  const resetDefaults = () => {
    setActivePreset(null);
    const initial: Record<string, number> = {};
    config.parameters.forEach((p) => {
      initial[p.id] = p.defaultValue;
    });
    setParams(initial);
  };

  // Compute dynamic simulation metrics
  const computeSimulation = () => {
    const keys = Object.keys(params);
    const p1 = params[keys[0]] ?? 100;
    const p2 = params[keys[1]] ?? 10;
    const p3 = params[keys[2]] ?? 50;

    // Smart heuristic calculation
    const throughput = Math.round(p1 * (1 + (p2 / 100)));
    const loadFactor = p1 / Math.max(1, p2 * 10);
    const latencyMs = Math.max(2, Math.round(12 + Math.pow(loadFactor, 1.8) * 45));
    const cpuSaturation = Math.min(100, Math.round(loadFactor * 65));
    const isOverloaded = cpuSaturation > 85;
    const errorRate = isOverloaded ? ((cpuSaturation - 85) * 0.4).toFixed(2) : '0.00';

    return { throughput, latencyMs, cpuSaturation, isOverloaded, errorRate };
  };

  const sim = computeSimulation();

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header & Preset controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sliders size={16} />
            </span>
            <h4 className="text-base font-black text-slate-900">{config.title}</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">{config.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {config.metricPresets?.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.name, preset.values)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activePreset === preset.name
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset.name}
            </button>
          ))}

          <button
            type="button"
            onClick={resetDefaults}
            title="Reset parameters to default"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Grid: Controls on Left, Real-Time Dynamic Meters on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Area (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Adjustable Variables
          </p>

          <div className="space-y-4">
            {config.parameters.map((param) => {
              const val = params[param.id] ?? param.defaultValue;
              const percent = ((val - param.min) / (param.max - param.min)) * 100;

              return (
                <div key={param.id} className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">{param.label}</span>
                    <span className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-lg text-indigo-700 font-mono font-black">
                      {val.toLocaleString()} {param.unit}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={val}
                    onChange={(e) => handleSliderChange(param.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all"
                  />

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{param.min.toLocaleString()} {param.unit}</span>
                    <span>Mid: {Math.round((param.min + param.max) / 2).toLocaleString()}</span>
                    <span>{param.max.toLocaleString()} {param.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formula rationale footer */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
            <Zap size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong className="font-semibold">Formula Relationship: </strong>
              {config.metricsFormula}
            </p>
          </div>
        </div>

        {/* Real-time Dynamic Metrics (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="animate-pulse text-indigo-400" />
              Live System Telemetry
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              sim.isOverloaded ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {sim.isOverloaded ? 'Throttled' : 'Optimal'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Metric 1: Throughput */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed Rate</p>
              <p className="text-xl font-black text-white mt-1">
                {sim.throughput.toLocaleString()}{' '}
                <span className="text-[11px] font-normal text-slate-400">ops/s</span>
              </p>
            </div>

            {/* Metric 2: p99 Latency */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">p99 Latency</p>
              <p className={`text-xl font-black mt-1 ${
                sim.latencyMs > 150 ? 'text-red-400' : sim.latencyMs > 60 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {sim.latencyMs}{' '}
                <span className="text-[11px] font-normal text-slate-400">ms</span>
              </p>
            </div>

            {/* Metric 3: Error Rate */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Error Rate</p>
              <p className={`text-xl font-black mt-1 ${
                parseFloat(sim.errorRate) > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {sim.errorRate}%
              </p>
            </div>

            {/* Metric 4: Health */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stability Index</p>
              <p className="text-xl font-black text-indigo-300 mt-1">
                {Math.max(10, 100 - sim.cpuSaturation)}%
              </p>
            </div>
          </div>

          {/* CPU Saturation Meter */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Resource Saturation</span>
              <span className={sim.cpuSaturation > 80 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                {sim.cpuSaturation}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  sim.cpuSaturation > 85 ? 'bg-red-500' : sim.cpuSaturation > 65 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${sim.cpuSaturation}%` }}
              />
            </div>
          </div>

          {/* Status insight banner */}
          <div className="pt-2 text-xs text-slate-300 flex items-center gap-2">
            {sim.isOverloaded ? (
              <span className="text-red-400 flex items-center gap-1.5 font-bold">
                <AlertTriangle size={14} /> System queuing: increase capacity or reduce load.
              </span>
            ) : (
              <span className="text-emerald-300 flex items-center gap-1.5 font-medium">
                <ShieldCheck size={14} /> System operates within safe head-room limits.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
