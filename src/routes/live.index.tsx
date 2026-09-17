import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Compass, IsoBlock, IsoChip, IsoGround, IsoPlot, IsoRoad, IsoScene, IsoTree, ZoomableMap } from "@/components/oee/iso";
import { Donut, MetricBar, PageHeader, Panel } from "@/components/oee/ui";
import { TIER_HEX, tierOf } from "@/lib/oee/config";
import { GROUP, PLANTS } from "@/lib/oee/data";
import type { PeriodId } from "@/lib/oee/filters";

const PLANT_POSITIONS = [
  { x: 2.1, y: 7.2, w: 2.1, d: 1.6, h: 55 },
  { x: 6.8, y: 1.1, w: 2.9, d: 2.1, h: 74 },
  { x: 6.7, y: 6.9, w: 2.4, d: 1.8, h: 58 },
] as const;

export const Route = createFileRoute("/live/")({
  head: () => ({
    meta: [
      { title: "Multi Plant View — Live Monitor" },
      {
        name: "description",
        content: "Group level live monitor: OEE per plant on an isometric site map, drill into any plant.",
      },
      { property: "og:title", content: "Multi Plant View — Live Monitor" },
      { property: "og:description", content: "Group level live monitor with OEE per plant." },
    ],
  }),
  component: MultiPlantView,
});

function MultiPlantView() {
  const [period, setPeriod] = useState<PeriodId>("live");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <PageHeader
        title="Multi Plant View"
        crumbs={[{ label: "Kemas", to: "/" }, { label: "Multi Plant" }]}
        period={period}
        onPeriod={setPeriod}
        meta="Week 32 · 05-Aug 14:22"
      />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex min-h-28 flex-wrap items-stretch overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-4 border-r border-border px-4 py-3">
            <Donut value={79.2} size={88} label="Group OEE" />
            <div className="grid w-44 gap-1.5">
              <p className="text-[9px] font-semibold uppercase text-muted-foreground">Group</p>
              <MetricBar label="Avail" value={GROUP.availability} />
              <MetricBar label="Perf" value={GROUP.performance} />
              <MetricBar label="Qual" value={GROUP.quality} />
            </div>
          </div>
          <div className="grid flex-1 sm:grid-cols-3">
            {PLANTS.map((p, index) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate({ to: "/live/$plantId", params: { plantId: p.id } })}
                className="flex items-center gap-3 border-r border-border px-4 py-3 text-left transition-colors last:border-r-0 hover:bg-muted/50"
              >
                <Donut value={[77, 77.3, 82.6][index] ?? p.oee} size={58} label={p.id} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs font-semibold">{p.name}</p>
                  <MetricBar label="A" value={p.availability} />
                  <MetricBar label="P" value={p.performance} />
                  <MetricBar label="Q" value={p.quality} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <Panel
          className="flex-1"
          bodyClassName="relative p-0"
        >
          <Compass />
          <ZoomableMap className="min-h-[420px] flex-1">
            <IsoScene viewBox="-315 -185 630 450">
              <IsoGround cols={11} rows={10} s={34} />
              <IsoPlot x={0.5} y={0.6} w={4.1} d={4.4} s={34} fill="var(--map-green)" />
              <IsoPlot x={6.2} y={0.5} w={4.1} d={3.1} s={34} />
              <IsoPlot x={6.2} y={4} w={4.1} d={2.5} s={34} />
              <IsoPlot x={0.6} y={6.7} w={3.6} d={2.3} s={34} />
              <IsoPlot x={5.1} y={6.7} w={5.2} d={2.3} s={34} />
              <IsoRoad x={4.65} y={0.2} w={0.72} d={9.3} s={34} />
              <IsoRoad x={0.2} y={5.35} w={10.3} d={0.72} s={34} />
              {[1.1, 1.8, 2.6, 3.4, 4.2].map((x) => [1.3, 2.3, 3.5].map((y) => <IsoTree key={`${x}-${y}`} x={x} y={y} s={34} />))}
              {PLANTS.map((p, i) => {
                const tier = tierOf(p.oee);
                const pos = PLANT_POSITIONS[i] ?? PLANT_POSITIONS[0];
                const value = [77, 77.3, 82.6][i] ?? p.oee;
                return (
                  <g key={p.id}>
                    <IsoPlot x={pos.x - 0.18} y={pos.y - 0.18} w={pos.w + 0.36} d={pos.d + 0.36} s={34} fill="var(--surface)" stroke={TIER_HEX[tier]} />
                    <IsoBlock
                      x={pos.x}
                      y={pos.y}
                      w={pos.w}
                      d={pos.d}
                      h={pos.h}
                      s={34}
                      color="var(--machine-frame)"
                      stroke={TIER_HEX[tier]}
                      onClick={() => navigate({ to: "/live/$plantId", params: { plantId: p.id } })}
                    />
                    <IsoChip
                      x={pos.x + pos.w / 2}
                      y={pos.y + pos.d / 2}
                      s={34}
                      h={pos.h + 22}
                      label={p.id}
                      value={`${value.toFixed(1)}%`}
                      color={TIER_HEX[tier]}
                      onClick={() => navigate({ to: "/live/$plantId", params: { plantId: p.id } })}
                    />
                  </g>
                );
              })}
            </IsoScene>
          </ZoomableMap>
        </Panel>
      </main>
    </div>
  );
}
