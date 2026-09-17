/**
 * Lightweight isometric SVG primitives. The After mockups use rendered 3D
 * illustrations; for a clickable prototype a simplified isometric SVG carries the
 * same information (position, status colour, label) — see §8.
 */
import { Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 3;
const DRAG_THRESHOLD = 5;

type ViewTransform = { scale: number; x: number; y: number };
type DragState = {
  pointerId: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  moved: boolean;
};

export function ZoomableMap({ children, className }: { children: ReactNode; className?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ViewTransform>({ scale: 1, x: 0, y: 0 });
  const dragRef = useRef<DragState | null>(null);
  const draggedRef = useRef(false);
  const [transform, setTransform] = useState<ViewTransform>(transformRef.current);
  const [dragging, setDragging] = useState(false);

  const commit = useCallback((next: ViewTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  const zoomAt = useCallback((nextScale: number, px: number, py: number) => {
    const current = transformRef.current;
    const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale));
    const ratio = scale / current.scale;
    commit({
      scale,
      x: px - (px - current.x) * ratio,
      y: py - (py - current.y) * ratio,
    });
  }, [commit]);

  const zoomFromCenter = (factor: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    zoomAt(transformRef.current.scale * factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      zoomAt(
        transformRef.current.scale * Math.exp(-delta * 0.0015),
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  // Pan only starts after the pointer moves past a small threshold, so simple
  // clicks still reach the map's SVG nodes and trigger drill-down navigation.
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
      moved: false,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDragging(true);
      if (viewportRef.current?.hasPointerCapture(event.pointerId) === false) {
        viewportRef.current.setPointerCapture(event.pointerId);
      }
    }
    commit({ ...transformRef.current, x: drag.originX + dx, y: drag.originY + dy });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    draggedRef.current = drag.moved;
    dragRef.current = null;
    setDragging(false);
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={viewportRef}
      className={cn("relative h-full min-h-[380px] w-full touch-none overflow-hidden", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(event) => {
        // swallow the click that ends a real pan gesture, allow plain clicks
        if (draggedRef.current) {
          draggedRef.current = false;
          event.stopPropagation();
          event.preventDefault();
        }
      }}
    >

      <div
        className={cn(
          "absolute inset-0 h-full w-full origin-top-left",
          dragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-200 ease-in-out",
        )}
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        {children}
      </div>
      <div className="absolute bottom-3 right-3 z-10 flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-md">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          title="Zoom in"
          className="rounded-none text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomFromCenter(1.2)}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset map view"
          title="Reset map view"
          className="rounded-none border-y border-border text-muted-foreground hover:text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => commit({ scale: 1, x: 0, y: 0 })}
        >
          <RotateCcw className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          title="Zoom out"
          className="rounded-none text-foreground"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomFromCenter(1 / 1.2)}
        >
          <Minus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

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
  stroke,
  roofLines = false,
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
  stroke?: string;
  roofLines?: boolean;
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
      <polygon points={pts([t1, t2, t3, t4])} fill={color} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} />
      {roofLines && [0.18, 0.36, 0.54, 0.72, 0.9].map((ratio) => (
        <line
          key={ratio}
          x1={t1.x + (t2.x - t1.x) * ratio}
          y1={t1.y + (t2.y - t1.y) * ratio}
          x2={t4.x + (t3.x - t4.x) * ratio}
          y2={t4.y + (t3.y - t4.y) * ratio}
          stroke="var(--machine-line)"
          strokeWidth={0.65}
          opacity={0.7}
        />
      ))}
      <polygon points={pts([t4, t3, b3, b4])} fill={color} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} style={{ filter: "brightness(0.78)" }} />
      <polygon points={pts([t2, t3, b3, b2])} fill={color} stroke={stroke} strokeWidth={stroke ? 1.2 : 0} style={{ filter: "brightness(0.6)" }} />
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

export function IsoPlot({
  x,
  y,
  w,
  d,
  s = 26,
  fill = "var(--map-plot)",
  stroke = "var(--map-line)",
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  s?: number;
  fill?: string;
  stroke?: string;
}) {
  const points = [iso(x, y, 0, s), iso(x + w, y, 0, s), iso(x + w, y + d, 0, s), iso(x, y + d, 0, s)];
  return <polygon points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill={fill} stroke={stroke} strokeWidth={0.8} />;
}

export function IsoRoad({ x, y, w, d, s = 26 }: { x: number; y: number; w: number; d: number; s?: number }) {
  const a = iso(x, y, 1, s);
  const b = iso(x + w, y, 1, s);
  const c = iso(x + w, y + d, 1, s);
  const e = iso(x, y + d, 1, s);
  const mid1 = iso(x + w / 2, y, 2, s);
  const mid2 = iso(x + w / 2, y + d, 2, s);
  return (
    <g>
      <polygon points={[a, b, c, e].map((p) => `${p.x},${p.y}`).join(" ")} fill="var(--map-road)" />
      <line x1={mid1.x} y1={mid1.y} x2={mid2.x} y2={mid2.y} stroke="var(--map-road-mark)" strokeWidth={1} strokeDasharray="5 4" />
    </g>
  );
}

export function IsoTree({ x, y, s = 26 }: { x: number; y: number; s?: number }) {
  const base = iso(x, y, 0, s);
  return (
    <g pointerEvents="none">
      <line x1={base.x} y1={base.y} x2={base.x} y2={base.y - 9} stroke="var(--map-tree-trunk)" strokeWidth={1.5} />
      <circle cx={base.x} cy={base.y - 12} r={4.5} fill="var(--map-green)" />
    </g>
  );
}

export function IsoMachine({
  x,
  y,
  s = 26,
  statusColor,
  onClick,
}: {
  x: number;
  y: number;
  s?: number;
  statusColor: string;
  onClick?: () => void;
}) {
  const top = iso(x + 0.42, y + 0.35, 24, s);
  return (
    <g onClick={onClick} className={onClick ? "cursor-pointer transition-opacity hover:opacity-80" : undefined}>
      <IsoBlock x={x} y={y} w={0.85} d={0.72} h={11} s={s} color="var(--machine-base)" />
      <IsoBlock x={x + 0.13} y={y + 0.11} w={0.58} d={0.48} h={20} s={s} color="var(--machine-frame)" stroke="var(--machine-line)" />
      <line x1={top.x} y1={top.y + 2} x2={top.x} y2={top.y - 8} stroke="var(--machine-line)" strokeWidth={1} />
      <circle cx={top.x} cy={top.y - 10} r={3.5} fill={statusColor} stroke="var(--surface)" strokeWidth={1.2} />
    </g>
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
  filled = false,
  onClick,
}: {
  x: number;
  y: number;
  s?: number;
  h?: number;
  label: string;
  value?: string;
  color?: string;
  filled?: boolean;
  onClick?: () => void;
}) {
  const p = iso(x, y, h, s);
  const text = value ? `${label} · ${value}` : label;
  const w = text.length * 5.6 + 12;
  return (
    <g
      transform={`translate(${p.x - w / 2}, ${p.y - 14})`}
      pointerEvents={onClick ? "auto" : "none"}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : undefined}
    >
      <line x1={w / 2} y1={15} x2={w / 2} y2={24} stroke={color ?? "var(--border)"} strokeWidth={1} />
      <circle cx={w / 2} cy={25} r={1.7} fill={color ?? "var(--border)"} />
      <rect width={w} height={15} rx={4} fill={filled ? color : "var(--surface)"} stroke={color ?? "var(--border)"} />
      <text
        x={w / 2}
        y={10.5}
        textAnchor="middle"
        className={cn("font-mono", filled ? "fill-primary-foreground" : "fill-foreground")}
        style={{ fontSize: 8.5 }}
      >
        {text}
      </text>
    </g>
  );
}

export function Compass() {
  return (
    <div className="pointer-events-none absolute right-5 top-5 z-10 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <span>N</span>
      <svg width="52" height="52" viewBox="0 0 52 52" className="rounded-full border border-border bg-surface/80">
        <line x1="14" y1="16" x2="38" y2="34" stroke="var(--muted-foreground)" strokeWidth="1.4" />
        <path d="M11 13 L22 16 L16 21 Z" fill="var(--status-down)" />
      </svg>
    </div>
  );
}
