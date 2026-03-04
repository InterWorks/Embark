import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfettiProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  speedRotation: number;
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
];

export function Confetti({ isActive, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Create particles
    const newParticles: Particle[] = [];
    const count = 100;

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 10,
        speedY: 3 + Math.random() * 5,
        speedRotation: (Math.random() - 0.5) * 10,
      });
    }

    setParticles(newParticles);

    // Animate particles
    const startTime = Date.now();
    const duration = 3000;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed > duration) {
        setParticles([]);
        onComplete?.();
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.speedX,
          y: p.y + p.speedY,
          rotation: p.rotation + p.speedRotation,
          speedY: p.speedY + 0.1, // gravity
        }))
      );

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, onComplete]);

  if (particles.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: '2px',
            opacity: Math.max(0, 1 - p.y / (window.innerHeight * 1.2)),
          }}
        />
      ))}
    </div>,
    document.body
  );
}

// Hook to trigger confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
  };

  const handleComplete = () => {
    setIsActive(false);
  };

  return {
    isActive,
    trigger,
    handleComplete,
  };
}
