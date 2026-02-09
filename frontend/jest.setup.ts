import '@testing-library/jest-native/extend-expect';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({
      status: 'granted',
      expires: 'never',
      granted: true,
      canAskAgain: true,
    })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 47.4979,
        longitude: 19.0402,
        altitude: null,
        accuracy: 10,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
  ),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([])),
  Accuracy: {
    Balanced: 1,
    High: 4,
    Low: 1,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Polyline: View,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureDetector: View,
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
    },
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @react-native-community/slider
jest.mock('@react-native-community/slider', () => {
  const { View } = require('react-native');
  return View;
});

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');