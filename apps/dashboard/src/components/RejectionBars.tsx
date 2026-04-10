import type { RejectionReason } from '../types';

interface RejectionBarsProps {
  data: RejectionReason[];
}

const BAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899',
];

export default function RejectionBars({ data }: RejectionBarsProps) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">Нет данных</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Причины отказа</h2>
      <div className="space-y-2">
        {data.map((item, i) => {
          const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const color = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <div key={item.reason}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="font-medium truncate mr-2">{item.reason}</span>
                <span className="text-gray-500 whitespace-nowrap">{item.count}</span>
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
