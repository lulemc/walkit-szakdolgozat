import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { regionForCoordinates } from "@/components/Social/mapRegion";
import type { Coordinates } from "@/services/routeService";
import { colors } from "@/theme/colors";
import { mapProvider } from "@/utils/mapProvider";

interface WalkPathMapProps {
  /** One list of points per stretch between pauses */
  segments: Coordinates[][];
}

/** A still map of the path that was walked */
export const WalkPathMap: React.FC<WalkPathMapProps> = ({ segments }) => {
  const points = segments.flat();
  if (points.length === 0) return null;

  return (
    <MapView
      provider={mapProvider}
      style={styles.map}
      initialRegion={regionForCoordinates(points)}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      accessibilityLabel="Map of the walk"
    >
      {segments
        .filter((segment) => segment.length > 1)
        .map((segment, index) => (
          <Polyline
            key={index}
            coordinates={segment}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
          />
        ))}
      <Marker coordinate={points[0]} title="Start" pinColor="green" />
      <Marker coordinate={points[points.length - 1]} title="Finish" pinColor="red" />
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    height: 260,
    borderRadius: 12,
  },
});
