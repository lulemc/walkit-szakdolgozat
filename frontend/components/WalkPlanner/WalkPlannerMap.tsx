import React, { useEffect } from "react";
import MapView, { MapPressEvent, Marker, Polyline } from "react-native-maps";
import { StyleSheet } from "react-native";
import { mapProvider } from "@/utils/mapProvider";
import type { Coordinates, Location } from "@/services/GooglePlacesService";
import type { Route } from "@/services/routeService";

interface WalkPlannerMapProps {
  mapRef: React.RefObject<MapView | null>;
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
  generatedRoute?: Route | null;
  onMapPress: (event: MapPressEvent) => void;
}

const WalkPlannerMap: React.FC<WalkPlannerMapProps> = ({
  mapRef,
  mapRegion,
  currentLocation,
  startLocation,
  destinationLocation,
  routeType,
  generatedRoute,
  onMapPress,
}) => {
  useEffect(() => {
    if (
      generatedRoute &&
      generatedRoute.coordinates.length > 0 &&
      mapRef.current
    ) {
      // Add small delay to ensure map is ready
      setTimeout(() => {
        const coordinates = generatedRoute.coordinates.map((coord) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
        }));

        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 300,
            left: 50,
          },
          animated: true,
        });
      }, 300);
    }
  }, [generatedRoute, mapRef]);

  return (
    <MapView
      ref={mapRef}
      provider={mapProvider}
      style={styles.map}
      initialRegion={mapRegion}
      showsUserLocation
      showsMyLocationButton
      showsCompass
      showsScale
      onPress={onMapPress}
      accessibilityLabel="Map with your start, destination and the generated route"
    >
      {/* START MARKER */}
      {startLocation && (
        <Marker
          coordinate={startLocation.coordinates}
          title={startLocation.name || "Start Location"}
          description={startLocation.address}
          pinColor="green"
        />
      )}

      {/* DESTINATION MARKER (only for point-to-point) */}
      {routeType === "point-to-point" && destinationLocation && (
        <Marker
          coordinate={destinationLocation.coordinates}
          title={destinationLocation.name || "Destination"}
          description={destinationLocation.address}
          pinColor="red"
        />
      )}

      {/* The generated route */}
      {generatedRoute && generatedRoute.coordinates.length > 0 && (
        <Polyline
          coordinates={generatedRoute.coordinates.map((coord) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
          }))}
          strokeColor="#007AFF" // iOS blue
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
});

export default WalkPlannerMap;
