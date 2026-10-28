import { useState, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import GooglePlacesService from '@/services/GooglePlacesService';
import { routeService, Route, RoutePreferences } from '@/services/routeService';
import type {
  Coordinates,
  Location as LocationType,
  PlaceSuggestion,
} from '@/services/GooglePlacesService';
import { apiErrorMessage } from '@/utils/apiError';
import { useSnackbar } from '@/context/SnackbarProvider';

type RouteType = 'circular' | 'point-to-point';
type MapSelectionMode = 'none' | 'start' | 'destination';

export const useWalkPlanner = () => {
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);

  const { showMessage } = useSnackbar();
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [startLocation, setStartLocation] = useState<LocationType | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 47.4979,
    longitude: 19.0402,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [selectedDistance, setSelectedDistance] = useState(5);
  const [routeType, setRouteType] = useState<RouteType>('circular');
  const [mapSelectionMode, setMapSelectionMode] = useState<MapSelectionMode>('none');

  const [preferences, setPreferences] = useState<RoutePreferences>({
    parks: false,
    waterfront: false,
    avoidHighways: true,
    scenic: false,
    uphill: false,
    mountain: false,
    quietStreets: false,
    beach: false,
  });
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);
  const [generatedRoute, setGeneratedRoute] = useState<Route | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Load the user's location once on mount
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setLoading(true);

        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          showMessage(
            'Location permission is needed to use your position. You can still pick a start point on the map.',
            { type: 'error' }
          );
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCurrentLocation(coords);

        try {
          const locationWithAddress = await GooglePlacesService.reverseGeocode(coords);
          setStartLocation(locationWithAddress);
        } catch (error) {
          setStartLocation({
            coordinates: coords,
            name: 'Current Location',
            address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
          });
        }

        setMapRegion({
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (error) {
        showMessage('Could not get your current location', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    getCurrentLocation();
    // showMessage is stable, so this still runs once
  }, [showMessage]);

  // Circular routes have no destination, so clear it when switching to them
  const changeRouteType = (type: RouteType) => {
    setRouteType(type);
    if (type === 'circular') {
      setDestinationLocation(null);
      setMapSelectionMode('none');
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!currentLocation) return;

    try {
      const locationWithAddress = await GooglePlacesService.reverseGeocode(currentLocation);
      setStartLocation(locationWithAddress);
    } catch (error) {
      setStartLocation({
        coordinates: currentLocation,
        name: 'Current Location',
        address: `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`,
      });
    }

    setMapSelectionMode('none');
    mapRef.current?.animateToRegion({
      ...currentLocation,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  // The map shows a hint (MapSelectionIndicator) with a Cancel button, so no alert
  const handleEnableMapSelection = (type: 'start' | 'destination') => {
    setMapSelectionMode(type);
  };

  const handleMapPress = async (coordinate: Coordinates) => {
    if (mapSelectionMode === 'none') return;

    try {
      const locationWithAddress = await GooglePlacesService.reverseGeocode(coordinate);

      if (mapSelectionMode === 'start') {
        setStartLocation(locationWithAddress);
        showMessage(`Start set: ${locationWithAddress.name || 'the selected point'}`);
      } else if (mapSelectionMode === 'destination') {
        setDestinationLocation(locationWithAddress);
        showMessage(`Destination set: ${locationWithAddress.name || 'the selected point'}`);
      }
    } catch (error) {
      const fallbackLocation: LocationType = {
        coordinates: coordinate,
        name: 'Selected Location',
        address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      };

      if (mapSelectionMode === 'start') {
        setStartLocation(fallbackLocation);
      } else {
        setDestinationLocation(fallbackLocation);
      }
    } finally {
      setMapSelectionMode('none');
    }
  };

  /** Errors are passed on, so the search box can say search is unavailable */
  const handleSearchLocation = (
    query: string,
    type: 'start' | 'destination',
    sessionToken?: string
  ): Promise<PlaceSuggestion[]> =>
    GooglePlacesService.searchPlaces(query, currentLocation || undefined, sessionToken);

  /** The search's session token ends the session with the picked place */
  const handleSelectPlace = async (
    placeId: string,
    type: 'start' | 'destination',
    sessionToken?: string
  ): Promise<void> => {
    try {
      const location = await GooglePlacesService.getPlaceDetails(placeId, sessionToken);

      if (type === 'start') {
        setStartLocation(location);
        mapRef.current?.animateToRegion({
          ...location.coordinates,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        setDestinationLocation(location);
      }
    } catch (error) {
      showMessage('Could not load place details', { type: 'error' });
    }
  };

// Generate route function
  const generateRoute = async (): Promise<void> => {
    if (!startLocation) {
      showMessage('Please select a start location', { type: 'error' });
      return;
    }

    if (routeType === 'point-to-point' && !destinationLocation) {
      showMessage('Please select a destination for a point-to-point route', { type: 'error' });
      return;
    }

    setIsGeneratingRoute(true);
    setRouteError(null);

    try {
      const request = {
        startLocation: {
          latitude: startLocation.coordinates.latitude,
          longitude: startLocation.coordinates.longitude,
        },
        routeType,
        preferences,
        ...(routeType === 'circular' && { distance: selectedDistance }),
        ...(routeType === 'point-to-point' && destinationLocation && {
          destinationLocation: {
            latitude: destinationLocation.coordinates.latitude,
            longitude: destinationLocation.coordinates.longitude,
          },
        }),
      };

      const route = await routeService.generateRoute(request);

      setGeneratedRoute(route);
    } catch (error) {
      // The server explains what went wrong (e.g. the routing service is busy)
      const errorMessage = apiErrorMessage(error, 'Failed to generate route');
      setRouteError(errorMessage);
      showMessage(errorMessage, { type: 'error' });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

 // Clear route function
  const clearRoute = (): void => {
    setGeneratedRoute(null);
    setRouteError(null);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return {
    mapRef,
    scrollRef,
    currentLocation,
    startLocation,
    destinationLocation,
    loading,
    mapRegion,
    selectedDistance,
    routeType,
    mapSelectionMode,
    setStartLocation,
    setDestinationLocation,
    setSelectedDistance,
    setRouteType: changeRouteType,
    setMapSelectionMode,
    handleUseCurrentLocation,
    handleEnableMapSelection,
    handleMapPress,
    handleSearchLocation,
    handleSelectPlace,
    scrollToTop,
    preferences,
    setPreferences,
    isGeneratingRoute,
    generatedRoute,
    routeError,
    generateRoute,
    clearRoute,
  };
};