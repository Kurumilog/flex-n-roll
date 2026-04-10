import { useEffect, useState } from 'react';
import { getKpiHistory } from '../lib/api';
import type { KpiHistoryEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KpiSparklineProps {
  employeeId: number;
}

export default function KpiSparkline({ employeeId }: KpiSparklineProps) {
  const [history, setHistory] = useState<KpiHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getKpiHistory(employeeId)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [employeeId]);

  if (loading || history.length < 2) {
    return (
      <div className="h-10 flex items-center justify-center text-gray-400 text-xs">
        {loading ? 'Загрузка...' : 'Нет данных'}
      </div>
    );
  }

  const scores = history.map((h) => h.kpiScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const width = 120;
  const height = 36;
  const padding = 2;

  const points = scores.map((score, i) => {
    const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((score - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const lastScore = scores[scores.length - 1];
  const prevScore = scores[scores.length - 2];
  const trend = lastScore >= prevScore ? 'text-green-600' : 'text-red-600';
  const trendArrow = lastScore >= prevScore ? '↑' : '↓';

  // Format data for recharts
  const chartData = history.map(h => ({
    date: new Date(h.period).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    kpi: Math.round(h.kpiScore * 10) / 10,
    dealsWon: h.dealsWon,
    dealsLost: h.dealsLost
  }));

  return (
    <>
      <div 
        className="flex flex-col items-center cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors group relative"
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
      >
        <span className={`text-xs font-semibold ${trend}`}>
          {trendArrow} {lastScore.toFixed(1)}
        </span>
        <svg width={width} height={height} className="mt-0.5">
          <polyline
            points={points}
            fill="none"
            stroke={lastScore >= prevScore ? '#16a34a' : '#dc2626'}
            strokeWidth="1.5"
          />
        </svg>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 rounded">
          <span className="text-gray-700 bg-white bg-opacity-90 px-1 py-0.5 text-[10px] rounded shadow-sm">Подробнее</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={(e) => { e.stopPropagation(); setShowModal(false); }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-5 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">История KPI (30 дней)</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="h-64 w-full" style={{ minWidth: 0, minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} />
                  <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} width={40} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any, name: any) => [value, name === 'kpi' ? 'KPI' : name]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="kpi" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="bg-gray-50 p-3 rounded">
                <span className="block text-gray-500 text-xs mb-1">Мин. KPI</span>
                <span className="font-semibold text-gray-800">{Math.round(min * 10) / 10}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <span className="block text-gray-500 text-xs mb-1">Макс. KPI</span>
                <span className="font-semibold text-gray-800">{Math.round(max * 10) / 10}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
