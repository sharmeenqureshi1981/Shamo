import React from 'react';

export default function TokenCounter({ tokens }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <span className="text-6xl font-black text-yellow-400 animate-bounce">
        {tokens} <span role="img" aria-label="token">🪙</span>
      </span>
      <span className="text-lg font-semibold text-gray-600 mt-1">Total Tokens</span>
    </div>
  );
}