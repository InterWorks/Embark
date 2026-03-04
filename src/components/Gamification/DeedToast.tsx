import { useEffect, useState } from 'react';
import type { DeedDefinition } from '../../types';

interface DeedToastProps {
  deed: DeedDefinition;
  onDone: () => void;
}

export function DeedToast({ deed, onDone }: DeedToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 50);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [onDone]);

  return (
    <div
      className={`
        fixed top-20 right-4 z-[200] max-w-sm w-full
        transition-all duration-400
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <div className="flex items-start gap-3 bg-violet-700 border-2 border-yellow-400 shadow-[4px_4px_0_0_#facc15] rounded-[4px] p-4">
        <span className="text-3xl flex-shrink-0">{deed.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-0.5">Deed Unlocked!</div>
          <div className="text-white font-black text-sm">{deed.name}</div>
          <div className="text-violet-200 text-xs mt-0.5 italic">"{deed.flavor}"</div>
        </div>
      </div>
    </div>
  );
}
