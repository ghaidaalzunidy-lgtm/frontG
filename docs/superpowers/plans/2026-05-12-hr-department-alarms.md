# HR Department Alarms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing backend `DepartmentAlarm` data (driven by admin-tunable `alarm_threshold_*` settings) into the HR dashboard so HR can see per-department severity rollups.

**Architecture:** Tiny backend change to include `department_name` in `GET /alarms/` (extract a shared dept-display helper, swap the existing HR critical-alerts endpoint to use it, then use it in the alarms endpoint). Frontend adds an API client function, translation keys, and one new card on the HR dashboard. Fetch-once-on-mount, no polling. Hide card when zero alarms.

**Tech Stack:** FastAPI + SQLAlchemy (backend), Next.js 16 / React 19 / Tailwind v4 / shadcn/ui (frontend). No automated test runner is configured in either repo — verification is via `curl` (backend) and manual browser testing (frontend), plus `npx tsc --noEmit` for type-checking.

**Companion spec:** `frontG/docs/superpowers/specs/2026-05-12-hr-department-alarms-design.md`

**Two-repo note:** This touches both `MOODLOOP-backedn/` (Phase A) and `frontG/` (Phase B). Each has its own `.git`. The parent workspace is not a git repo. Commit in the correct repo per task — every `git` command in this plan includes the `cd` so the working directory is unambiguous.

---

## Pre-flight

- [ ] **Step P1: Confirm both dev environments run**

```bash
cd /home/bahaa/Documents/ghaidaProject/MOODLOOP-backedn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

In another terminal:
```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
npm run dev
```

Expected: backend logs `Application startup complete` and frontend prints `Local: http://localhost:3000`. Leave both running for the rest of the plan.

- [ ] **Step P2: Confirm at least one DepartmentAlarm row exists in the DB**

Log in as an HR user via the frontend so a valid JWT lands in `localStorage["access_token"]`. Copy it (browser devtools → Application → Local Storage). Then:

```bash
TOKEN="<paste token>"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/alarms/trigger -X POST
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/alarms/ | python3 -m json.tool
```

Expected: at least one alarm object printed. If the array is empty, seed the DB so a department crosses `alarm_threshold_low` and re-run the trigger — without alarm data you cannot verify either phase.

> If `/alarms/trigger` is locked down for your environment, the daily scheduler in `app/main.py` will populate the table on its own cadence. Don't proceed until at least one row exists.

---

## Phase A — Backend (`MOODLOOP-backedn/`)

### Task 1: Extract shared department-display helper

**Files:**
- Create: `MOODLOOP-backedn/app/utils/dept_display.py`
- Modify: `MOODLOOP-backedn/app/routers/hr.py` (lines ~212-222 and the call site at ~250)

- [ ] **Step 1.1: Create the shared helper**

Create `MOODLOOP-backedn/app/utils/dept_display.py` with this exact content:

```python
"""Shared department name display helper.

Normalizes the enum-or-string department name and applies the human-readable
mapping (e.g. "Human Resources" → "HR") used in HR-facing responses.
Previously lived inline in app/routers/hr.py — extracted so other routers
(notably alarms.py) can render department names with the same rules.
"""

from app.models import Department


_DEPT_DISPLAY = {
    "Human Resources": "HR",
}


def dept_display(dept: Department | None) -> str | None:
    if dept is None:
        return None
    raw = dept.name.value if hasattr(dept.name, "value") else dept.name
    return _DEPT_DISPLAY.get(raw, raw)
```

- [ ] **Step 1.2: Swap `hr.py` to use the shared helper**

In `MOODLOOP-backedn/app/routers/hr.py`, **delete** the local helper block (the `_DEPT_DISPLAY` dict and `_dept_display(...)` function — approx. lines 212-222), and at the top of the file add the new import alongside the other `app.*` imports:

```python
from app.utils.dept_display import dept_display
```

Then replace the one call site (approx. line 250) inside `get_critical_alerts`:

```python
            "department_name": _dept_display(a.department),
```

with:

```python
            "department_name": dept_display(a.department),
```

- [ ] **Step 1.3: Verify the critical-alerts endpoint still works (regression check)**

With backend running (port 8000) and `$TOKEN` set:

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/hr/critical-alerts" | python3 -m json.tool | head -30
```

Expected: same response shape as before — each alert (if any) still has a `department_name` field. No 500. If the DB has no critical alerts yet, an empty array `[]` is the correct response.

- [ ] **Step 1.4: Commit (backend repo)**

```bash
cd /home/bahaa/Documents/ghaidaProject/MOODLOOP-backedn
git add app/utils/dept_display.py app/routers/hr.py
git commit -m "refactor: extract dept_display helper into shared util

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Include `department_name` in `GET /alarms/` + sort by severity

**Files:**
- Modify: `MOODLOOP-backedn/app/routers/alarms.py` (only `get_all_alarms`, lines 10-18)

- [ ] **Step 2.1: Replace `get_all_alarms` with the new shape**

In `MOODLOOP-backedn/app/routers/alarms.py`, update the imports at the top of the file. Replace:

```python
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.routers.users import get_current_user, hr_only
from app.utils.alarm import run_daily_alarm_check, calculate_department_alarm
```

with:

```python
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app import models, schemas
from app.routers.users import get_current_user, hr_only
from app.utils.alarm import run_daily_alarm_check, calculate_department_alarm
from app.utils.dept_display import dept_display
```

Then replace the entire `get_all_alarms` function (the block at approx. lines 10-18, starting with `# Get all active alarms (HR only)` and the `@router.get("/")` decorator):

```python
# Get all active alarms (HR only).
# Response is built manually (no response_model) so we can include the
# department display name without altering the AlarmResponse schema, which
# the other endpoints in this file still use.
@router.get("/")
def get_all_alarms(
    db: Session = Depends(get_db),
    current_user: models.Employee = Depends(hr_only),
):
    # Severity order — critical first, low last. Mapped to integers so the
    # SQLAlchemy ORDER BY works across both Postgres and SQLite during dev.
    severity_rank = {
        models.SeverityEnum.critical: 0,
        models.SeverityEnum.high:     1,
        models.SeverityEnum.medium:   2,
        models.SeverityEnum.low:      3,
    }

    alarms = (
        db.query(models.DepartmentAlarm)
        .options(joinedload(models.DepartmentAlarm.department))
        .all()
    )

    alarms.sort(key=lambda a: (severity_rank.get(a.severity, 99), -a.negative_ratio))

    return [
        {
            "alarm_id":        a.alarm_id,
            "department_id":   a.department_id,
            "department_name": dept_display(a.department),
            "severity":        a.severity.value if hasattr(a.severity, "value") else a.severity,
            "negative_ratio":  a.negative_ratio,
            "analyses_count":  a.analyses_count,
            "window_start":    a.window_start.isoformat() if a.window_start else None,
            "window_end":      a.window_end.isoformat()   if a.window_end   else None,
            "created_at":      a.created_at.isoformat()   if a.created_at   else None,
        }
        for a in alarms
    ]
```

Leave `get_alarms_by_severity`, `get_department_alarm`, and `trigger_alarm_check` unchanged — they keep using the existing `AlarmResponse` schema.

- [ ] **Step 2.2: Verify the new shape against a running backend**

The backend `--reload` flag picks up the change automatically. With `$TOKEN` set:

```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/alarms/ | python3 -m json.tool
```

Expected: an array of alarm objects, each containing **all** these keys: `alarm_id`, `department_id`, `department_name`, `severity`, `negative_ratio`, `analyses_count`, `window_start`, `window_end`, `created_at`. The first element should have the highest severity (critical > high > medium > low); within the same severity, the row with the higher `negative_ratio` should come first.

If `department_name` is missing, you forgot the import. If sorting looks wrong, recheck the `severity_rank` mapping. If you get a 500, run `tail -40` on the uvicorn output for the traceback.

- [ ] **Step 2.3: Commit (backend repo)**

```bash
cd /home/bahaa/Documents/ghaidaProject/MOODLOOP-backedn
git add app/routers/alarms.py
git commit -m "feat(alarms): include department_name and severity sort in GET /alarms/

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Phase B — Frontend (`frontG/`)

### Task 3: Add `DepartmentAlarm` type and fetcher to `lib/api.ts`

**Files:**
- Modify: `frontG/lib/api.ts` (insert after line 141 — right after `resolveCriticalAlert`, before the `// ── HR Profile ──` comment)

- [ ] **Step 3.1: Add the type and fetcher**

In `frontG/lib/api.ts`, find the block ending with `resolveCriticalAlert` (around line 141). Immediately **after** that function's closing `}` and **before** the `// ── HR Profile ──` section divider, insert:

```ts
// ── Department alarms (HR only) ──────────────────────────────
// Aggregated 7-day per-department severity rollups produced by the daily
// scheduler in MOODLOOP-backedn/app/utils/alarm.py. Backend gates the route
// hr_only; admins cannot read this without a backend change. The `message`
// column on the underlying table is intentionally NOT exposed here — it's
// English-only; the UI renders structured fields and localizes labels.
export interface DepartmentAlarm {
  alarm_id: number;
  department_id: number;
  department_name: string | null;
  severity: "low" | "medium" | "high" | "critical";
  negative_ratio: number;
  analyses_count: number;
  window_start: string | null;
  window_end: string | null;
  created_at: string | null;
}

export async function fetchDepartmentAlarms(): Promise<DepartmentAlarm[]> {
  const res = await fetch(`${BASE_URL}/alarms/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch department alarms");
  return res.json();
}
```

- [ ] **Step 3.2: Type-check**

```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
npx tsc --noEmit
```

Expected: same output as before your change (no new errors). The repo's `next build` ignores type errors per `next.config.mjs`, so `tsc --noEmit` is the real signal. If there are pre-existing errors unrelated to your edits, ignore them — focus only on whether your additions introduced new ones.

- [ ] **Step 3.3: Commit (frontend repo)**

```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
git add lib/api.ts
git commit -m "feat(api): add DepartmentAlarm type and fetcher

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Add translation keys

**Files:**
- Modify: `frontG/lib/app-context.tsx` (English block ends around line 356; Arabic block ends around line 495)

- [ ] **Step 4.1: Append keys to the English block**

In `frontG/lib/app-context.tsx`, find the English `loginFailures24h: "Login failures (24h)",` line (around line 355). Immediately **before** the closing `},` of the `en:` object (around line 356), insert these lines (preserve the existing trailing comma on the line above):

```ts
    // ── Department alarms (HR dashboard) ─────────────────────
    departmentAlarms:    "Department alarms",
    noActiveAlarms:      "No active department alarms",
    negativeLabel:       "negative",
    analysesLabel:       "analyses",
    last7Days:           "Last 7 days",
    severityLow:         "Low",
    severityMedium:      "Medium",
    severityHigh:        "High",
    severityCritical:    "Critical",
```

- [ ] **Step 4.2: Append matching keys to the Arabic block**

In the same file, find the Arabic `loginFailures24h: "محاولات الدخول الفاشلة (24س)",` line (around line 494). Immediately **before** the closing `},` of the `ar:` object (around line 495), insert:

```ts
    // ── تنبيهات الأقسام (لوحة الموارد البشرية) ─────────────────────
    departmentAlarms:    "تنبيهات الأقسام",
    noActiveAlarms:      "لا توجد تنبيهات نشطة",
    negativeLabel:       "سلبي",
    analysesLabel:       "تحليل",
    last7Days:           "آخر 7 أيام",
    severityLow:         "منخفض",
    severityMedium:      "متوسط",
    severityHigh:        "مرتفع",
    severityCritical:    "حرج",
```

> Arabic strings here are provisional. Flag them in the PR for an Arabic-speaking reviewer to confirm; the keys themselves must not change.

- [ ] **Step 4.3: Type-check**

```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
npx tsc --noEmit
```

Expected: no new errors. If TypeScript complains that `translations.en` and `translations.ar` have mismatched keys, you forgot one block — diff and align.

- [ ] **Step 4.4: Commit (frontend repo)**

```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
git add lib/app-context.tsx
git commit -m "feat(i18n): add department-alarm translation keys (en + ar)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Render the department-alarms card on the HR dashboard

**Files:**
- Modify: `frontG/components/hr-dashboard.tsx` (API import block at lines 4-18; `DashboardContent` state + `useEffect` around lines 118-148; insertion of new card around line 391, between the critical-alerts card and the "Department Comparison" card)

- [ ] **Step 5.1: Extend the API import block**

In `frontG/components/hr-dashboard.tsx`, replace the import block at lines 4-18:

```tsx
import {
  fetchStats,
  fetchDepartments,
  fetchMonthlyTrends,
  fetchMoodDistribution,
  fetchYearlyTrends,
  fetchCriticalAlerts,
  resolveCriticalAlert,
  type DepartmentData,
  type MonthlyData,
  type MoodData,
  type YearlyData,
  type StatsData,
  type CriticalAlert,
} from "@/lib/api";
```

with:

```tsx
import {
  fetchStats,
  fetchDepartments,
  fetchMonthlyTrends,
  fetchMoodDistribution,
  fetchYearlyTrends,
  fetchCriticalAlerts,
  resolveCriticalAlert,
  fetchDepartmentAlarms,
  type DepartmentData,
  type MonthlyData,
  type MoodData,
  type YearlyData,
  type StatsData,
  type CriticalAlert,
  type DepartmentAlarm,
} from "@/lib/api";
```

- [ ] **Step 5.2: Add state and fold the fetch into the existing `Promise.all`**

In `DashboardContent` (function starts around line 113), find the state block (around line 118-122):

```tsx
  const [statsData,   setStatsData]   = useState<StatsData | null>(null);
  const [alerts,      setAlerts]      = useState<CriticalAlert[]>([]);
  const [loading,     setLoading]     = useState(true);
```

Add an `alarms` state line immediately **after** the `alerts` line. The block becomes:

```tsx
  const [statsData,   setStatsData]   = useState<StatsData | null>(null);
  const [alerts,      setAlerts]      = useState<CriticalAlert[]>([]);
  const [alarms,      setAlarms]      = useState<DepartmentAlarm[]>([]);
  const [loading,     setLoading]     = useState(true);
```

Now find the `useEffect` immediately below (around lines 124-148). Replace its entire body:

```tsx
  useEffect(() => {
    async function loadAll() {
      try {
        const [stats, depts, monthly, mood, yearly, criticalAlerts] = await Promise.all([
          fetchStats(),
          fetchDepartments(),
          fetchMonthlyTrends(),
          fetchMoodDistribution(),
          fetchYearlyTrends(),
          fetchCriticalAlerts(),
        ]);
        setStatsData(stats);
        setDeptData(depts);
        setMonthlyData(monthly);
        setMoodData(mood);
        setYearlyData(yearly);
        setAlerts(criticalAlerts);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);
```

with:

```tsx
  useEffect(() => {
    async function loadAll() {
      try {
        const [stats, depts, monthly, mood, yearly, criticalAlerts, deptAlarms] = await Promise.all([
          fetchStats(),
          fetchDepartments(),
          fetchMonthlyTrends(),
          fetchMoodDistribution(),
          fetchYearlyTrends(),
          fetchCriticalAlerts(),
          fetchDepartmentAlarms(),
        ]);
        setStatsData(stats);
        setDeptData(depts);
        setMonthlyData(monthly);
        setMoodData(mood);
        setYearlyData(yearly);
        setAlerts(criticalAlerts);
        setAlarms(deptAlarms);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);
```

> **Error handling note:** matches the existing critical-alerts pattern — failures log to console and leave state at its initial `[]`. The card's `alarms.length === 0` guard (Step 5.4) then hides the section cleanly. We deliberately do NOT introduce a toast here even though the spec mentioned `addToast`; the current `useApp()` destructure in `DashboardContent` only pulls `language`, and adding toast plumbing would diverge from the established pattern in this component.

- [ ] **Step 5.3: Add the date and severity formatting helpers**

Still inside `DashboardContent`, **after** the existing `useEffect` closes (so before the `// ── Stats cards from real data ───` comment around line 150), insert these helpers:

```tsx
  // ── Department-alarm display helpers ─────────────────────
  const formatAlarmDate = (iso: string | null): string => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(language === "ar" ? "ar" : "en", {
      month: "short",
      day:   "numeric",
    });
  };

  const severityClasses = (s: DepartmentAlarm["severity"]): string => {
    // Per-row badge color. Distinct from the card's amber chrome (set on
    // the Card below). Red is reserved for the critical-keyword alerts card
    // — see comment in spec 2026-05-12-hr-department-alarms-design.md.
    switch (s) {
      case "critical": return "bg-red-600 hover:bg-red-700 text-white";
      case "high":     return "bg-orange-500 hover:bg-orange-600 text-white";
      case "medium":   return "bg-amber-500 hover:bg-amber-600 text-white";
      case "low":      return "bg-yellow-400 hover:bg-yellow-500 text-yellow-950";
    }
  };

  const severityLabel = (s: DepartmentAlarm["severity"]): string => {
    switch (s) {
      case "critical": return t.severityCritical;
      case "high":     return t.severityHigh;
      case "medium":   return t.severityMedium;
      case "low":      return t.severityLow;
    }
  };
```

- [ ] **Step 5.4: Insert the new card between critical-alerts and Department Comparison**

In the JSX, find the closing `</Card>` of the critical-keyword-alerts block (around line 391 — it's the `)}` directly closing the `{alerts.length > 0 && (` block). Immediately **after** that closing `)}` and **before** the `{/* Department Comparison */}` comment, insert:

```tsx
      {/* Department Alarms (sentiment-ratio rollups) */}
      {alarms.length > 0 && (
        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
              <CardTitle className="text-amber-700 dark:text-amber-400">
                {t.departmentAlarms}
              </CardTitle>
              <Badge variant="secondary" className="ml-1">
                {alarms.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alarms.map((alarm) => (
              <div
                key={alarm.alarm_id}
                className="rounded-xl border border-amber-200/60 bg-amber-50/40 dark:bg-amber-950/20 p-4"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {alarm.department_name ?? "—"}
                  </span>
                  <Badge className={`text-xs uppercase ${severityClasses(alarm.severity)}`}>
                    {severityLabel(alarm.severity)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {Math.round(alarm.negative_ratio * 100)}% {t.negativeLabel}
                  {" · "}
                  {alarm.analyses_count} {t.analysesLabel}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.last7Days} · {formatAlarmDate(alarm.window_start)} — {formatAlarmDate(alarm.window_end)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
```

`AlertTriangle`, `Badge`, `Card`, `CardContent`, `CardHeader`, `CardTitle` are already imported at the top of the file (verified at lines 29, 33, 34) — no new imports needed.

- [ ] **Step 5.5: Type-check**

```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
npx tsc --noEmit
```

Expected: no new errors. If the compiler reports `Property 'severityLow' does not exist on type ...`, double-check Task 4 added the keys to both `en` and `ar`.

- [ ] **Step 5.6: Manual browser verification — happy path**

With both servers running and the DB containing at least one alarm:

1. Open `http://localhost:3000`. Log in as an HR user.
2. You should land on the HR dashboard (the "dashboard" tab by default).
3. **Verify:** an amber-bordered "Department alarms" card appears between the existing red critical-alerts card (if any) and the "Department comparison" card.
4. **Verify:** each row shows department name, a severity badge with the right color (critical → red, high → orange, medium → amber, low → yellow), `XX% negative · N analyses`, and `Last 7 days · <date> — <date>`.
5. **Verify:** rows are ordered with the highest severity first.

- [ ] **Step 5.7: Manual browser verification — empty state**

Empty the `department_alarms` table or wait until no department crosses `alarm_threshold_low`. Reload the dashboard.

- **Verify:** the new card is completely **absent** (not a card with an empty body). The "Department comparison" card sits flush below the keyword-alerts card or below the stats grid.

- [ ] **Step 5.8: Manual browser verification — Arabic / RTL**

In the language toggle (header), switch to Arabic. Reload.

- **Verify:** the card heading reads "تنبيهات الأقسام", labels use the Arabic strings from Task 4, the layout is right-to-left correct (no truncated text, no visual overlap), severity badges still render with the right colors.

- [ ] **Step 5.9: Commit (frontend repo)**

```bash
cd /home/bahaa/Documents/ghaidaProject/frontG
git add components/hr-dashboard.tsx
git commit -m "feat(hr-dashboard): render department alarms card

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Final verification

- [ ] **Step F1: Cross-feature regression check**

In the HR dashboard, verify these still work as before (none of the changes should have touched them):

1. Stats cards at the top render real numbers.
2. The critical-keyword-alerts card (red, if any alerts exist) renders, including the "Mark resolved" button.
3. The "Department comparison" chart renders.
4. The "Monthly trends" and "Current mood distribution" charts render.

If any of these broke, the most likely cause is a missed brace/paren in `hr-dashboard.tsx`. Use `npx tsc --noEmit` and the browser console as the diagnostic.

- [ ] **Step F2: Confirm spec is satisfied**

Reread `frontG/docs/superpowers/specs/2026-05-12-hr-department-alarms-design.md` and tick off:

- Backend exposes `department_name` in `GET /alarms/` ✓ (Task 2)
- Backend sorts by severity then negative_ratio ✓ (Task 2)
- Shared `dept_display` helper extracted ✓ (Task 1)
- Frontend type + fetcher added ✓ (Task 3)
- Translation keys added in both languages ✓ (Task 4)
- HR dashboard renders the card with amber chrome, severity badges, hides when empty ✓ (Task 5)
- No polling, no admin visibility, no resolve action ✓ (out-of-scope items deliberately untouched)

---

## Rollback

Each task is one commit per repo. If a task goes wrong:

```bash
# Backend
cd /home/bahaa/Documents/ghaidaProject/MOODLOOP-backedn
git log --oneline -5
git revert <bad-commit-sha>

# Frontend
cd /home/bahaa/Documents/ghaidaProject/frontG
git log --oneline -5
git revert <bad-commit-sha>
```

Backend Task 1 (dept_display extraction) is the load-bearing prerequisite for backend Task 2 — if you revert Task 1, also revert Task 2 in the same go.
