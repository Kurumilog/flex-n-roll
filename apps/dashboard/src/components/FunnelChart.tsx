import type { FunnelStatus } from '../types';

interface FunnelChartProps {
  data: FunnelStatus[];
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  '3': '#60a5fa',
  '4': '#f59e0b',
  '5': '#10b981',
  CONVERTED: '#059669',
  default: '#94a3b8',
};

export default function FunnelChart({ data, total }: FunnelChartProps) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">Нет данных</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Воронка конверсии
        <span className="text-xs text-gray-400 font-normal ml-2">{total} лидов</span>
      </h2>
      <div className="space-y-2">
        {data.map((item) => {
          const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const color = STATUS_COLORS[item.statusId] || STATUS_COLORS.default;

          return (
            <div key={item.statusId}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
