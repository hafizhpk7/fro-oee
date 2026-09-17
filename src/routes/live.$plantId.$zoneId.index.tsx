import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { Compass, IsoChip, IsoGround, IsoMachine, IsoPlot, IsoScene, ZoomableMap, iso } from "@/components/oee/iso";
import {
  Delta,
  EmptyState,
  KpiCard,
  PageHeader,
  Panel,
  StatusLegend,
  StatusPill,
} from "@/components/oee/ui";
import { STATUS_HEX, tierOf } from "@/lib/oee/config";
import { getZone, type Line } from "@/lib/oee/data";
import type { PeriodId } from "@/lib/oee/filters";
import { useApp } from "@/lib/oee/app-context";

export const Route = createFileRoute("/live/$plantId/$zoneId/")({
  head: () => ({
    meta: [
      { title: "Zone View — Production Floor Map" },
      {
        name: "description",
        content:
          "Shift Leader home: zone KPI strip and an isometric production floor map with per-line and per-machine status.",
      },
      { property: "og:title", content: "Zone View — Production Floor Map" },
      {
        property: "og:description",
        content: "Zone KPI strip plus isometric production floor map with live line status.",
      },
    ],
  }),
  component: ZoneView,
});

const S = 40;
const GAP_X = 1.7;
const GAP_Y = 1.8;

function ZoneView() {
  const { plantId, zoneId } = useParams({ from: "/live/$plantId/$zoneId/" });
  const [period, setPeriod] = useState<PeriodId>("live");
  const [selected, setSelected] = useState<Line | null>(null);
  const navigate = useNavigate();
  const { role } = useApp();
  const zone = getZone(plantId, zoneId);

  if (!zone) {
    return (
      <div className="p-6">
        <EmptyState message="Zone tidak ditemukan" />
      </div>
    );
  }

  const down = zone.lines.filter((l) => l.status === "down").length;
  const slow = zone.lines.filter((l) => l.status === "slow").length;
  const idle = zone.lines.filter((l) => l.status === "idle").length;
  const machineCount = zone.lines.reduce((a, l) => a + l.machines.length, 0);
  const rows = 3;
  const cols = 5;

  // Shift Leader enters here directly, so no Plant in the breadcrumb; Section Head
  // arrives by drill-down, so Plant is included (§4.1.3).
  const crumbs =
    role === "section-head"
      ? [
          { label: "Kemas", to: "/live" },
          { label: plantId, to: "/live/$plantId", params: { plantId } },
          { label: `${zone.name} · Shift 1` },
        ]
      : [{ label: "Kemas", to: "/" }, { label: `${zone.name} · Shift 1` }];

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <PageHeader
        title={zone.name}
        crumbs={crumbs}
        period={period}
        onPeriod={setPeriod}
        meta="Week 32 · 05-Aug 14:22"
        {...(role === "section-head"
          ? { back: { label: "Plant View", to: "/live/$plantId", params: { plantId } } }
          : {})}
      />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Zone OEE"
            value={zone.oee.toFixed(1)}
            unit="%"
            tone={tierOf(zone.oee) === "good" ? "good" : tierOf(zone.oee) === "warn" ? "warn" : "bad"}
            caption={zone.oee >= 75 ? "On target" : `${(75 - zone.oee).toFixed(1)}% below target`}
          />
          <KpiCard
            label="Availability"
            value={zone.availability.toFixed(1)}
            unit="%"
            caption={<Delta value={zone.availability - 88} />}
          />
          <KpiCard
            label="Performance"
            value={zone.performance.toFixed(1)}
            unit="%"
            caption={<Delta value={zone.performance - 84} />}
          />
          <KpiCard
            label="Quality"
            value={zone.quality.toFixed(1)}
            unit="%"
            caption={<Delta value={zone.quality - 96} />}
          />
          {/* §7 point 5: one name only — "LINES DOWN". */}
          <KpiCard
            label="Lines Down"
            value={`${down} of ${zone.lines.length}`}
            tone={down > 0 ? "bad" : "good"}
            caption={`${slow} slow · ${idle} idle`}
          />
        </div>

        <Panel
          className="flex-1"
          title="Production Floor Map"
          subtitle={`${zone.lines.length} lines · ${machineCount} machines · bays ${rows} × ${cols} (${rows * cols - zone.lines.length} spare)`}
          action={<StatusLegend />}
          bodyClassName="relative p-0"
        >
          <Compass />
          <ZoomableMap className="min-h-[440px] flex-1">
            <IsoScene viewBox="-285 5 570 310">
              <IsoGround cols={cols * GAP_X + 0.5} rows={rows * GAP_Y + 0.5} s={S} />
              <IsoPlot x={0.2} y={0.2} w={cols * GAP_X} d={rows * GAP_Y} s={S} fill="var(--map-plot)" />
              {zone.lines.map((l, i) => {
                const bx = 0.4 + (i % cols) * GAP_X;
                const by = 0.4 + Math.floor(i / cols) * GAP_Y;
                const isSel = selected?.id === l.id;
                return (
                  <g key={l.id} opacity={selected && !isSel ? 0.45 : 1}>
                    {i < zone.lines.length - 1 && (() => {
                      const nextX = 0.4 + ((i + 1) % cols) * GAP_X;
                      const nextY = 0.4 + Math.floor((i + 1) / cols) * GAP_Y;
                      const a = iso(bx + 0.85, by + 0.36, 3, S);
                      const b = iso(nextX, nextY + 0.36, 3, S);
                      return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--machine-line)" strokeWidth={1.2} strokeDasharray="3 2" />;
                    })()}
                    {l.machines.map((m, mi) => (
                      <IsoMachine
                        key={m.id}
                        x={bx + (mi % 2) * 0.78}
                        y={by + Math.floor(mi / 2) * 0.72}
                        s={S}
                        statusColor={STATUS_HEX[m.status]}
                        onClick={() => setSelected(l)}
                      />
                    ))}
                    <IsoChip
                      x={bx + 0.6}
                      y={by + 0.3}
                      s={S}
                      h={isSel ? 58 : 48}
                      label={l.id}
                      value={`${l.oee.toFixed(0)}%`}
                      color={STATUS_HEX[l.status]}
                      filled
                      onClick={() => navigate({ to: "/live/$plantId/$zoneId/$lineId", params: { plantId, zoneId, lineId: l.id } })}
                    />
                  </g>
                );
              })}
            </IsoScene>
          </ZoomableMap>

          {selected && (
            <div className="absolute right-4 top-14 w-64 rounded-lg border border-border bg-surface p-3 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold">{selected.id}</span>
                <StatusPill status={selected.status} />
              </div>
              <dl className="mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">OEE</dt>
                  <dd className="font-mono">{selected.oee.toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Output</dt>
                  <dd className="font-mono">
                    {selected.outputActual.toLocaleString()} / {selected.outputTarget.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Machines</dt>
                  <dd className="font-mono">{selected.machines.length}</dd>
                </div>
                {selected.fault && (
                  <div className="rounded bg-tier-bad/10 px-2 py-1 text-tier-bad">{selected.fault}</div>
                )}
              </dl>
              <div className="mt-2 flex flex-wrap gap-1">
                {selected.machines.map((m) => (
                  <span
                    key={m.id}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]"
                  >
                    {m.id}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/live/$plantId/$zoneId/$lineId",
                    params: { plantId, zoneId, lineId: selected.id },
                  })
                }
                className="mt-2 w-full rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground"
              >
                Click to open line detail →
              </button>
            </div>
          )}
        </Panel>
      </main>
    </div>
  );
}
