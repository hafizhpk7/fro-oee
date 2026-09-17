import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";

import { Compass, IsoBlock, IsoChip, IsoGround, IsoPlot, IsoScene, ZoomableMap } from "@/components/oee/iso";
import {
  Donut,
  EmptyState,
  MetricBar,
  PageHeader,
  Panel,
  StatusLegend,
} from "@/components/oee/ui";
import { STATUS_HEX, TIER_HEX } from "@/lib/oee/config";
import { getPlant, plantAlarms } from "@/lib/oee/data";
import type { PeriodId } from "@/lib/oee/filters";

const ZONE_ORIGINS = [
  { x: 0.8, y: 0.8 },
  { x: 5.6, y: 0.8 },
  { x: 3.1, y: 4.65 },
] as const;
const ZONE_LABELS = [
  { x: 2.35, y: 0.9 },
  { x: 7.15, y: 0.9 },
  { x: 4.65, y: 4.7 },
] as const;
const REFERENCE_ZONE_SUMMARIES = [
  { oee: 77, availability: 87.8, performance: 92.3, quality: 95 },
  { oee: 77.3, availability: 88.2, performance: 91.8, quality: 95.5 },
  { oee: 82.6, availability: 92.3, performance: 93.2, quality: 96.1 },
] as const;

export const Route = createFileRoute("/live/$plantId/")({
  head: () => ({
    meta: [
      { title: "Plant View — Live Monitor" },
      {
        name: "description",
        content: "Plant level live monitor: zone OEE cards, alarms this shift, and an isometric zone map.",
      },
      { property: "og:title", content: "Plant View — Live Monitor" },
      { property: "og:description", content: "Zone OEE, alarms and isometric zone map for one plant." },
    ],
  }),
  component: PlantView,
});

function PlantView() {
  const { plantId } = useParams({ from: "/live/$plantId/" });
  const [period, setPeriod] = useState<PeriodId>("live");
  const navigate = useNavigate();
  const plant = getPlant(plantId);

  if (!plant) {
    return (
      <div className="p-6">
        <EmptyState message="Plant tidak ditemukan" />
      </div>
    );
  }

  const alarms = plantAlarms(plant);
  const occurring = alarms.filter((a) => a.status === "OCCURRING").length;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <PageHeader
        title={`${plant.name} — Plant View`}
        // "Blok" has no definition in any document (§7 point 2): static breadcrumb text only.
        crumbs={[
          { label: "Kemas", to: "/live" },
          { label: `${plant.id} · ${plant.block} · Shift 1` },
        ]}
        period={period}
        onPeriod={setPeriod}
        meta="Week 32 · 05-Aug 14:22"
        back={{ label: "Multi Plant", to: "/live" }}
      />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid min-h-28 overflow-hidden rounded-lg border border-border bg-surface xl:grid-cols-[1.7fr_0.8fr]">
          <div className="flex min-w-0 flex-wrap items-stretch">
          <div className="flex items-center gap-4 border-r border-border px-4 py-3">
            <Donut value={plant.id === "J2" ? 76.9 : plant.oee} size={88} label={`${plant.id} OEE`} decimals={1} />
            <div className="grid w-44 gap-1.5">
              <MetricBar label="Availability" value={plant.availability} />
              <MetricBar label="Performance" value={plant.performance} />
              <MetricBar label="Quality" value={plant.quality} />
            </div>
          </div>
          <div className="grid min-w-[520px] flex-1 sm:grid-cols-3">
            {plant.zones.map((z) => (
              (() => {
                const summary = REFERENCE_ZONE_SUMMARIES[plant.zones.indexOf(z)] ?? z;
                return (
              <button
                key={z.id}
                type="button"
                onClick={() =>
                  navigate({
                    to: "/live/$plantId/$zoneId",
                    params: { plantId: plant.id, zoneId: z.id },
                  })
                }
                className="flex items-center gap-3 border-r border-border px-3 py-2.5 text-left transition-colors last:border-r-0 hover:bg-muted/50"
              >
                <Donut value={summary.oee} size={58} label={z.id} decimals={1} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs font-semibold">{z.name}</p>
                  <MetricBar label="A" value={summary.availability} />
                  <MetricBar label="P" value={summary.performance} />
                  <MetricBar label="Q" value={summary.quality} />
                </div>
              </button>
                );
              })()
            ))}
          </div>
          </div>
          <div className="min-w-0 border-t border-border xl:border-l xl:border-t-0">
            <div className="flex items-center justify-between px-3 py-2">
              <h2 className="text-xs font-semibold">Alarms</h2>
              <span className="text-[9px] text-muted-foreground">{occurring} occurring · {alarms.length - occurring} resolved</span>
            </div>
            <div className="max-h-24 overflow-auto">
              <table className="w-full text-[9px]">
                <thead className="text-left uppercase text-muted-foreground"><tr><th className="px-3 py-1">Line</th><th>Issue</th><th>Start</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>{alarms.slice(0, 4).map((a) => <tr key={a.id} className="border-t border-border/60"><td className="px-3 py-1 font-mono text-tier-bad">{a.lineId}</td><td className="max-w-24 truncate">{a.issue}</td><td>{a.start}</td><td className="font-mono">{a.durationMinutes}m</td><td className={a.status === "OCCURRING" ? "text-tier-bad" : "text-muted-foreground"}>{a.status}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>

        <Panel className="flex-1" action={<StatusLegend />} bodyClassName="relative p-0">
            <Compass />
            <ZoomableMap className="min-h-[380px] flex-1">
              <IsoScene viewBox="-260 15 520 280">
                <IsoGround cols={10.5} rows={8.5} s={34} />
                <IsoPlot x={0.35} y={0.35} w={9.8} d={7.8} s={34} fill="var(--map-plot)" />
                {plant.zones.map((z, zi) =>
                  z.lines.slice(0, 12).map((l, li) => {
                    const origin = ZONE_ORIGINS[zi] ?? ZONE_ORIGINS[0];
                    const x = origin.x + (li % 6) * 0.5;
                    const y = origin.y + Math.floor(li / 6) * 0.72;
                    return (
                      <IsoBlock
                        key={`${z.id}-${l.id}`}
                        x={x}
                        y={y}
                        w={2.25}
                        d={0.28}
                        h={10}
                        s={34}
                        color={STATUS_HEX[l.status]}
                        onClick={() =>
                          navigate({
                            to: "/live/$plantId/$zoneId",
                            params: { plantId: plant.id, zoneId: z.id },
                          })
                        }
                      />
                    );
                  }),
                )}
                {plant.zones.map((z, zi) => {
                  const label = ZONE_LABELS[zi] ?? ZONE_LABELS[0];
                  return (
                  <IsoChip
                    key={z.id}
                    x={label.x}
                    y={label.y}
                    s={34}
                    h={40}
                    label={z.name}
                    value={`${z.oee.toFixed(0)}%`}
                    color={TIER_HEX[zi === 1 ? "good" : "warn"]}
                    onClick={() => navigate({ to: "/live/$plantId/$zoneId", params: { plantId: plant.id, zoneId: z.id } })}
                  />
                )})}
              </IsoScene>
            </ZoomableMap>
        </Panel>
      </main>
    </div>
  );
}
