'use client';

type OrbitNode = {
  label: string;
  angle: number;
  depth: number;
  tone: 'bg-neo-primary' | 'bg-neo-accent' | 'bg-neo-success' | 'bg-neo-secondary';
};

const orbitNodes: OrbitNode[] = [
  { label: 'Work', angle: 0, depth: 64, tone: 'bg-neo-primary' },
  { label: 'Stay', angle: 72, depth: 24, tone: 'bg-neo-secondary' },
  { label: 'Move', angle: 144, depth: 96, tone: 'bg-neo-success' },
  { label: 'Eat', angle: 216, depth: 32, tone: 'bg-neo-accent' },
  { label: 'Meet', angle: 288, depth: 72, tone: 'bg-neo-primary' },
];

const floatCards = [
  {
    title: 'Low carbon routes',
    description: 'Transit-first travel and walkable neighborhoods',
    className: 'left-4 top-8 sm:left-8',
    delay: '0s',
  },
  {
    title: 'Community stays',
    description: 'Coworking, coliving, and conscious hosts',
    className: 'right-4 bottom-24 sm:right-8',
    delay: '0.6s',
  },
  {
    title: 'Smarter search',
    description: 'Filter by amenities, city, and impact',
    className: 'left-10 bottom-6 sm:left-16',
    delay: '1.2s',
  },
] as const;

export function Hero3DScene(): React.JSX.Element {
  return (
    <div
      className="relative w-full max-w-[420px]"
      aria-hidden="true"
      style={{ perspective: '1400px' }}
    >
      <div className="absolute inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.8),transparent_42%),radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.22),transparent_55%),linear-gradient(135deg,rgba(10,10,10,0.1),rgba(10,10,10,0))] opacity-60 blur-2xl" />

      <div className="relative aspect-square overflow-hidden border-4 border-neo-border bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(245,158,11,0.08)_40%,rgba(16,185,129,0.08)_72%,rgba(79,70,229,0.14))] shadow-[12px_12px_0px_0px_var(--neo-shadow)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0,transparent_20%,rgba(0,0,0,0.08)_58%,rgba(0,0,0,0.18)_100%)]" />

        <div
          className="absolute left-1/2 top-1/2 h-44 w-44"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="absolute inset-0 motion-safe:animate-[hero-spin_18s_linear_infinite] motion-reduce:animate-none"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div
              className="absolute inset-0 rounded-[1.75rem] border-4 border-neo-border bg-[linear-gradient(145deg,rgba(79,70,229,0.95),rgba(245,158,11,0.92))] shadow-[0_20px_0_0_rgba(0,0,0,0.15)]"
              style={{ transform: 'translateZ(90px)' }}
            />
            <div
              className="absolute inset-0 rounded-[1.75rem] border-4 border-neo-border bg-[linear-gradient(225deg,rgba(16,185,129,0.9),rgba(79,70,229,0.85))] shadow-[0_20px_0_0_rgba(0,0,0,0.15)]"
              style={{ transform: 'rotateY(180deg) translateZ(90px)' }}
            />
            <div
              className="absolute inset-0 rounded-[1.75rem] border-4 border-neo-border bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(16,185,129,0.8))] shadow-[0_20px_0_0_rgba(0,0,0,0.15)]"
              style={{ transform: 'rotateY(90deg) translateZ(90px)' }}
            />
            <div
              className="absolute inset-0 rounded-[1.75rem] border-4 border-neo-border bg-[linear-gradient(315deg,rgba(255,255,255,0.65),rgba(245,158,11,0.82))] shadow-[0_20px_0_0_rgba(0,0,0,0.15)]"
              style={{ transform: 'rotateY(-90deg) translateZ(90px)' }}
            />
            <div
              className="absolute inset-0 rounded-[1.75rem] border-4 border-neo-border bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,255,255,0.5))] shadow-[0_20px_0_0_rgba(0,0,0,0.15)]"
              style={{ transform: 'rotateX(90deg) translateZ(90px)' }}
            />
            <div
              className="absolute inset-0 rounded-[1.75rem] border-4 border-neo-border bg-[linear-gradient(0deg,rgba(0,0,0,0.12),rgba(255,255,255,0.12))] shadow-[0_20px_0_0_rgba(0,0,0,0.15)]"
              style={{ transform: 'rotateX(-90deg) translateZ(90px)' }}
            />

            <div className="absolute inset-7 flex items-center justify-center rounded-[1.25rem] border-2 border-neo-border bg-neo-surface/90 text-center shadow-[8px_8px_0_0_var(--neo-shadow)]">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.35em] text-neo-text-secondary">
                  Planet-first
                </div>
                <div className="mt-2 heading-md">Eco routes</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute left-1/2 top-1/2 h-72 w-72"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translate(-50%, -50%) rotateX(68deg)',
          }}
        >
          <div className="relative h-full w-full motion-safe:animate-[hero-orbit_24s_linear_infinite] motion-reduce:animate-none">
            {orbitNodes.map(node => (
              <div
                key={node.label}
                className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 border-2 border-neo-border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-neo-text-primary shadow-[5px_5px_0_0_var(--neo-shadow)] ${node.tone}`}
                style={{
                  transform: `rotate(${node.angle}deg) translateX(122px) translateZ(${node.depth}px) rotate(${-node.angle}deg)`,
                }}
              >
                <span className="h-2 w-2 rounded-full border border-neo-border bg-white" />
                <span>{node.label}</span>
              </div>
            ))}
          </div>
        </div>

        {floatCards.map(card => (
          <div
            key={card.title}
            className={`absolute z-10 max-w-[155px] border-2 border-neo-border bg-neo-surface/95 px-3 py-2 shadow-[6px_6px_0_0_var(--neo-shadow)] motion-safe:animate-[hero-float_5.5s_ease-in-out_infinite] motion-reduce:animate-none ${card.className}`}
            style={{ animationDelay: card.delay }}
          >
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-neo-text-secondary">
              {card.title}
            </div>
            <p className="mt-1 text-[11px] font-medium leading-snug text-neo-text-primary">
              {card.description}
            </p>
          </div>
        ))}

        <div className="absolute bottom-4 left-4 right-4 border-2 border-neo-border bg-neo-surface/95 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-neo-text-primary shadow-[5px_5px_0_0_var(--neo-shadow)]">
          Animated 3D eco scene
        </div>
      </div>
    </div>
  );
}
