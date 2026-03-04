import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import type { GamificationEvent } from '../../types';
import { getClassIcon } from '../../utils/gamification';
import { useGamificationContext } from '../../context/GamificationContext';

interface LevelUpModalProps {
  event: GamificationEvent;
  onDone: () => void;
}

export function LevelUpModal({ event, onDone }: LevelUpModalProps) {
  const [visible, setVisible] = useState(false);
  const { getCurrentPlayerState } = useGamificationContext();
  const playerState = getCurrentPlayerState();

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#7c3aed', '#a78bfa'],
    });
    return () => clearTimeout(show);
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-[300] flex items-center justify-center
        bg-black/80
        transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onDone}
    >
      <div
        className={`
          relative text-center max-w-sm w-full mx-4
          bg-violet-700
          border-2 border-yellow-400
          shadow-[8px_8px_0_0_#facc15]
          rounded-[4px] p-8
          transition-all duration-500
          ${visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-3">{getClassIcon(playerState.characterClass)}</div>
        <div className="text-yellow-400 text-sm font-black uppercase tracking-widest mb-1">Level Up!</div>
        <div className="text-white text-5xl font-black mb-2">{event.newLevel}</div>
        <div className="text-yellow-300 text-xl font-black mb-1">{event.newTitle}</div>
        <div className="text-violet-200 text-sm mb-6">You have grown in power and legend.</div>
        <button
          onClick={onDone}
          className="px-6 py-2 bg-yellow-400 text-zinc-900 font-black rounded-[4px] border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          Continue the Quest
        </button>
      </div>
    </div>
  );
}
