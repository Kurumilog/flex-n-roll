import type { DashboardManager } from '../types';

interface ManagerTableProps {
  managers: DashboardManager[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function kpiColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function kpiBg(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 50) return 'bg-yellow-100';
  return 'bg-red-100';
}

export default function ManagerTable({ managers, selectedId, onSelect }: ManagerTableProps) {
  if (managers.length === 0) {
    return <p className="text-gray-500 text-center py-8">Нет данных о менеджерах</p>;
  }

  const openProfile = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('DOMAIN');
    if (domain) {
      window.open(`https://${domain}/company/personal/user/${id}/`, '_blank');
    } else {
      alert('Не удалось получить домен Bitrix24 (DOMAIN не передан в URL iframe)');
    }
  };

  return (
    <div className="overflow-x-auto">
      <h2 className="text-lg font-semibold mb-3">Менеджеры</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-2 px-3">Менеджер</th>
            <th className="text-left py-2 px-3">Отдел</th>
            <th className="text-center py-2 px-3">KPI</th>
            <th className="text-center py-2 px-3">Статус</th>
            <th className="text-center py-2 px-3">Диалоги</th>
            <th className="text-center py-2 px-3">Задачи</th>
          </tr>
        </thead>
        <tbody>
          {managers.map((m) => (
            <tr
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`border-b cursor-pointer transition-colors ${
                selectedId === m.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <td className="py-2 px-3 font-medium flex items-center">
                <span>{m.name} {m.lastName}</span>
                <button
                  type="button"
                  onClick={(e) => openProfile(e, m.id)}
                  title="Открыть профиль"
                  className="ml-2 text-blue-500 hover:text-blue-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </td>
              <td className="py-2 px-3 text-gray-600">{m.department || '—'}</td>
              <td className="py-2 px-3 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${kpiBg(m.kpiScore)} ${kpiColor(m.kpiScore)}`}>
                  {m.kpiScore.toFixed(1)}
                </span>
              </td>
              <td className="py-2 px-3 text-center">
                {m.isAvailable ? (
                  <span className="text-green-600">🟢</span>
                ) : (
                  <span className="text-red-600">🔴</span>
                )}
              </td>
              <td className="py-2 px-3 text-center">{m.activeDialogsCount}</td>
              <td className="py-2 px-3 text-center">{m.openTasksCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
