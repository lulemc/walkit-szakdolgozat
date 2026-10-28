import React, { useState } from "react";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
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
  /** sessionToken: the same for every search until a place is picked */
  onSearchLocation: (
    query: string,
    type: LocationType,
    sessionToken: string,
  ) => Promise<PlaceSuggestion[]>;
  onSelectPlace: (placeId: string, type: LocationType, sessionToken: string) => Promise<void>;
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
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  // Each box waits until typing pauses and ignores out-of-date answers
  const startSearch = usePlaceSearch((query, token) => onSearchLocation(query, "start", token));
  const destinationSearch = usePlaceSearch((query, token) =>
    onSearchLocation(query, "destination", token),
  );

  const isUsingCurrentLocation =
    currentLocation &&
    startLocation &&
    currentLocation.latitude === startLocation.coordinates.latitude &&
    currentLocation.longitude === startLocation.coordinates.longitude;

  /** Picks a place, which ends the search session; the box shows its name */
  const selectPlace = async (
    search: typeof startSearch,
    type: LocationType,
    suggestion: PlaceSuggestion,
    closeSearch: () => void,
  ) => {
    try {
      await onSelectPlace(suggestion.placeId, type, search.sessionToken);
      search.endSession(suggestion.description);
      closeSearch();
    } catch {
      // The planner already told the user (onSelectPlace shows the error)
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
            value={startSearch.query}
            onChangeText={startSearch.setQuery}
            onClear={startSearch.reset}
            suggestions={startSearch.suggestions}
            onSelectSuggestion={(suggestion) =>
              selectPlace(startSearch, "start", suggestion, () => setIsSearchingStart(false))
            }
            onCancel={() => {
              setIsSearchingStart(false);
              startSearch.reset();
            }}
            isSearching={startSearch.searching}
            error={startSearch.error}
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
              value={destinationSearch.query}
              onChangeText={destinationSearch.setQuery}
              onClear={destinationSearch.reset}
              suggestions={destinationSearch.suggestions}
              onSelectSuggestion={(suggestion) =>
                selectPlace(destinationSearch, "destination", suggestion, () =>
                  setIsSearchingDestination(false),
                )
              }
              onCancel={() => {
                setIsSearchingDestination(false);
                destinationSearch.reset();
              }}
              isSearching={destinationSearch.searching}
              error={destinationSearch.error}
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
