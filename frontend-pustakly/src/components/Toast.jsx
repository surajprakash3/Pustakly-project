import React, { useEffect } from 'react';

export default function Toast({ message, duration = 1800, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="toast-popup fixed top-6 left-1/2 z-50 -translate-x-1/2 rounded bg-black/90 px-6 py-3 text-white shadow-lg text-base animate-fade-in">
      {message}
    </div>
  );
}
