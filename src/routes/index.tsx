import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, BarChart3, Users } from "lucide-react";

import { Donut, PageHeader, Panel } from "@/components/oee/ui";
import { useApp } from "@/lib/oee/app-context";
import { DEFAULT_PLANT_ID, DEFAULT_ZONE_ID, GROUP, PLANTS } from "@/lib/oee/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OEE FRO Dashboard — Prototype Home" },
      {
        name: "description",
        content:
          "Entry point for the clickable OEE FRO dashboard prototype: live monitor drill-down and OEE analytics for Shift Leader and Section Head.",
      },
      { property: "og:title", content: "OEE FRO Dashboard — Prototype Home" },
      {
        property: "og:description",
        content: "Live monitor drill-down and OEE analytics prototype for Shift Leader and Section Head.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { role } = useApp();
  const isSection = role === "section-head";

  const entries = [
    {
      icon: Activity,
      title: isSection ? "Live Monitor — Multi Plant View" : "Live Monitor — Zone View",
      body: isSection
        ? "Multi Plant → Plant → Zone → Line → Machine drill-down."
        : "Your zone home: production floor map, line detail, machine detail.",
      to: isSection ? "/live" : "/live/$plantId/$zoneId",
      params: isSection ? undefined : { plantId: DEFAULT_PLANT_ID, zoneId: DEFAULT_ZONE_ID },
    },
    {
      icon: BarChart3,
      title: isSection ? "Section Head Dashboard — OEE Analytics" : "Shift Leader Dashboard — OEE Analytics",
      body: "Trend, comparison, OEE by line → loss anatomy → root cause pareto.",
      to: "/analytics",
      params: undefined,
    },
    {
      icon: Users,
      title: "Shift Performance",
      body: isSection
        ? "OPE by Shift Leader, weekly performance, operator ranking (low priority / bonus)."
        : "Section Head only — switch role to open.",
      to: "/shift-performance",
      params: undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PageHeader title="OEE FRO Dashboard" crumbs={[{ label: "Kemas" }, { label: "Prototype" }]} meta="Week 32 · Mock data" />
      <main className="mx-auto max-w-6xl space-y-4 p-4">
        <Panel title="Group snapshot" subtitle="Simple average across plants (prototype formula)">
          <div className="flex flex-wrap items-center gap-6">
            <Donut value={GROUP.oee} size={104} label="Group OEE" />
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
              {PLANTS.map((p) => (
                <Link
                  key={p.id}
                  to="/live/$plantId"
                  params={{ plantId: p.id }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 hover:border-primary"
                >
                  <Donut value={p.oee} size={52} label={p.id} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{p.name}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      A {p.availability.toFixed(0)} · P {p.performance.toFixed(0)} · Q{" "}
                      {p.quality.toFixed(0)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-3">
          {entries.map((e) => (
            <Link
              key={e.title}
              to={e.to}
              params={e.params as never}
              className="group flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
            >
              <e.icon className="size-5 text-primary" />
              <h2 className="text-sm font-semibold">{e.title}</h2>
              <p className="text-[11px] text-muted-foreground">{e.body}</p>
              <span className="mt-auto text-[11px] font-medium text-primary group-hover:underline">
                Open →
              </span>
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Read-only prototype with mock data. Use the role switcher in the sidebar to demo Shift Leader
          vs Section Head.
        </p>
      </main>
    </div>
  );
}
