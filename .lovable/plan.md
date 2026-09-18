# MES Actionability Roadmap — Next Features for the OEE Dashboard

Goal: move the dashboard from "monitoring" to "daily operations tool" for Shift Leaders and Section Heads. All features remain frontend-only with deterministic mock data, consistent with the prototype.

## Phase 1 — Shift Leader daily workflow (highest value)

1. **Shift context bar (global)**
   - Current shift indicator (Shift 1/2/3, shift end countdown) in the header.
   - "Current shift vs. previous shift" toggle on Analytics and Live views, comparing OEE/A/P/Q side by side.

2. **Target pacing ("Are we on track?")**
   - On Line Detail and Zone view: actual output vs. expected-to-this-minute line, projected end-of-shift output, and a variance badge (ahead/on track/behind).
   - Mock: derive expected pace from `stdSpeed * elapsedMinutes`, vary per line via seeded rng.

3. **Alarm acknowledgement workflow (read-only demo of the flow)**
   - Alarm states: Occurring → Acknowledged → Resolved, with ack timestamp and "acknowledged by".
   - Acknowledge button on alarms in Plant/Zone/Line views (prototype: updates local state only, resets on reload — no persistence needed for UAT).
   - Escalation rule demo: down > 15 min unacknowledged shows an "Escalated" badge visible in Section Head's multi-plant view.

4. **Top losses since shift start**
   - Compact panel on Zone and Line views: top 3 downtime reasons this shift with minutes and operator-entered reason text (mocked), linking into Loss Tree filtered to that category.

## Phase 2 — Section Head & control tower polish

5. **Andon glanceability**
   - New critical alarm triggers a brief color flash on the sidebar Live Monitor item and an optional subtle chime (toggleable in settings).
   - KPI cards get 7-day sparklines so trends are visible without opening Analytics.

6. **Shift handover summary (Section Head)**
   - One-page end-of-shift summary: per-zone OEE, top 3 losses, unresolved alarms, output vs. target — printable-friendly layout.

7. **Downtime reason analytics**
   - Loss Tree gains a "reason text" level (operator comments, mocked) under Level 2, and Pareto can rank by reason frequency.

## Technical notes

- All new data extends the seeded generators in `src/lib/oee/data.ts` (new keys, no changes to existing values, so current screens are untouched).
- Alarm ack state lives in `app-context.tsx` (in-memory only) — explicitly demo-only for UAT.
- Pacing math stays in `config.ts`-adjacent helpers; thresholds remain centralized.
- Charts keep the full-height ResponsiveContainer pattern already in place.
- Each new panel gets loading/empty states per existing filter rules ("Tidak ada data untuk kombinasi filter ini").

## Suggested order

Phase 1 items 1–4 first (direct Shift Leader value), then Phase 2. Each item is independently shippable and demoable.
