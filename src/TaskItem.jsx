import React from 'react';

export default function TaskItem({ task, onMarkDone }) {
  return (
    <li className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="flex items-center gap-2">
        <span>{task.emoji}</span>
        <span className={task.done ? 'line-through text-gray-400' : ''}>{task.name}</span>
      </span>
      <button
        className={`px-3 py-1 rounded-full font-bold text-sm ${
          task.done
            ? 'bg-green-200 text-green-700 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
        onClick={() => onMarkDone(task.id)}
        disabled={task.done}
      >
        {task.done ? '👍' : '👍'}
      </button>
    </li>
  );
}