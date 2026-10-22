import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, Table, Info } from 'lucide-react';
import type { ConceptChartConfig } from './types';

interface DynamicConceptChartProps {
  config: ConceptChartConfig;
}

export const DynamicConceptChart: React.FC<DynamicConceptChartProps> = ({ config }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>(config.type || 'bar');
  const [showTable, setShowTable] = useState(false);

  if (!config || !config.data || config.data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        No performance chart data available for this concept.
      </div>
    );
  }

  const hasBenchmark = config.data.some((d) => d.benchmark !== undefined);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
      {/* Chart Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-base font-black text-slate-900">{config.title}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setShowTable(false);
              setChartType('bar');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              !showTable && chartType === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 size={13} /> Bar
          </button>

          <button
            type="button"
            onClick={() => {
              setShowTable(false);
              setChartType('area');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              !showTable && chartType === 'area' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LineIcon size={13} /> Area
          </button>

          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              showTable ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table size={13} /> Table
          </button>
        </div>
      </div>

      {/* Chart Canvas or Table */}
      {showTable ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Metric / Stage</th>
                <th className="px-4 py-3">Current Value</th>
                {hasBenchmark && <th className="px-4 py-3">Baseline / Target</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {config.data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-bold text-slate-800">{row[config.xAxisKey || 'name']}</td>
                  <td className="px-4 py-2.5 font-mono text-indigo-600 font-bold">{row.value}</td>
                  {hasBenchmark && <td className="px-4 py-2.5 font-mono text-slate-500">{row.benchmark ?? '-'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={config.xAxisKey || 'name'} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="value" name="Optimized Metric" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                {hasBenchmark && (
                  <Area type="monotone" dataKey="benchmark" name="Unoptimized Baseline" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorBenchmark)" />
                )}
              </AreaChart>
            ) : chartType === 'line' ? (
              <LineChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={config.xAxisKey || 'name'} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="value" name="Metric Result" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} />
                {hasBenchmark && (
                  <Line type="monotone" dataKey="benchmark" name="Baseline" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                )}
              </LineChart>
            ) : (
              <BarChart data={config.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey={config.xAxisKey || 'name'} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#FFF',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="value" name="Metric Result" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                {hasBenchmark && (
                  <Bar dataKey="benchmark" name="Baseline Target" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Footnote Insight */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <Info size={13} className="text-slate-400 flex-shrink-0" />
        <span>Values generated dynamically to model real-world production performance characteristics.</span>
      </div>
    </div>
  );
};
