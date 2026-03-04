// Ambient decorative shapes — fixed overlay behind all content.
// pointer-events-none, z-[1]: shows in body margins, hidden under opaque cards/sidebar.

type Shape = {
  left: string;
  top: string;
  w: number;
  h: number;
  color: string;
  shape: string;       // clip-path / border-radius class
  anim: string;        // float or spin animation class
  opacity: number;
};

const SHAPES: Shape[] = [
  // ── Top strip ──────────────────────────────────────────────────────────
  { left:  '2%', top: '2%',  w: 22, h: 22, color: '#facc15', shape: 'clip-burst',  anim: 'deco-spin',    opacity: 0.30 },
  { left: '14%', top: '1%',  w: 10, h: 10, color: '#ec4899', shape: 'clip-diamond',anim: 'deco-float-3', opacity: 0.22 },
  { left: '32%', top: '3%',  w: 14, h: 14, color: '#8b5cf6', shape: 'clip-star-4', anim: 'deco-float-6', opacity: 0.20 },
  { left: '55%', top: '2%',  w:  8, h:  8, color: '#06b6d4', shape: 'clip-diamond',anim: 'deco-float-1', opacity: 0.22 },
  { left: '80%', top: '1%',  w: 18, h: 18, color: '#facc15', shape: 'clip-burst',  anim: 'deco-spin-rev',opacity: 0.28 },
  { left: '94%', top: '5%',  w: 12, h: 12, color: '#f97316', shape: 'clip-star-4', anim: 'deco-float-2', opacity: 0.22 },

  // ── Left edge ──────────────────────────────────────────────────────────
  { left:  '1%', top: '20%', w: 26, h: 26, color: '#22d3ee', shape: 'shape-blob',  anim: 'deco-float-4', opacity: 0.18 },
  { left:  '3%', top: '42%', w: 12, h: 12, color: '#a78bfa', shape: 'clip-hex',    anim: 'deco-float-7', opacity: 0.22 },
  { left:  '1%', top: '62%', w: 20, h: 20, color: '#ec4899', shape: 'clip-burst',  anim: 'deco-float-2', opacity: 0.20 },
  { left:  '4%', top: '82%', w: 10, h: 10, color: '#facc15', shape: 'clip-diamond',anim: 'deco-float-5', opacity: 0.28 },

  // ── Right edge ─────────────────────────────────────────────────────────
  { left: '92%', top: '18%', w: 30, h: 30, color: '#8b5cf6', shape: 'clip-burst',  anim: 'deco-spin',    opacity: 0.22 },
  { left: '95%', top: '34%', w: 14, h: 14, color: '#facc15', shape: 'clip-star-4', anim: 'deco-float-3', opacity: 0.30 },
  { left: '89%', top: '50%', w: 22, h: 22, color: '#34d399', shape: 'shape-blob2', anim: 'deco-float-8', opacity: 0.20 },
  { left: '94%', top: '68%', w: 10, h: 10, color: '#f97316', shape: 'clip-diamond',anim: 'deco-float-1', opacity: 0.22 },
  { left: '91%', top: '85%', w: 16, h: 16, color: '#ec4899', shape: 'clip-hex',    anim: 'deco-float-6', opacity: 0.22 },

  // ── Bottom strip ───────────────────────────────────────────────────────
  { left: '18%', top: '93%', w: 14, h: 14, color: '#06b6d4', shape: 'clip-star-4', anim: 'deco-float-5', opacity: 0.22 },
  { left: '42%', top: '95%', w: 20, h: 20, color: '#facc15', shape: 'clip-burst',  anim: 'deco-spin',    opacity: 0.22 },
  { left: '65%', top: '94%', w:  9, h:  9, color: '#8b5cf6', shape: 'clip-diamond',anim: 'deco-float-4', opacity: 0.22 },

  // ── Mid-page scatter (low opacity — behind cards) ───────────────────────
  { left: '22%', top: '28%', w:  8, h:  8, color: '#ec4899', shape: 'clip-diamond',anim: 'deco-float-2', opacity: 0.14 },
  { left: '70%', top: '22%', w: 12, h: 12, color: '#34d399', shape: 'clip-star-4', anim: 'deco-float-7', opacity: 0.14 },
  { left: '48%', top: '58%', w: 10, h: 10, color: '#facc15', shape: 'clip-burst',  anim: 'deco-float-3', opacity: 0.14 },
  { left: '76%', top: '48%', w:  8, h:  8, color: '#06b6d4', shape: 'clip-diamond',anim: 'deco-float-6', opacity: 0.14 },
];

export function FloatingDecorations() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {SHAPES.map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.shape} ${s.anim}`}
          style={{
            left: s.left,
            top: s.top,
            width: s.w,
            height: s.h,
            backgroundColor: s.color,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
