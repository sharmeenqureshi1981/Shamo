import React from 'react';

export default function RewardShop({ tokens, rewards, onRedeem, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Reward Shop</h2>
        <div className="mb-4 text-center">
          <span className="font-bold text-lg">Your Tokens: </span>
          <span className="text-yellow-600 font-extrabold text-2xl">{tokens}</span>
        </div>
        <ul>
          {rewards.map((reward) => (
            <li key={reward.id} className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{reward.emoji}</span>
              <span className="flex-1">{reward.name}</span>
              <span className="text-yellow-700 font-bold">{reward.cost} 🪙</span>
              <button
                className={`px-3 py-1 rounded ${
                  tokens < reward.cost
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                disabled={tokens < reward.cost}
                onClick={() => onRedeem(reward.cost, reward.name)}
              >
                Redeem
              </button>
            </li>
          ))}
        </ul>
        <button
          className="w-full bg-gray-400 text-white py-2 rounded-full font-bold hover:bg-gray-500 mt-4"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
