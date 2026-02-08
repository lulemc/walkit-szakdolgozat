// components/WalkPlanner/WalkPlannerMap.tsx
import React from "react";
import { StyleSheet } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  MapPressEvent,
} from "react-native-maps";
import type { Coordinates, Location } from "@/types/walkPlanner";

interface WalkPlannerMapProps {
  mapRef: React.RefObject<MapView>;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  currentLocation: Coordinates | null;
  startLocation: Location | null;
  destinationLocation: Location | null;
  routeType: "circular" | "point-to-point";
  onMapPress: (event: MapPressEvent) => void;
}

export default function WalkPlannerMap({
  mapRef,
  mapRegion,
  currentLocation,
  startLocation,
  destinationLocation,
  routeType,
  onMapPress,
}: WalkPlannerMapProps) {
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={mapRegion}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton
      showsCompass
      onPress={onMapPress}
    >
      {/* Current Location Indicator */}
      {currentLocation && (
        <Marker
          coordinate={currentLocation}
          title="Current Location"
          description="You are here"
          pinColor="blue"
          opacity={0.6}
        />
      )}

      {/* Start Location Marker */}
      {startLocation && (
        <Marker
          coordinate={startLocation.coordinates}
          title={startLocation.name}
          description={startLocation.address}
          pinColor="green"
        />
      )}

      {/* Destination Marker */}
      {routeType === "point-to-point" && destinationLocation && (
        <Marker
          coordinate={destinationLocation.coordinates}
          title={destinationLocation.name}
          description={destinationLocation.address}
          pinColor="red"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
