import { useEffect, useState } from 'react';

interface XPPopupProps {
  amount: number;
  onDone: () => void;
}

export function XPPopup({ amount, onDone }: XPPopupProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`
        fixed bottom-24 right-6 z-[200]
        pointer-events-none
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}
      `}
    >
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
        <span>⚡</span>
        <span>+{amount} XP</span>
      </div>
    </div>
  );
}
