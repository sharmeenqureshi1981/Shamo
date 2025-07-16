import React from 'react';

export default function Header({ avatar, tokens, onOpenShop }) {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-yellow-100 rounded-xl shadow mb-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{avatar}</span>
        <span className="text-xl font-bold text-gray-700">Hi there!</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl text-yellow-600 font-bold">{tokens} 🪙</span>
        <button
          onClick={onOpenShop}
          className="bg-pink-500 text-white px-3 py-1 rounded-full font-semibold hover:bg-pink-600 transition"
        >
          Shop
        </button>
      </div>
    </div>
  );
}