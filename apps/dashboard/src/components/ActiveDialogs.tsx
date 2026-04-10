import { useEffect, useState } from 'react';
import { getOpenSessions } from '../lib/api';
import type { OpenSession } from '../types';

const POLL_INTERVAL = 15_000; // 15s

const CHANNEL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
  vk: 'VK',
  default: 'Чат',
};

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}ч ${remMins}м`;
}

export default function ActiveDialogs() {
  const [sessions, setSessions] = useState<OpenSession[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = () => {
    setLoading(true);
    getOpenSessions()
      .then((data) => setSessions(data))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">
        Активные диалоги
        <span className="text-xs text-gray-400 font-normal ml-2">обновление каждые 15с</span>
      </h2>
      {loading && sessions.length === 0 && (
        <p className="text-gray-400 text-sm">Загрузка...</p>
      )}
      {!loading && sessions.length === 0 && (
        <p className="text-gray-400 text-sm">Нет активных диалогов</p>
      )}
      {sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-lg p-3 border text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">
                    {CHANNEL_LABELS[s.PROVIDER] || CHANNEL_LABELS.default}
                  </span>
                  <span className="text-gray-400 text-xs ml-2">
                    {s.MANAGER_NAME ? `Менеджер: ${s.MANAGER_NAME}` : `User #${s.USER_ID}`}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDuration(s.WAITING_TIME)}
                </span>
              </div>
              {s.LAST_MESSAGE && (
                <p className="text-gray-600 mt-1 truncate">{s.LAST_MESSAGE}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
