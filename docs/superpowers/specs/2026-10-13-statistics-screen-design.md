# Statistics Screen UI – Design

**Ticket:** #65 Design Statistics Screen UI
**Scope:** Apple Health metrics (steps, distance, calories) with Day / Week / Month views. WalkIt walk history is a separate ticket.

## Acceptance criteria → design

| Criterion | Design element |
|---|---|
| Clean, modern design | Paper-themed cards using brand colours; works in light and dark mode |
| Today's stats prominent | Hero card: step count + progress toward 10,000-step goal; distance & calorie cards |
| Daily/Weekly/Monthly tabs | Paper `SegmentedButtons` → Day (hourly bars), Week (7 bars + goal line), Month (30-day line) |
| Progress/trend indicators | Goal progress bar; ▲/▼ trend chips vs yesterday; insights (average, best day, active days, streak) |
| Pull-to-refresh | `RefreshControl` on the screen's ScrollView via a new `ScreenContainer.refreshControl` prop |
| Smooth loading | Themed skeleton with a pulsing opacity animation on first load; refreshes keep content visible |
| Informative empty states | Per-view empty message inside the chart card; full-screen empty state only when 30 days have no data |
| Responsive layout | Charts measure their container (`onLayout`) and fit bar width/spacing to it; no fixed widths |

## Data

- **`services/healthKitService.ts`**
  - `getHourlySteps(date)`: `getDailyStepCountSamples` with `period: 60`. Returns 24 zero-filled `{hour, steps}` buckets.
  - `getDailyStats(days)`: daily-sample APIs with `period: 1440` for steps, distance and energy (3 calls in total, instead of 3 per day). Returns zero-filled `HealthData[]`, oldest first.
  - `isAvailable()` also checks that the native module exists, so it's false in Expo Go and on web.
- **`utils/healthStats.ts`** (pure functions):
  - `summarize(days)` → `{ totalSteps, totalDistance, totalCalories, averageSteps, averageDistance, averageCalories, activeDays, bestDay }`, or `null` for an empty input.
  - `percentChange(current, previous)` → `number | null`. Returns `null` when `previous` is 0.
  - `currentStreak(days, threshold)`: consecutive days at or above the threshold, counting back from the newest day.
  - Constants: `DAILY_STEP_GOAL = 10000`, `ACTIVE_DAY_STEPS = 5000`.
- **`hooks/useHealthData.ts`** returns:
  `{ status, error, today, yesterday, hourly, week, month, weekSummary, monthSummary, trends, streak, refreshing, lastUpdated, refresh }`
  - `status`: `'loading' | 'ready' | 'unavailable' | 'denied' | 'error'`.
  - **Denied:** iOS never reports denied *read* access (it returns empty data), so `denied` only comes from an `initHealthKit` error. The denied screen's button opens Settings directly; the hook needs no `requestPermission`.
  - **Mock data:** lives in `utils/mockHealthData.ts`.
  - **Chart sizing:** helpers live in `components/Statistics/chartLayout.ts` and are unit-tested.
  - **Mock mode:** `EXPO_PUBLIC_USE_MOCK_HEALTH !== 'false'` (on by default). Mock data is generated once per refresh with a seeded, realistic hourly curve. It is never regenerated on render.
  - Permission is requested once per session; later refreshes only fetch.
  - `week` is the last 7 days of `month`, and `today` is the last day of `month`.

## UI components (`components/Statistics/`)

| Component | Purpose |
|---|---|
| `StatisticsHeader` | Title and "Updated x ago" (from `lastUpdated`). The refresh button is removed. |
| `TodayCard` | Steps hero, goal `ProgressBar`, trend chip |
| `MetricCard` | Small card: icon, value, label, optional trend chip (distance, calories) |
| `TrendChip` | ▲ green / ▼ orange / – neutral; hidden when the trend is `null` |
| `ChartCard` | Card wrapper with a title and an empty-state slot; measures its width with `onLayout` |
| `DailyChart` / `WeeklyChart` / `MonthlyChart` | Take a `width` prop; theme colours; all-zero data handled safely |
| `InsightsRow` | Average, best day, active days, streak for the week/month summary |
| `LoadingState` | Themed, animated skeleton |
| `EmptyState` | Full-screen empty state with a tip and Refresh button |
| `ErrorState` | Variants: `denied` (Open Settings), `unavailable` (iOS only), `error` (Retry) |

`StatisticsScreen` composes these components. It decides between the loading, error, empty and content layouts based on `status`.

## Error handling

| Situation | Behaviour |
|---|---|
| Not iOS / Expo Go without the mock | `unavailable` state |
| Permission denied | `denied` state, with a button that opens iOS Settings |
| Fetch failure | `error` state with Retry. Data from the previous successful load stays visible during later refreshes. |
| Zero data for a view | Empty message inside that chart card |

## Testing (Jest)

- `utils/__test__/healthStats.test.ts`: summaries, percent change with zeros, streak edge cases.
- `components/Statistics/__test__/chartLayout.test.ts`: bars and line fit the container width at 320, 390 and 1024 px; nice maximum values.
- `hooks/__test__/useHealthData.test.ts`: mock mode reaches `ready`; real mode with mocked `healthKitService` covers `unavailable`, `denied`, `error` and `ready`; `refresh` toggles `refreshing`.
- `screens/__test__/StatisticsScreen.test.tsx`: renders the loading, empty and ready states; switching views shows the matching chart title. `react-native-gifted-charts` is mocked.
