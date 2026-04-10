import { useEffect, useState } from 'react';
import { getDashboardSummary, getFunnel, getRejections } from '../lib/api';
import ManagerTable from './ManagerTable';
import KpiSparkline from './KpiSparkline';
import ActiveDialogs from './ActiveDialogs';
import TaskList from './TaskList';
import FunnelChart from './FunnelChart';
import RejectionBars from './RejectionBars';
import type { DashboardSummary } from '../types';

const POLL_INTERVAL = 30_000; // 30s

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [funnel, setFunnel] = useState<{ total: number; byStatus: { statusId: string; name: string; count: number; percentage: number }[] } | null>(null);
  const [rejections, setRejections] = useState<{ reason: string; count: number }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.allSettled([
      getDashboardSummary(),
      getFunnel(),
      getRejections(),
    ]).then(([summaryRes, funnelRes, rejectionRes]) => {
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value);
      if (rejectionRes.status === 'fulfilled') setRejections(rejectionRes.value);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        <div className="text-center">
          <p className="text-lg">Загрузка...</p>
          <p className="text-xs mt-1">FlexRouter Dashboard</p>
        </div>
      </div>
    );
  }

  const selectedManager = summary?.managers.find((m) => m.id === selectedId);

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">FlexRouter Dashboard</h1>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Всего: {summary?.totalEmployees}</span>
          <span>Доступно: {summary?.availableEmployees}</span>
          <span>Рассылка: {summary?.mailingStats.sent} отправлено</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Manager table (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            {summary && (
              <ManagerTable
                managers={summary.managers}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}
          </div>

          {/* Sparklines row */}
          {summary && summary.managers.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-3">Тренд KPI (30 дней)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {summary.managers.map((m) => (
                  <div key={m.id} className="text-center">
                    <p className="text-xs text-gray-500 truncate">{m.name} {m.lastName}</p>
                    <KpiSparkline employeeId={m.id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active dialogs */}
          <div className="bg-white rounded-lg border p-4">
            <ActiveDialogs />
          </div>

          {/* Selected employee tasks */}
          {selectedManager && (
            <TaskList
              employeeId={selectedManager.id}
              employeeName={`${selectedManager.name} ${selectedManager.lastName}`}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>

        {/* Right: Funnel + Rejections (1/3) */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            {funnel && <FunnelChart data={funnel.byStatus} total={funnel.total} />}
          </div>
          <div className="bg-white rounded-lg border p-4">
            <RejectionBars data={rejections} />
          </div>
        </div>
      </div>
    </div>
  );
}
