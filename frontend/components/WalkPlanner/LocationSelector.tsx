import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { CustomText } from "@/components/CustomText";
import LocationCard from "./LocationCard";
import SearchCard from "./SearchCard";
import type {
  Coordinates,
  Location,
  PlaceSuggestion,
  RouteType,
  LocationType,
} from "@/types/walkPlanner";

interface LocationSelectorProps {
  currentLocation: Coordinates | null;
  startLocation: Location | null;
  destinationLocation: Location | null;
  routeType: RouteType;
  onStartLocationChange: (location: Location) => void;
  onDestinationLocationChange: (location: Location | null) => void;
  onUseCurrentLocation: () => void;
  onEnableMapSelection: (type: LocationType) => void;
  onSearchLocation: (
    query: string,
    type: LocationType,
  ) => Promise<PlaceSuggestion[]>;
  onSelectPlace: (placeId: string, type: LocationType) => Promise<void>;
}

export default function LocationSelector({
  currentLocation,
  startLocation,
  destinationLocation,
  routeType,
  onStartLocationChange,
  onDestinationLocationChange,
  onUseCurrentLocation,
  onEnableMapSelection,
  onSearchLocation,
  onSelectPlace,
}: LocationSelectorProps) {
  const [startSearchQuery, setStartSearchQuery] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<PlaceSuggestion[]>(
    [],
  );
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [searchingStart, setSearchingStart] = useState(false);

  const [destinationSearchQuery, setDestinationSearchQuery] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    PlaceSuggestion[]
  >([]);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [searchingDestination, setSearchingDestination] = useState(false);

  const isUsingCurrentLocation =
    currentLocation &&
    startLocation &&
    currentLocation.latitude === startLocation.coordinates.latitude &&
    currentLocation.longitude === startLocation.coordinates.longitude;

  const handleStartSearch = async (query: string) => {
    setStartSearchQuery(query);

    if (query.length < 3) {
      setStartSuggestions([]);
      return;
    }

    try {
      setSearchingStart(true);
      const suggestions = await onSearchLocation(query, "start");
      setStartSuggestions(suggestions);
    } catch (error) {
      console.error("Error searching start location:", error);
      setStartSuggestions([]);
    } finally {
      setSearchingStart(false);
    }
  };

  const handleDestinationSearch = async (query: string) => {
    setDestinationSearchQuery(query);

    if (query.length < 3) {
      setDestinationSuggestions([]);
      return;
    }

    try {
      setSearchingDestination(true);
      const suggestions = await onSearchLocation(query, "destination");
      setDestinationSuggestions(suggestions);
    } catch (error) {
      console.error("Error searching destination:", error);
      setDestinationSuggestions([]);
    } finally {
      setSearchingDestination(false);
    }
  };

  const handleSelectStartPlace = async (suggestion: PlaceSuggestion) => {
    try {
      await onSelectPlace(suggestion.placeId, "start");
      setStartSearchQuery(suggestion.description);
      setStartSuggestions([]);
      setIsSearchingStart(false);
    } catch (error) {
      console.error("Error selecting start place:", error);
    }
  };

  const handleSelectDestinationPlace = async (suggestion: PlaceSuggestion) => {
    try {
      await onSelectPlace(suggestion.placeId, "destination");
      setDestinationSearchQuery(suggestion.description);
      setDestinationSuggestions([]);
      setIsSearchingDestination(false);
    } catch (error) {
      console.error("Error selecting destination place:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.locationGroup}>
        <CustomText variant="titleSmall" style={styles.label}>
          📍 Start Location
        </CustomText>

        {!isSearchingStart ? (
          <LocationCard
            location={startLocation}
            isCurrentLocation={!!isUsingCurrentLocation}
            showActions={true}
            onUseCurrentLocation={onUseCurrentLocation}
            onEnableSearch={() => setIsSearchingStart(true)}
            onEnableMapSelection={() => onEnableMapSelection("start")}
          />
        ) : (
          <SearchCard
            value={startSearchQuery}
            onChangeText={handleStartSearch}
            onClear={() => setStartSearchQuery("")}
            suggestions={startSuggestions}
            onSelectSuggestion={handleSelectStartPlace}
            onCancel={() => {
              setIsSearchingStart(false);
              setStartSearchQuery("");
              setStartSuggestions([]);
            }}
            isSearching={searchingStart}
          />
        )}
      </View>

      {routeType === "point-to-point" && (
        <View style={styles.locationGroup}>
          <CustomText variant="titleSmall" style={styles.label}>
            🎯 Destination
          </CustomText>

          {!isSearchingDestination ? (
            <LocationCard
              location={destinationLocation}
              isCurrentLocation={false}
              showActions={true}
              onEnableSearch={() => setIsSearchingDestination(true)}
              onEnableMapSelection={() => onEnableMapSelection("destination")}
              onClear={() => onDestinationLocationChange(null)}
            />
          ) : (
            <SearchCard
              value={destinationSearchQuery}
              onChangeText={handleDestinationSearch}
              onClear={() => setDestinationSearchQuery("")}
              suggestions={destinationSuggestions}
              onSelectSuggestion={handleSelectDestinationPlace}
              onCancel={() => {
                setIsSearchingDestination(false);
                setDestinationSearchQuery("");
                setDestinationSuggestions([]);
              }}
              isSearching={searchingDestination}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  locationGroup: {
    gap: 8,
  },
  label: {
    fontWeight: "600",
  },
});
