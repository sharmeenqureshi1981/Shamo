import React from 'react';

export default function Achievements({ completedCount, rewardsUnlocked }) {
  return (
    <div className="flex gap-4 mt-4">
      <div className="bg-white shadow p-3 rounded-xl text-center">
        <div className="text-xl">🏅</div>
        <div className="text-sm text-gray-600">Tasks Done</div>
        <div className="font-bold text-lg">{completedCount}</div>
      </div>
      <div className="bg-white shadow p-3 rounded-xl text-center">
        <div className="text-xl">🎁</div>
        <div className="text-sm text-gray-600">Rewards</div>
        <div className="font-bold text-lg">{rewardsUnlocked}</div>
      </div>
    </div>
  );
}
