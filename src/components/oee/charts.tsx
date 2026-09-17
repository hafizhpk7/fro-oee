import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line as RLine,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, ChevronRight } from "lucide-react";

import { TIER_HEX, tierOf } from "@/lib/oee/config";
import type { LossNode, Point } from "@/lib/oee/data";
import { cn } from "@/lib/utils";

const AXIS = { fontSize: 10, fill: "var(--muted-foreground)" } as const;

export type Measure = "minutes" | "occurrences";

export function MeasureToggle({
  value,
  onChange,
}: {
  value: Measure;
  onChange: (m: Measure) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border p-0.5 text-[11px]">
      {(
        [
          ["minutes", "By minutes"],
          ["occurrences", "By occurrences"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "rounded px-2 py-0.5 font-medium",
            value === id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Sparkline({ data, dataKey = "v" }: { data: Point[]; dataKey?: string }) {
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <RLine
            type="monotone"
            dataKey={dataKey}
            stroke="var(--primary)"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({
  data,
  keys,
  reference,
  height = 220,
}: {
  data: Point[];
  keys: string[];
  reference?: number;
  height?: number;
}) {
  const colors = ["var(--primary)", "var(--tier-good)", "var(--tier-warn)", "var(--tier-bad)"];
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} stroke="var(--grid)" />
          <YAxis tick={AXIS} stroke="var(--grid)" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {reference !== undefined && (
            <ReferenceLine y={reference} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          )}
          {keys.map((k, i) => (
            <RLine
              key={k}
              type="monotone"
              dataKey={k}
              stroke={colors[i % colors.length]}
              strokeWidth={1.8}
              dot={{ r: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarByLine({
  data,
  onSelect,
  height = 240,
}: {
  data: { label: string; value: number }[];
  onSelect?: (label: string) => void;
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="label" tick={{ ...AXIS, fontSize: 9 }} stroke="var(--grid)" interval={0} angle={-35} height={40} textAnchor="end" />
          <YAxis tick={AXIS} stroke="var(--grid)" domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Bar
            dataKey="value"
            radius={[3, 3, 0, 0]}
            onClick={(d: { label?: string }) => d.label && onSelect?.(d.label)}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={TIER_HEX[tierOf(d.value)]} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ParetoChart({
  data,
  selected,
  onSelect,
  height = 230,
}: {
  data: { label: string; value: number; id: string }[];
  selected?: string | undefined;
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let running = 0;
  const rows = data.map((d) => {
    running += d.value;
    return { ...d, cumulative: Math.round((running / total) * 1000) / 10 };
  });
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ ...AXIS, fontSize: 9 }}
            stroke="var(--grid)"
            interval={0}
            angle={-25}
            height={48}
            textAnchor="end"
          />
          <YAxis yAxisId="left" tick={AXIS} stroke="var(--grid)" />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={AXIS}
            stroke="var(--grid)"
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 11,
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="value"
            radius={[3, 3, 0, 0]}
            onClick={(d: { id?: string }) => d.id && onSelect?.(d.id)}
            className={onSelect ? "cursor-pointer" : undefined}
          >
            {rows.map((d) => (
              <Cell
                key={d.id}
                fill={selected === d.id ? "var(--primary)" : "var(--grid)"}
                stroke={selected === d.id ? "var(--primary)" : "var(--border)"}
              />
            ))}
          </Bar>
          <RLine
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="var(--tier-warn)"
            strokeWidth={1.8}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** OEE Waterfall — structure per BR 2.3.3; "Unutilized" renamed "Idle, no order". */
export function Waterfall({
  milestones,
  losses,
}: {
  milestones: { label: string; value: number }[];
  losses: { label: string; value: number; group: string }[];
}) {
  const max = milestones[0]?.value ?? 1;
  const groupColor: Record<string, string> = {
    Loading: "var(--status-idle)",
    Availability: "var(--tier-bad)",
    Performance: "var(--tier-warn)",
    Quality: "var(--primary)",
  };
  return (
    <div className="space-y-1.5">
      {milestones.map((m, i) => (
        <div key={m.label}>
          <div className="flex items-center gap-2">
            <span className="w-40 shrink-0 text-[11px] font-medium">{m.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-grid/60">
              <div
                className="h-full rounded bg-primary/85"
                style={{ width: `${(m.value / max) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-[11px]">{m.value} min</span>
          </div>
          {losses
            .filter((_, li) => lossBelongsTo(li, i))
            .map((l) => (
              <div key={l.label} className="mt-1 flex items-center gap-2 pl-4">
                <span className="w-36 shrink-0 truncate text-[10px] text-muted-foreground">
                  {l.group} · {l.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded bg-grid/40">
                  <div
                    className="h-full rounded"
                    style={{ width: `${(l.value / max) * 100}%`, background: groupColor[l.group] }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  −{l.value} min
                </span>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

/** Losses are grouped under the milestone they reduce. */
function lossBelongsTo(lossIndex: number, milestoneIndex: number) {
  if (milestoneIndex === 0) return lossIndex === 0 || lossIndex === 1;
  if (milestoneIndex === 1) return lossIndex >= 2 && lossIndex <= 4;
  if (milestoneIndex === 2) return lossIndex >= 5 && lossIndex <= 7;
  if (milestoneIndex === 3) return lossIndex >= 8;
  return false;
}

/** Generic recursive loss tree (2-3 levels) — §4.2.2. */
export function LossTree({
  nodes,
  measure,
  onOpen,
}: {
  nodes: LossNode[];
  measure: Measure;
  onOpen: (node: LossNode) => void;
}) {
  const val = (n: LossNode) => (measure === "minutes" ? n.minutes : n.occurrences);
  const total = nodes.reduce((a, b) => a + val(b), 0) || 1;
  const sorted = [...nodes].sort((a, b) => val(b) - val(a));
  return (
    <ul className="space-y-1">
      {sorted.map((n) => (
        <LossTreeRow key={n.id} node={n} measure={measure} total={total} depth={0} onOpen={onOpen} />
      ))}
    </ul>
  );
}

function LossTreeRow({
  node,
  measure,
  total,
  depth,
  onOpen,
}: {
  node: LossNode;
  measure: Measure;
  total: number;
  depth: number;
  onOpen: (node: LossNode) => void;
}) {
  const [open, setOpen] = useState(false);
  const val = (n: LossNode) => (measure === "minutes" ? n.minutes : n.occurrences);
  const value = val(node);
  const pct = Math.round((value / total) * 1000) / 10;
  const hasChildren = !!node.children?.length;
  const children = [...(node.children ?? [])].sort((a, b) => val(b) - val(a));
  const childTotal = children.reduce((a, b) => a + val(b), 0) || 1;
  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-grid/50"
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        <button
          type="button"
          aria-label={hasChildren ? "Expand" : "No children"}
          onClick={() => hasChildren && setOpen((o) => !o)}
          className={cn("text-muted-foreground", !hasChildren && "invisible")}
        >
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onOpen(node)}
          title="Open root cause pareto"
          className="w-40 shrink-0 truncate text-left text-[11px] font-medium hover:underline"
        >
          {node.label}
        </button>
        <div className="h-2.5 flex-1 overflow-hidden rounded bg-grid/40">
          <div
            className="h-full rounded"
            style={{
              width: `${pct}%`,
              background: depth === 0 ? "var(--tier-bad)" : depth === 1 ? "var(--tier-warn)" : "var(--primary)",
            }}
          />
        </div>
        <span className="w-20 shrink-0 text-right font-mono text-[11px]">
          {measure === "minutes" ? `${value} min` : `${value}×`}
        </span>
        <span className="w-12 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
          {pct}%
        </span>
      </div>
      {open && hasChildren && (
        <ul className="space-y-1">
          {children.map((c) => (
            <LossTreeRow
              key={c.id}
              node={c}
              measure={measure}
              total={childTotal}
              depth={depth + 1}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DivergingList({
  rows,
  unit = "pp",
}: {
  rows: { label: string; delta: number }[];
  unit?: string;
}) {
  const max = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => {
        const pct = (Math.abs(r.delta) / max) * 50;
        const good = r.delta >= 0;
        return (
          <li key={r.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate font-mono text-[11px]">{r.label}</span>
            <div className="relative h-2.5 flex-1 rounded bg-grid/40">
              <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
              <span
                className="absolute top-0 h-full rounded"
                style={{
                  width: `${pct}%`,
                  left: good ? "50%" : `${50 - pct}%`,
                  background: good ? "var(--tier-good)" : "var(--tier-bad)",
                }}
              />
            </div>
            <span
              className={cn(
                "w-14 shrink-0 text-right font-mono text-[11px]",
                good ? "text-tier-good" : "text-tier-bad",
              )}
            >
              {r.delta > 0 ? "+" : ""}
              {r.delta.toFixed(1)}
              {unit}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
