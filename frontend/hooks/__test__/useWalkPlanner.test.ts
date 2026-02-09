import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { useWalkPlanner } from '../useWalkPlanner';
import GooglePlacesService from '@/services/GooglePlacesService';

jest.mock('expo-location');
jest.mock('@/services/GooglePlacesService');
jest.spyOn(Alert, 'alert');

const mockedLocation = Location as jest.Mocked<typeof Location>;
const mockedGooglePlaces = GooglePlacesService as jest.Mocked<typeof GooglePlacesService>;

// Mock PermissionResponse type
type MockPermissionResponse = {
  status: Location.PermissionStatus;
  expires: 'never' | number;
  granted: boolean;
  canAskAgain: boolean;
};

// Suppress console errors in tests
const originalConsoleError = console.error;

describe('useWalkPlanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress expected console.error calls
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('initialization', () => {
    it('requests location permission on mount', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.GRANTED,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as MockPermissionResponse);

      mockedLocation.getCurrentPositionAsync.mockResolvedValueOnce({
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
      });

      mockedGooglePlaces.reverseGeocode.mockResolvedValueOnce({
        coordinates: { latitude: 47.4979, longitude: 19.0402 },
        name: 'Budapest',
        address: 'Budapest, Hungary',
      });

      const { result } = renderHook(() => useWalkPlanner());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockedLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockedLocation.getCurrentPositionAsync).toHaveBeenCalled();
      expect(result.current.currentLocation).toEqual({
        latitude: 47.4979,
        longitude: 19.0402,
      });
    });

    it('shows alert when permission denied', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.DENIED,
        expires: 'never',
        granted: false,
        canAskAgain: true,
      } as MockPermissionResponse);

      const { result } = renderHook(() => useWalkPlanner());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        'Location permission is needed to plan walks.'
      );
    });

    it('handles location error gracefully', async () => {
      mockedLocation.requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: Location.PermissionStatus.GRANTED,
        expires: 'never',
        granted: true,
        canAskAgain: true,
      } as MockPermissionResponse);

      mockedLocation.getCurrentPositionAsync.mockRejectedValueOnce(
        new Error('Location unavailable')
      );

      const { result } = renderHook(() => useWalkPlanner());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not get your current location'
      );
    });
  });

  describe('route type', () => {
    it('starts with circular route type', () => {
      const { result } = renderHook(() => useWalkPlanner());
      expect(result.current.routeType).toBe('circular');
    });

    it('clears destination when switching to circular', async () => {
      const { result } = renderHook(() => useWalkPlanner());

      act(() => {
        result.current.setDestinationLocation({
          coordinates: { latitude: 47.5, longitude: 19.1 },
          name: 'Destination',
          address: 'Test Address',
        });
        result.current.setRouteType('point-to-point');
      });

      expect(result.current.destinationLocation).not.toBeNull();

      act(() => {
        result.current.setRouteType('circular');
      });

      await waitFor(() => {
        expect(result.current.destinationLocation).toBeNull();
      });
    });
  });

  describe('handleSearchLocation', () => {
    it('searches for places successfully', async () => {
      const mockSuggestions = [
        {
          placeId: '123',
          description: 'Heroes Square',
          mainText: 'Heroes Square',
          secondaryText: 'Budapest',
        },
      ];

      mockedGooglePlaces.searchPlaces.mockResolvedValueOnce(mockSuggestions);

      const { result } = renderHook(() => useWalkPlanner());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.handleSearchLocation('Heroes', 'start');
      });

      expect(suggestions).toEqual(mockSuggestions);
      expect(mockedGooglePlaces.searchPlaces).toHaveBeenCalledWith(
        'Heroes',
        undefined
      );
    });

    it('returns empty array on error', async () => {
      mockedGooglePlaces.searchPlaces.mockRejectedValueOnce(
        new Error('API error')
      );

      const { result } = renderHook(() => useWalkPlanner());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.handleSearchLocation('test', 'start');
      });

      expect(suggestions).toEqual([]);
    });
  });

  describe('handleSelectPlace', () => {
    it('sets start location from place details', async () => {
      const mockLocation = {
        coordinates: { latitude: 47.5148, longitude: 19.0782 },
        name: 'Heroes Square',
        address: 'Budapest, Hősök tere, 1146 Hungary',
      };

      mockedGooglePlaces.getPlaceDetails.mockResolvedValueOnce(mockLocation);

      const { result } = renderHook(() => useWalkPlanner());

      await act(async () => {
        await result.current.handleSelectPlace('123', 'start');
      });

      expect(result.current.startLocation).toEqual(mockLocation);
    });

    it('sets destination location from place details', async () => {
      const mockLocation = {
        coordinates: { latitude: 47.5148, longitude: 19.0782 },
        name: 'Destination',
        address: 'Test Address',
      };

      mockedGooglePlaces.getPlaceDetails.mockResolvedValueOnce(mockLocation);

      const { result } = renderHook(() => useWalkPlanner());

      await act(async () => {
        await result.current.handleSelectPlace('456', 'destination');
      });

      expect(result.current.destinationLocation).toEqual(mockLocation);
    });

    it('shows error alert on failure', async () => {
      mockedGooglePlaces.getPlaceDetails.mockRejectedValueOnce(
        new Error('API error')
      );

      const { result } = renderHook(() => useWalkPlanner());

      await act(async () => {
        await result.current.handleSelectPlace('999', 'start');
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Could not load place details'
      );
    });
  });

  describe('handleMapPress', () => {
    it('sets start location from map press', async () => {
      const mockLocation = {
        coordinates: { latitude: 47.5, longitude: 19.1 },
        name: 'Selected Location',
        address: 'Test Address',
      };

      mockedGooglePlaces.reverseGeocode.mockResolvedValueOnce(mockLocation);

      const { result } = renderHook(() => useWalkPlanner());

      act(() => {
        result.current.setMapSelectionMode('start');
      });

      await act(async () => {
        await result.current.handleMapPress({
          latitude: 47.5,
          longitude: 19.1,
        });
      });

      expect(result.current.startLocation).toEqual(mockLocation);
      expect(result.current.mapSelectionMode).toBe('none');
    });

    it('uses fallback location on geocoding error', async () => {
      mockedGooglePlaces.reverseGeocode.mockRejectedValueOnce(
        new Error('Geocoding failed')
      );

      const { result } = renderHook(() => useWalkPlanner());

      act(() => {
        result.current.setMapSelectionMode('start');
      });

      await act(async () => {
        await result.current.handleMapPress({
          latitude: 47.5,
          longitude: 19.1,
        });
      });

      expect(result.current.startLocation).toEqual({
        coordinates: { latitude: 47.5, longitude: 19.1 },
        name: 'Selected Location',
        address: '47.5000, 19.1000',
      });
    });

    it('does nothing when map selection mode is none', async () => {
      const { result } = renderHook(() => useWalkPlanner());

      const initialStartLocation = result.current.startLocation;

      await act(async () => {
        await result.current.handleMapPress({
          latitude: 47.5,
          longitude: 19.1,
        });
      });

      expect(result.current.startLocation).toEqual(initialStartLocation);
      expect(mockedGooglePlaces.reverseGeocode).not.toHaveBeenCalled();
    });
  });

  describe('distance', () => {
    it('starts with 5km default distance', () => {
      const { result } = renderHook(() => useWalkPlanner());
      expect(result.current.selectedDistance).toBe(5);
    });

    it('updates distance', () => {
      const { result } = renderHook(() => useWalkPlanner());

      act(() => {
        result.current.setSelectedDistance(10);
      });

      expect(result.current.selectedDistance).toBe(10);
    });
  });
});