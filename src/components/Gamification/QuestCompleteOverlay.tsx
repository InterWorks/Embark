import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GamificationEvent } from '../../types';

interface QuestCompleteOverlayProps {
  event: GamificationEvent;
  onDone: () => void;
}

export function QuestCompleteOverlay({ event, onDone }: QuestCompleteOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24'],
    });
    return () => clearTimeout(show);
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-[300] flex items-center justify-center
        bg-black/60 backdrop-blur-sm
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onDone}
    >
      <div
        className={`
          relative text-center max-w-md w-full mx-4
          bg-gradient-to-br from-emerald-900/95 to-teal-900/95
          border-2 border-emerald-400/60
          rounded-3xl p-8 shadow-2xl
          transition-all duration-500
          ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">🏆</div>
        <div className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-2">Quest Complete!</div>
        <div className="text-white text-2xl font-black mb-1">{event.clientName}</div>
        <div className="text-emerald-300 text-sm mb-4">has been fully onboarded.</div>
        {event.xpGained && (
          <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold px-4 py-1.5 rounded-full text-sm mb-6">
            <span>⚡</span>
            <span>+{event.xpGained} XP earned</span>
          </div>
        )}
        <div className="block">
          <button
            onClick={onDone}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all"
          >
            Onward!
          </button>
        </div>
      </div>
    </div>
  );
}
