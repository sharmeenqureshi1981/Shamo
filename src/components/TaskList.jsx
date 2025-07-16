import React from 'react';

export default function TaskList({
  tasks,
  onChildToggleTask,
  onParentApprove,
  onParentReject,
  onParentReset,
  mode = 'child',
  childId
}) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-gray-500 text-center mb-4">No tasks assigned yet.</div>;
  }

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-2">Today's Tasks</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id} className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{task.emoji}</span>
            <span className={`flex-1 ${
              task.status === 'approved'
                ? 'line-through text-gray-400'
                : task.status === 'pending'
                ? 'italic text-yellow-600'
                : ''
            }`}>
              {task.name}
              <span className="text-xs text-gray-500 ml-2">(Reward: {task.reward})</span>
              {task.status === 'pending' && (
                <span className="ml-2 text-yellow-600 font-bold">👀</span>
              )}
              {task.status === 'approved' && (
                <span className="ml-2 text-green-600 font-bold">👍</span>
              )}
            </span>
            {mode === 'child' && (
              <>
                {task.status === 'not_done' && (
                  <button
                    className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => onChildToggleTask(task.id)}
                  >
                    👍
                  </button>
                )}
                {task.status === 'pending' && (
                  <button
                    className="px-3 py-1 rounded bg-gray-300 text-gray-700 hover:bg-gray-400"
                    onClick={() => onChildToggleTask(task.id)}
                  >
                   ↩️
                  </button>
                )}
                {task.status === 'approved' && (
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    👍
                  </button>
                )}
              </>
            )}
            {mode === 'parent' && (
              <>
                {task.status === 'pending' && (
                  <>
                    <button
                      className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                      onClick={() => onParentApprove(childId, task.id)}
                    >
                      👍
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                      onClick={() => onParentReject(childId, task.id)}
                    >
                     ❌
                    </button>
                  </>
                )}
                {task.status === 'approved' && (
                  <button
                    className="px-3 py-1 rounded bg-gray-400 text-white hover:bg-gray-500"
                    onClick={() => onParentReset(childId, task.id)}
                  >
                    ❌
                  </button>
                )}
                {task.status === 'not_done' && (
                  <span className="px-3 py-1 rounded bg-gray-200 text-gray-400">❌</span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
