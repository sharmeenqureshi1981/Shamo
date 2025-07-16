import React from 'react';

export default function Confetti({ trigger }) {
  if (!trigger) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <span role="img" aria-label="confetti" className="text-6xl animate-bounce">🎉</span>
    </div>
  );
}