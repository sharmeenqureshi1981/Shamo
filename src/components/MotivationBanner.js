import React, { useEffect, useState } from 'react';

export default function MotivationBanner({ messages }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [messages]);

  return (
    <div className="bg-blue-100 text-blue-700 font-semibold px-4 py-2 text-center rounded-lg mb-4 shadow">
      {messages[index]}
    </div>
  );
}
