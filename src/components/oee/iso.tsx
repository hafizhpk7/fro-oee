/**
 * Lightweight isometric SVG primitives. The After mockups use rendered 3D
 * illustrations; for a clickable prototype a simplified isometric SVG carries the
 * same information (position, status colour, label) — see §8.
 */
import type { ReactNode } from "react";

export function iso(x: number, y: number, h: number, s: number) {
  return { x: (x - y) * s * 0.866, y: (x + y) * s * 0.5 - h };
}

export function IsoBlock({
  x,
  y,
  w = 1,
  d = 1,
  h = 14,
  s = 26,
  color,
  onClick,
  dim,
}: {
  x: number;
  y: number;
  w?: number;
  d?: number;
  h?: number;
  s?: number;
  color: string;
  onClick?: () => void;
  dim?: boolean;
}) {
  const t1 = iso(x, y, h, s);
  const t2 = iso(x + w, y, h, s);
  const t3 = iso(x + w, y + d, h, s);
  const t4 = iso(x, y + d, h, s);
  const b4 = iso(x, y + d, 0, s);
  const b3 = iso(x + w, y + d, 0, s);
  const b2 = iso(x + w, y, 0, s);
  const pts = (p: { x: number; y: number }[]) => p.map((q) => `${q.x},${q.y}`).join(" ");
  return (
    <g
      onClick={onClick}
      className={onClick ? "cursor-pointer transition-opacity hover:opacity-80" : undefined}
      opacity={dim ? 0.5 : 1}
    >
      <polygon points={pts([t1, t2, t3, t4])} fill={color} />
      <polygon points={pts([t4, t3, b3, b4])} fill={color} style={{ filter: "brightness(0.78)" }} />
      <polygon points={pts([t2, t3, b3, b2])} fill={color} style={{ filter: "brightness(0.6)" }} />
    </g>
  );
}

export function IsoScene({
  children,
  viewBox = "-320 -140 640 420",
  className,
}: {
  children: ReactNode;
  viewBox?: string;
  className?: string;
}) {
  return (
    <svg viewBox={viewBox} className={className ?? "h-full w-full"} role="img">
      {children}
    </svg>
  );
}

export function IsoGround({
  cols,
  rows,
  s = 26,
}: {
  cols: number;
  rows: number;
  s?: number;
}) {
  const a = iso(0, 0, 0, s);
  const b = iso(cols, 0, 0, s);
  const c = iso(cols, rows, 0, s);
  const d = iso(0, rows, 0, s);
  return (
    <polygon
      points={[a, b, c, d].map((p) => `${p.x},${p.y}`).join(" ")}
      fill="var(--grid)"
      opacity={0.6}
    />
  );
}

export function IsoChip({
  x,
  y,
  s = 26,
  h = 30,
  label,
  value,
  color,
}: {
  x: number;
  y: number;
  s?: number;
  h?: number;
  label: string;
  value?: string;
  color?: string;
}) {
  const p = iso(x, y, h, s);
  const text = value ? `${label} · ${value}` : label;
  const w = text.length * 5.6 + 12;
  return (
    <g transform={`translate(${p.x - w / 2}, ${p.y - 14})`} pointerEvents="none">
      <rect width={w} height={15} rx={7.5} fill="var(--surface)" stroke={color ?? "var(--border)"} />
      <text
        x={w / 2}
        y={10.5}
        textAnchor="middle"
        className="fill-foreground font-mono"
        style={{ fontSize: 8.5 }}
      >
        {text}
      </text>
    </g>
  );
}

export function Compass() {
  return (
    <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-center text-[9px] uppercase tracking-widest text-muted-foreground">
      <span>N</span>
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 1 L12 12 L9 9.5 L6 12 Z" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  );
}
