# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WalkIt is a React Native walking planner application that generates walking routes based on user preferences. The project consists of a Node.js Express backend and an Expo React Native frontend.

## Architecture

### Backend (Node.js + Express + MongoDB)
- **Location**: `backend/`
- **Entry Point**: `src/server.js` (starts server on port 4000)
- **Architecture Pattern**: MVC with service layer
  - `models/`: Mongoose schemas (User, Route)
  - `controllers/`: Request handlers for API endpoints
  - `routes/`: Express route definitions (auth, users, routes)
  - `services/`: Business logic including route generation
  - `middleware/`: Authentication and request processing
  - `config/`: Database connection, environment, and Swagger setup
  - `tests/`: Vitest test files organized by feature

### Frontend (React Native + Expo)
- **Location**: `frontend/`
- **Router**: Expo Router (file-based routing)
- **Architecture**:
  - `app/`: File-based routing structure
    - `(auth)/`: Authentication screens (login, registration)
    - `(app)/`: Main app screens (home, statistics, settings)
    - `_layout.tsx`: Root layout with providers
  - `components/`: Reusable UI components organized by feature (WalkPlanner, Statistics, Settings, Navigation, Inputs)
  - `context/`: React Context providers (AuthProvider for authentication state)
  - `services/`: API clients and platform integrations (authApi, routeService, GooglePlacesService, `health/` health data layer)
  - `hooks/`: Custom React hooks (useHealthData for health data on iOS and Android)
  - `types/`: TypeScript type definitions
  - `theme/`: React Native Paper theme configuration
  - `utils/`: Utility functions (storage, userStorage for SecureStore)
  - `screens/`: Screen components (ActiveWalkScreen, StatisticsScreen)

### Key Technical Details

**Authentication Flow**:
- JWT-based authentication managed by AuthProvider context
- Tokens stored in Expo SecureStore (via `utils/storage.ts`)
- User data cached in `utils/userStorage.ts`
- Backend uses bcryptjs for password hashing and jsonwebtoken for token generation

**Route Generation**:
- Located in `backend/src/services/routeService.js`
- Supports circular and point-to-point routes
- Integrates with OpenRouteService API for routing
- Uses OSM Overpass API for preference-based POI filtering (via `osmOverpassService.js`)
- Circular route algorithm in `circularRouteGenerator.js`

**Health Data (iOS HealthKit / Android Health Connect)**:
- Lives in `services/health/`: the `healthService` facade picks the platform provider, normalises the data and reports failures as `HealthServiceError`; `hooks/useHealthData.ts` consumes it
- Providers in `services/health/providers/`: Apple Health (iOS, `react-native-health`), Health Connect (Android, `react-native-health-connect`, loaded lazily) and a mock provider; Metro platform files `index.ios.ts` / `index.android.ts` / `index.ts` select the native one
- iOS: permissions configured in `app.json` (NSHealthShareUsageDescription, NSHealthUpdateUsageDescription) plus HealthKit entitlements
- Android: `react-native-health-connect` Expo plugin, `minSdkVersion` 26 via `expo-build-properties`, and the three `android.permission.health.READ_*` permissions (steps, distance, active calories) in `app.json`
- Health Connect must be installed on Android 8-13 (built into Android 14+)
- Neither works in Expo Go (mock data is used there)

**Maps & Location**:
- `react-native-maps` for map display
- `expo-location` for location services
- Google Places API for location search and autocomplete (via `services/GooglePlacesService.ts`)

## Development Commands

### Backend
```bash
cd backend
npm i                     # Install dependencies
npm run dev              # Start development server with nodemon (port 4000)
npm run lint             # Run ESLint
npm test                 # Run tests in watch mode (Vitest)
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage
```

Backend runs on `localhost:4000` with Swagger documentation at `/api-docs`

### Frontend
```bash
cd frontend
npm i                     # Install dependencies
npm start                # Start Expo development server
npm run ios              # Build and run on iOS simulator (requires expo-dev-client)
npm run android          # Build and run on Android emulator
npm run web              # Start web version
npm run lint             # Run ESLint
npm test                 # Run tests in watch mode (Jest)
npm run test:ci          # Run tests once
npm run test:coverage    # Run tests with coverage
```

For mobile device testing, install the Expo Go app. For iOS development builds with native modules (HealthKit, Maps), use `expo run:ios` with EAS Build.

### Finding Backend URL for Mobile Testing
```bash
ipconfig getifaddr en0   # Get local IP for backend URL
```
Update `frontend/.env` with `EXPO_PUBLIC_API_URL=http://<your-ip>:4000/api`

### Building for iOS/Android
```bash
cd frontend
eas build --profile development --platform ios      # Development build
eas build --profile preview --platform ios          # Preview build
eas build --profile production --platform ios       # Production build
```

## Environment Variables

### Backend (`backend/.env`)
Required variables:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `ORS_API_KEY`: OpenRouteService API key for route generation
- `PORT`: Server port (defaults to 4000)
- `NODE_ENV`: Environment (development/test/production)
- `TRUST_PROXY` (optional): number of proxies in front of the API when hosted (e.g. `1`), so rate limits see each client's own IP

### Frontend (`frontend/.env`)
Required variables:
- `EXPO_PUBLIC_API_URL`: Backend API URL (e.g., `http://192.168.0.96:4000/api`)
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`: Google Places API key for location search
- `EXPO_PUBLIC_USE_MOCK_HEALTH`: demo health data unless set to `"false"`; set `false` in `.env` / EAS env for real health data in dev builds
- `GOOGLE_MAPS_IOS_KEY`, `GOOGLE_MAPS_ANDROID_KEY`: Google Maps SDK keys for native builds, read by `app.config.ts` at build time (EAS environment variables for EAS builds). Never put keys in `app.json`

`frontend/.env.example` lists every variable.

## Testing

### Backend Tests
- Framework: Vitest with supertest
- MongoDB service required (mocked in CI via GitHub Actions)
- Tests organized by feature: `tests/auth/`, `tests/users/`, `tests/services/`

### Frontend Tests
- Framework: Jest with React Native Testing Library
- Mocks located in `__mocks__/` directory
- Important: Mock expo-secure-store and storage utilities for auth tests
- Jest runs in a fixed time zone (`America/Sao_Paulo`) set in `jest.globalSetup.js`, so local-vs-UTC date bugs fail in CI too

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yaml`):
- Runs on PR and push events
- Backend job: Spins up MongoDB service, runs tests with environment variables
- Frontend job: Runs Jest tests
- Lockfile guard: `scripts/normalize-lockfile-registry.js` (run it after `npm install` on a machine using an internal npm mirror); CI fails if a lockfile resolves outside registry.npmjs.org

## API Structure

Backend exposes three main route groups:
- `/api/auth`: Authentication endpoints (login, register)
- `/api/users`: User management endpoints
- `/api/routes`: Route generation and retrieval endpoints

CORS configured for `localhost:8081`, `localhost:19006`, and `localhost:4000`

## Important Notes

- The app uses Expo Router for navigation (file-based routing)
- React Native Paper for UI components with custom light/dark themes
- The backend uses ES modules (`"type": "module"` in package.json)
- iOS HealthKit and Android Health Connect require a native build (cannot use Expo Go)
- Frontend uses path aliases (`@/` maps to project root) configured in `babel.config.js` and `tsconfig.json`
