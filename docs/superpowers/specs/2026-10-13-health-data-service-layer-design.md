# Health Data Service Layer – Design

**Ticket:** #64 Create Health Data Service Layer (story #61, Health Integration & Statistics). Also delivers #63, with Health Connect replacing Google Fit.
**Goal:** one platform-agnostic API for health data on iOS (Apple Health) and Android (Health Connect).

## Decisions

- **Android uses Health Connect, not Google Fit.** Google has deprecated the Google Fit API and is shutting it down. The `react-native-google-fit` README says so itself. `react-native-health-connect` v4.1.3 is maintained and ships its own Expo config plugin. Health Connect is built into Android 14+ and installable on Android 8–13.
- **Scope:** the unified interface plus both real providers (iOS refactor and new Android provider) and the mock provider.
- **Architecture:** provider interface, Metro platform files and one facade (approach A).
- **Metrics:** unchanged from #65: steps, walking/running distance (m), active energy (kcal), today's hourly steps, and 30 daily totals. Data refreshes on load or pull-to-refresh; "real-time" streaming is out of scope.

## Acceptance criteria → design

| Criterion | Design element |
|---|---|
| Single service interface works on both iOS and Android | `healthService` facade implementing the `HealthProvider` interface; the app imports only the facade |
| Platform detection is automatic | Metro platform files `providers/index.ios.ts` / `index.android.ts` / `index.ts` (web) pick the native provider at build time |
| Permissions requested through a unified API | `healthService.requestPermissions()` wraps `initHealthKit` (iOS) and `requestPermission` (Health Connect) |
| Data format is consistent across platforms | Every provider result passes through `normalize.ts`: 24 `HourlySteps`; N `HealthData` (metres, kcal, local-midnight dates, oldest first, zero-filled, whole numbers ≥ 0) |
| Error handling is standardized | One `HealthServiceError { code, platform, message, cause? }` with a fixed `HealthErrorCode` set; unknown errors are wrapped as `FETCH_FAILED` |
| TypeScript types are well-defined | `services/health/types.ts` exports all public types; no `any` in the public API |

## Structure (`frontend/services/health/`)

| File | Responsibility |
|---|---|
| `types.ts` | `HealthPlatform`, `HealthData`, `HourlySteps`, `HealthAvailability`, `HealthErrorCode`, `HealthServiceError`, `HealthProvider` |
| `normalize.ts` | `normalizeHourly(buckets, now)`, `normalizeDaily(buckets, days, now)`, `parseHealthDate`, `startOfDay` |
| `healthService.ts` | Facade: chooses the mock or native provider, caches the permission grant per session, normalises results, wraps errors |
| `providers/appleHealthProvider.ts` | HealthKit via `react-native-health`. Replaces `services/healthKitService.ts`. |
| `providers/healthConnectProvider.ts` | Health Connect via `react-native-health-connect` |
| `providers/mockProvider.ts` | Returns `generateMockHealth()` data |
| `providers/unsupportedProvider.ts` | Web: availability `unsupported` |
| `providers/index.ios.ts` / `index.android.ts` / `index.ts` | `export const nativeProvider` per platform |

### `HealthProvider` contract

```ts
interface HealthProvider {
  platform: HealthPlatform;            // 'apple-health' | 'health-connect' | 'mock' | 'unsupported'
  displayName: string;                 // "Apple Health" | "Health Connect" | "Demo data" | "Health data"
  getAvailability(): Promise<HealthAvailability>; // 'available' | 'notInstalled' | 'updateRequired' | 'unsupported'
  requestPermissions(): Promise<boolean>;
  getHourlySteps(now: Date): Promise<RawBucket[]>;                  // provider-native buckets
  getDailyStats(days: number, now: Date): Promise<RawDailyBucket[]>;
}
```

Providers return raw buckets: `{ start: Date; steps }` for hourly, and `{ start: Date; steps; distance; calories }` for daily. The facade normalises them, so providers stay thin and the output shape is guaranteed in one place.

### Facade API

```ts
healthService.platform / displayName
healthService.getAvailability(): Promise<HealthAvailability>
healthService.requestPermissions(): Promise<boolean>   // cached once granted
healthService.connect(): Promise<void>  // availability + permission check; throws the typed errors below
healthService.getHourlySteps(now?): Promise<HourlySteps[]>          // always 24 items
healthService.getDailyStats(days, now?): Promise<HealthData[]>      // always `days` items
healthService.openSettings(): Promise<void>  // iOS Settings or Health Connect settings
healthService.openInstallPage(): Promise<void> // Play Store page for Health Connect
```

**Mock mode:** used when `EXPO_PUBLIC_USE_MOCK_HEALTH !== "false"` (the default, so Expo Go works). Otherwise the facade uses the platform's native provider.

## Platform specifics

- **iOS:** the current `healthKitService` logic moves unchanged into `appleHealthProvider`:
  - `getDailyStepCountSamples` / `getDailyDistanceWalkingRunningSamples` / `getActiveEnergyBurned` with `period` 60 or 1440.
  - Availability: `Platform.OS === "ios"` and the native module exists.
- **Android:**
  - **Availability:** `getSdkStatus()`: `SDK_AVAILABLE` → `available`, `SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED` → `updateRequired`, `SDK_UNAVAILABLE` → `notInstalled`. `initialize()` is called before any other call.
  - **Permissions:** `requestPermission` with read access to `Steps`, `Distance` and `ActiveCaloriesBurned`. Granted if the result includes read `Steps`.
  - **Hourly:** `aggregateGroupByDuration` with `{ duration: 'HOURS', length: 1 }` over today.
  - **Daily:** `aggregateGroupByPeriod` with `{ period: 'DAYS', length: 1 }` over N days, using `COUNT_TOTAL`, `DISTANCE.inMeters` and `ACTIVE_CALORIES_TOTAL.inKilocalories`. Daily results come back as local date-times; hourly results come back as UTC instants. Both are parsed with `parseHealthDate`.
  - **Config (`app.json`):**
    - The `react-native-health-connect` plugin.
    - `expo-build-properties` with `android.minSdkVersion: 26`.
    - `android.permissions`: `android.permission.health.READ_STEPS`, `READ_DISTANCE`, `READ_ACTIVE_CALORIES_BURNED`.
- **Lockfile:** installing the library through the internal npm mirror writes `npm.apple.com` URLs into `package-lock.json`, which breaks CI. A `scripts/normalize-lockfile-registry.js` script rewrites them to `registry.npmjs.org`, and CI gets a step that fails with a clear message if any internal URL is left.

## Errors

| `HealthErrorCode` | Raised when | Hook status → screen |
|---|---|---|
| `UNSUPPORTED_PLATFORM` | availability `unsupported` | `unavailable` → "{displayName} isn't available here" |
| `NOT_INSTALLED` | Health Connect missing | `notInstalled` → "Install Health Connect" (Play Store) |
| `UPDATE_REQUIRED` | Health Connect outdated | `notInstalled` → "Update Health Connect" (Play Store) |
| `PERMISSION_DENIED` | permission not granted | `denied` → "Open Settings" via `healthService.openSettings()` |
| `NOT_INITIALIZED` | data read before permission | `error` |
| `FETCH_FAILED` | native query failed or unknown error | `error` → Retry |
| `INVALID_RANGE` | `days <= 0` | `error` |

`useHealthData` maps `HealthServiceError.code` to its status. Screen copy uses `healthService.displayName` instead of the hard-coded "Apple Health" text in `EmptyState`, `ErrorState` and `StatisticsHeader`.

## Testing (Jest)

- `services/health/__test__/normalize.test.ts`: zero-fill, sort, rounding, out-of-range buckets ignored, negative values clamped, both date formats.
- `services/health/__test__/appleHealthProvider.test.ts`: ported from `healthKitService.test.ts`.
- `services/health/__test__/healthConnectProvider.test.ts`: `react-native-health-connect` mocked. Availability mapping, permission results, hourly/daily requests and mapping, failure → `FETCH_FAILED`.
- `services/health/__test__/healthService.test.ts`: mock vs native selection, permission caching, normalisation applied, unknown error wrapped, `days <= 0` → `INVALID_RANGE`.
- `hooks/__test__/useHealthData.test.ts`: updated to mock `healthService`. Adds the `notInstalled` status.
- `components/Statistics/__test__/States.test.tsx` and `screens/__test__/StatisticsScreen.test.tsx`: install action and provider-specific copy.
- **Manual:** an Android dev build with Health Connect (emulator or device) and an iOS dev build. This can't run in this environment.
