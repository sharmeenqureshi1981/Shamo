import React from 'react';

export default function DressUpModal({ avatar, unlocked, equipped, onEquip, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-80 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Dress Up!</h2>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <img src={avatar} alt="Avatar" className="absolute w-32 h-32 left-0 top-0" />
          {equipped.map((acc, i) => (
            <img key={i} src={acc} alt="" className="absolute w-32 h-32 left-0 top-0 pointer-events-none" />
          ))}
        </div>
        <h3 className="font-bold mb-2">Accessories</h3>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {unlocked.map(acc => (
            <button
              key={acc}
              className={`border rounded p-1 ${equipped.includes(acc) ? 'border-blue-500' : 'border-gray-300'}`}
              onClick={() => onEquip(acc)}
            >
              <img src={acc} alt="" className="w-10 h-10" />
            </button>
          ))}
        </div>
        <button className="w-full bg-gray-400 text-white py-2 rounded-full font-bold hover:bg-gray-500 mt-2" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}