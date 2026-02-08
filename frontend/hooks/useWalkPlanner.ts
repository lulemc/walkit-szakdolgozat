import { useState, useEffect, useRef } from 'react';
import { Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import GooglePlacesService from '@/services/GooglePlacesService';
import type {
  Coordinates,
  Location as LocationType,
  PlaceSuggestion,
} from '@/services/GooglePlacesService';

type RouteType = 'circular' | 'point-to-point';
type MapSelectionMode = 'none' | 'start' | 'destination';

export const useWalkPlanner = () => {
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (routeType === 'circular') {
      setDestinationLocation(null);
      setMapSelectionMode('none');
    }
  }, [routeType]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to plan walks.'
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
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setLoading(false);
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

  const handleEnableMapSelection = (type: 'start' | 'destination') => {
    setMapSelectionMode(type);
    Alert.alert(
      'Select Location',
      `Tap anywhere on the map to set your ${type === 'start' ? 'start' : 'destination'} location.`,
      [
        { text: 'Cancel', onPress: () => setMapSelectionMode('none'), style: 'cancel' },
        { text: 'OK' },
      ]
    );
  };

  const handleMapPress = async (coordinate: Coordinates) => {
    if (mapSelectionMode === 'none') return;

    try {
      const locationWithAddress = await GooglePlacesService.reverseGeocode(coordinate);

      if (mapSelectionMode === 'start') {
        setStartLocation(locationWithAddress);
        Alert.alert('Start Location Set', locationWithAddress.name || 'Start location has been updated.');
      } else if (mapSelectionMode === 'destination') {
        setDestinationLocation(locationWithAddress);
        Alert.alert('Destination Set', locationWithAddress.name || 'Destination location has been updated.');
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

  const handleSearchLocation = async (
    query: string,
    type: 'start' | 'destination'
  ): Promise<PlaceSuggestion[]> => {
    try {
      return await GooglePlacesService.searchPlaces(query, currentLocation || undefined);
    } catch (error) {
      console.error('Error searching location:', error);
      return [];
    }
  };

  const handleSelectPlace = async (
    placeId: string,
    type: 'start' | 'destination'
  ): Promise<void> => {
    try {
      const location = await GooglePlacesService.getPlaceDetails(placeId);

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
      console.error('Error selecting place:', error);
      Alert.alert('Error', 'Could not load place details');
    }
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
    setRouteType,
    setMapSelectionMode,
    handleUseCurrentLocation,
    handleEnableMapSelection,
    handleMapPress,
    handleSearchLocation,
    handleSelectPlace,
    scrollToTop,
  };
};