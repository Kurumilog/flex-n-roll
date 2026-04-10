import { useState } from 'react';
import AddTaskModal from './AddTaskModal';

interface TaskListProps {
  employeeId: number;
  employeeName: string;
  onClose: () => void;
}

export default function TaskList({ employeeId, employeeName, onClose }: TaskListProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Задачи — {employeeName}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Добавить задачу
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
      <p className="text-gray-400 text-xs">
        Задачи загружаются из Bitrix24 (crm.task.list)
      </p>

      {showModal && (
        <AddTaskModal
          employeeId={employeeId}
          employeeName={employeeName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
