// Icons from @expo/vector-icons load their font asynchronously and update their
// own state when it arrives - in tests that happens after the test finished and
// prints "not wrapped in act(...)" warnings. Treat fonts as already loaded.
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));
