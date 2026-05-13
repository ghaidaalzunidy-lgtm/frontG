# HR Department Alarms — Frontend Wiring

**Date:** 2026-05-12
**Status:** Design approved, pending implementation
**Spans repos:** `frontG/` (frontend) and `MOODLOOP-backedn/` (backend)

## Problem

The four `alarm_threshold_*` system settings are admin-tunable and fully wired
end-to-end on the backend: a daily scheduled job in `app/utils/alarm.py`
classifies every department's 7-day negative-sentiment ratio into a severity
bucket (`low | medium | high | critical`) and writes a `DepartmentAlarm` row.
The `/alarms/*` endpoints (`app/routers/alarms.py`) expose these rows,
gated `hr_only`.

**Nothing on the frontend ever calls those endpoints.** Tuning the thresholds
in the admin settings panel changes DB rows that no UI surfaces. HR has no
view of department-level severity — only per-individual keyword crisis alerts,
which are a separate pathway.

This spec wires up display of the existing `DepartmentAlarm` data on the HR
dashboard.

## Audience and scope

- **Audience:** HR users only. Matches the existing backend `hr_only` gate on
  `/alarms/*`. Admin visibility is explicitly out of scope.
- **Mount point:** the existing "dashboard" tab of `components/hr-dashboard.tsx`,
  alongside the existing critical-keyword alerts card.
- **Lifecycle:** display only. No resolve / dismiss / edit. The scheduled job
  in `app/main.py` deletes and recreates rows daily (`app/utils/alarm.py:77–79`),
  so there is no per-row state for HR to manage.

## Non-goals

- Showing department alarms to admins (`/alarms/*` stays HR-only).
- Resolve / dismiss action.
- Polling or live auto-refresh.
- Historical alarm timeline. The `department_alarms` table only holds the
  current per-department row (overwritten on each scheduler run).
- Any change to the threshold values themselves or to how alarms are calculated.

## Backend changes (`MOODLOOP-backedn/`)

The minimal change is to include `department_name` in the response of
`GET /alarms/`, so the frontend can render rows without a second round-trip.
The response shape today only carries `department_id`.

### Files

1. **New: `app/utils/dept_display.py`** (~10 lines)
   - Extract the existing `_dept_display(dept)` and `_DEPT_DISPLAY` mapping
     currently inlined in `app/routers/hr.py` (~line 220) into a shared util.
     This helper normalizes enum names and applies the human-readable
     display mapping (used today for the critical-alerts response).
   - Export as `dept_display(dept) -> str`.

2. **Modify: `app/routers/hr.py`**
   - Import-only swap: replace the inline `_dept_display` with the new
     shared helper. No behavior change.

3. **Modify: `app/routers/alarms.py`** (~15 lines changed)
   - `GET /alarms/`: drop `response_model=list[AlarmResponse]`, build dicts
     manually, eager-load the department relationship with
     `joinedload(DepartmentAlarm.department)`, and include `department_name`
     via the shared helper. Sort by severity (critical → low) then by
     `negative_ratio desc` so the worst departments surface first.
   - Per-row response shape:
     ```python
     {
         "alarm_id":        a.alarm_id,
         "department_id":   a.department_id,
         "department_name": dept_display(a.department),
         "severity":        a.severity.value,
         "negative_ratio":  a.negative_ratio,
         "analyses_count":  a.analyses_count,
         "window_start":    a.window_start.isoformat(),
         "window_end":      a.window_end.isoformat(),
         "created_at":      a.created_at.isoformat() if a.created_at else None,
     }
     ```
   - The legacy `message` string field is intentionally dropped from this
     response — it's English-only and the frontend renders structured fields
     so it can localize. The DB column stays untouched.
   - `GET /alarms/severity/{severity}` and `GET /alarms/department/{id}`:
     leave unchanged for this pass. The new HR card only uses `GET /alarms/`.

### What is NOT touched on the backend

- `app/utils/alarm.py` — calculation logic.
- `app/utils/settings_store.py` — threshold definitions.
- `app/main.py` scheduler.
- `AlarmResponse` schema in `app/schemas.py` — the unused endpoints still
  reference it, so it stays.

## Frontend changes (`frontG/`)

### 1. `lib/api.ts`

Add the type and the fetcher:

```ts
export interface DepartmentAlarm {
  alarm_id: number;
  department_id: number;
  department_name: string;
  severity: "low" | "medium" | "high" | "critical";
  negative_ratio: number;
  analyses_count: number;
  window_start: string;
  window_end: string;
  created_at: string | null;
}

export async function fetchDepartmentAlarms(): Promise<DepartmentAlarm[]> {
  const res = await fetch(`${BASE_URL}/alarms/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch department alarms");
  return res.json();
}
```

Match the file's existing style (no `/api/` prefix here — the alarms router
uses `/alarms/*` not `/api/alarms/*`).

### 2. `lib/app-context.tsx`

Add to both `translations.en` and `translations.ar`:

| Key | English | Arabic |
|---|---|---|
| `departmentAlarms` | "Department alarms" | "تنبيهات الأقسام" |
| `negativeLabel` | "negative" | "سلبي" |
| `analysesLabel` | "analyses" | "تحليل" |
| `noActiveAlarms` | "No active department alarms" | "لا توجد تنبيهات نشطة" |
| `severityLow` | "Low" | "منخفض" |
| `severityMedium` | "Medium" | "متوسط" |
| `severityHigh` | "High" | "مرتفع" |
| `severityCritical` | "Critical" | "حرج" |
| `last7Days` | "Last 7 days" | "آخر 7 أيام" |

(Arabic strings are provisional and should be confirmed by an Arabic-speaking
reviewer during implementation.)

### 3. `components/hr-dashboard.tsx`

- **Fetch wiring** (~line 126–140): inside the existing `useEffect` in
  `DashboardContent`, add `fetchDepartmentAlarms()` to the same `Promise.all`
  used today for critical alerts. Add `alarms` state via `useState<DepartmentAlarm[]>([])`.
- **New card** inserted immediately *after* the critical-alerts card and
  *before* the "Department comparison" card (around line 391). Hide the
  whole card when `alarms.length === 0` — mirrors the
  `alerts.length > 0 &&` pattern already used for keyword alerts.
- **Card chrome:** amber accent on the card border / header (the red slot is
  owned by per-employee keyword alerts, which are higher-urgency individual
  signals; department alarms are aggregated rollups).
- **Per row:**
  - Department name (bold).
  - Severity badge, colored by severity (badge color, distinct from card
    chrome above):
    - critical → red
    - high → orange
    - medium → amber
    - low → yellow
  - `${Math.round(negative_ratio * 100)}% ${t.negativeLabel} · ${analyses_count} ${t.analysesLabel}`
    (string interpolation at render time; `translations` is a flat string
    map with no built-in placeholder substitution, so labels stay short.)
  - `${t.last7Days} · ${fmt(window_start)} — ${fmt(window_end)}`
- Rows are already sorted by the backend (severity desc, then ratio desc), so
  no client-side sort.

## Data flow

```
admin tunes threshold ───▶ system_settings table
                              │
                              ▼
       daily scheduler ──▶ alarm.py calculate_department_alarm
                              │  (reads thresholds, computes negative_ratio,
                              │   writes/overwrites department_alarms row)
                              ▼
                       department_alarms table
                              │
       HR opens dashboard ──▶ GET /alarms/  (NEW: includes department_name)
                              │
                              ▼
                       hr-dashboard.tsx renders alarm card
```

## K-anonymity interaction

The alarm calculator already enforces the K-anonymity floor
(`alarm.py:24–35`): if a department has fewer distinct reflecting employees
than `alarm_k_anonymity_floor` in the window, no `DepartmentAlarm` row is
written. The new HR card therefore inherits this protection by construction —
small departments simply won't appear in the list. Matches the cross-cutting
guidance in the workspace `CLAUDE.md`: "Any HR/admin UI displaying
per-department data must handle empty/null responses gracefully rather than
crash." Hiding the card when `alarms.length === 0` satisfies this.

## Error handling

- Network / 401 / 5xx from `GET /alarms/`: catch in the same `Promise.all`
  handler that already covers `fetchCriticalAlerts`. Surface via the
  existing toast (`useApp().addToast`). State stays at its `[]` initial
  value, so the card hides via the `alarms.length === 0` guard — no crash,
  no broken layout.
- Unknown severity value from backend: TypeScript narrows to the literal
  union; if the backend ever emits a new severity, the badge falls through to
  a neutral default rather than crashing. (Will add a small mapping object so
  the fallback is explicit, not implicit.)

## Testing

The repo has no test runner configured. Manual verification:

1. Backend: seed data so at least one department crosses
   `alarm_threshold_low`. Hit `GET /alarms/` directly and confirm the response
   includes `department_name`, is sorted, and works for both
   anonymity-passing and anonymity-failing departments.
2. Frontend: log in as HR. Confirm the card renders when alarms exist, is
   hidden when none exist, severity badges are correctly colored, the layout
   is RTL-correct under Arabic, and percentages round to whole numbers.
3. Cross-check the existing keyword-alerts card still renders unchanged.

`npx tsc --noEmit` should be clean (the frontend's `next build` ignores type
errors per `next.config.mjs`).

## File footprint

```
MOODLOOP-backedn/
  app/utils/dept_display.py        NEW    ~10 lines
  app/routers/hr.py                 MOD    import swap, ~3 lines
  app/routers/alarms.py             MOD    ~15 lines changed (GET / only)

frontG/
  lib/api.ts                        MOD    +~25 lines
  lib/app-context.tsx               MOD    +9 keys × 2 languages
  components/hr-dashboard.tsx       MOD    +~80 lines (fetch + new card)
```

## Open questions (resolved during brainstorming)

- *Backend reach:* including `department_name` in the response was chosen
  over parsing the pre-formatted `message` string (fragile) or adding a
  separate HR-facing department-list endpoint (more surface area). The
  precedent — `/api/hr/critical-alerts` building dicts with `department_name`
  inline — is matched exactly.
- *Polling:* deliberately omitted. The scheduler runs daily; intra-day
  refresh would not surface new data. Add later if the scheduler frequency
  changes.
