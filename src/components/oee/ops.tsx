/**
 * MES daily-operations widgets: shift context bar, critical alert banner,
 * shift comparison, pacing, top losses and the report download action.
 * All mock-driven; acknowledgement state is in-memory only (prototype).
 */
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Clock, Download, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Delta, Panel } from "@/components/oee/ui";
import { TIER_HEX, tierOf } from "@/lib/oee/config";
import { useApp } from "@/lib/oee/app-context";
import {
  allAlarms,
  currentShift,
  isEscalated,
  pacing,
  shiftCompare,
  topShiftLosses,
  type Line,
} from "@/lib/oee/data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------- shift context bar */

export function ShiftContextBar() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const shift = currentShift(now);
  const h = Math.floor(shift.endsInMinutes / 60);
  const m = shift.endsInMinutes % 60;
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-1.5 text-[11px]">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Clock className="size-3.5 text-primary" />
        {shift.label}
      </span>
      <span className="text-muted-foreground">
        ends in {h > 0 ? `${h}h ` : ""}
        {m}m · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="ml-auto hidden text-muted-foreground sm:inline">
        Read-only prototype · downtime reasons are entered by Operators
      </span>
    </div>
  );
}

/* ---------------------------------------------------- critical alert banner */

export function CriticalAlertsBanner() {
  const { acks } = useApp();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const critical = allAlarms().filter(
    (a) => isEscalated(a) && !acks[a.id] && !dismissed.includes(a.id),
  );
  if (critical.length === 0) return null;
  return (
    <div className="space-y-1 border-b border-tier-bad/30 bg-tier-bad/10 px-4 py-2">
      {critical.slice(0, 3).map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-2 text-[12px] text-tier-bad"
          role="alert"
        >
          <AlertTriangle className="size-4 shrink-0 animate-pulse" />
          <span className="font-medium">
            Line {a.lineId} ({a.plantId}) has been down for &gt; 15 minutes — {a.issue}
          </span>
          <Link
            to="/live/$plantId"
            params={{ plantId: a.plantId }}
            className="ml-auto shrink-0 font-semibold underline"
          >
            Open plant
          </Link>
          <button
            type="button"
            aria-label={`Dismiss alert for line ${a.lineId}`}
            onClick={() => setDismissed((d) => [...d, a.id])}
            className="shrink-0 rounded p-0.5 hover:bg-tier-bad/15"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- report download */

export function DownloadReportButton() {
  return (
    <button
      type="button"
      onClick={() => toast("Generating Handover Report…", { description: "PDF export is mocked in this prototype." })}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-muted"
      aria-label="Download handover report"
    >
      <Download className="size-3.5" />
      Download Report
    </button>
  );
}

/* ---------------------------------------------------------- shift compare */

export function ShiftComparePanel({ scopeSeed }: { scopeSeed: string }) {
  const cmp = useMemo(() => shiftCompare(scopeSeed), [scopeSeed]);
  const rows = [
    ["OEE", cmp.oee],
    ["Availability", cmp.availability],
    ["Performance", cmp.performance],
    ["Quality", cmp.quality],
  ] as const;
  return (
    <Panel
      title="This Shift vs Previous Shift"
      subtitle="Side-by-side · snapshot at shift start"
      className="h-full"
    >
      <ul className="space-y-2">
        {rows.map(([label, v]) => (
          <li key={label} className="flex items-center gap-2 text-[11px]">
            <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
            <span className="w-12 text-right font-mono text-muted-foreground">
              {v.previous.toFixed(1)}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="w-12 text-right font-mono font-semibold" style={{ color: TIER_HEX[tierOf(v.current)] }}>
              {v.current.toFixed(1)}
            </span>
            <Delta value={v.delta} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ pacing */

const PACE_STYLE = {
  ahead: "bg-tier-good/15 text-tier-good",
  "on-track": "bg-muted text-muted-foreground",
  behind: "bg-tier-bad/15 text-tier-bad",
} as const;

export function PaceBadge({ line }: { line: Line }) {
  const p = pacing(line);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
        PACE_STYLE[p.state],
      )}
    >
      {p.state === "on-track" ? "On track" : p.state}
      {p.state !== "on-track" && ` ${p.variancePct > 0 ? "+" : ""}${p.variancePct.toFixed(0)}%`}
    </span>
  );
}

export function ShiftPacePanel({ lines, zoneSeed }: { lines: Line[]; zoneSeed: string }) {
  const rows = lines
    .map((l) => ({ line: l, p: pacing(l) }))
    .sort((a, b) => a.p.variancePct - b.p.variancePct)
    .slice(0, 6);
  return (
    <Panel title="Shift Pace" subtitle="Actual vs expected-to-this-minute · worst first">
      <ul className="space-y-1.5 text-[11px]" data-seed={zoneSeed}>
        {rows.map(({ line, p }) => (
          <li key={line.id} className="flex items-center gap-2">
            <Link
              to="/live/$plantId/$zoneId/$lineId"
              params={{ plantId: line.plantId, zoneId: line.zoneId, lineId: line.id }}
              className="w-16 shrink-0 font-mono font-semibold hover:underline"
            >
              {line.id}
            </Link>
            <div className="relative h-2 flex-1 overflow-hidden rounded bg-grid/40">
              <div
                className="h-full rounded"
                style={{
                  width: `${Math.min(100, Math.max(4, (line.outputActual / Math.max(1, p.expectedNow)) * 50))}%`,
                  background: p.state === "behind" ? "var(--tier-bad)" : "var(--tier-good)",
                }}
              />
            </div>
            <span className="w-24 shrink-0 text-right font-mono text-muted-foreground">
              {line.outputActual.toLocaleString()} / {p.expectedNow.toLocaleString()}
            </span>
            <PaceBadge line={line} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* --------------------------------------------------- top losses this shift */

export function TopShiftLossesPanel({ scopeSeed }: { scopeSeed: string }) {
  const losses = useMemo(() => topShiftLosses(scopeSeed), [scopeSeed]);
  return (
    <Panel title="Top Losses Since Shift Start" subtitle="With operator-entered reasons (mocked)">
      <ul className="space-y-2">
        {losses.map((l) => (
          <li key={`${l.category}-${l.label}`} className="rounded-md border border-border px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold">{l.label}</span>
              <span className="font-mono text-muted-foreground">
                {l.minutes} min · {l.occurrences}×
              </span>
            </div>
            <p className="mt-0.5 text-[11px] italic text-muted-foreground">“{l.reason}”</p>
            <Link
              to="/analytics/pareto"
              search={{ category: l.category, measure: "minutes" }}
              className="mt-1 inline-block text-[11px] font-medium text-primary hover:underline"
            >
              Open in Pareto ({l.category}) →
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------ acknowledge */

export function AckControl({ alarmId }: { alarmId: string }) {
  const { acks, acknowledgeAlarm } = useApp();
  const ack = acks[alarmId];
  if (ack) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-tier-good/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-tier-good">
        <Check className="size-3" /> ACK {ack.at} · {ack.by}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => acknowledgeAlarm(alarmId)}
      className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold uppercase hover:bg-muted"
    >
      Acknowledge
    </button>
  );
}

export function EscalatedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-tier-bad px-1.5 py-0.5 text-[10px] font-bold uppercase text-white animate-pulse">
      Escalated
    </span>
  );
}
