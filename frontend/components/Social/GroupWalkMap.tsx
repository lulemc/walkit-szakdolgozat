import React from "react";
import { StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useTranslation } from "react-i18next";
import type { Coordinates } from "@/services/routeService";
import { colors } from "@/theme/colors";
import { mapProvider } from "@/utils/mapProvider";
import { regionForCoordinates } from "./mapRegion";

interface GroupWalkMapProps {
  coordinates: Coordinates[];
}

/** A still map of a group walk's route; it doesn't move, so the page can scroll over it */
export const GroupWalkMap: React.FC<GroupWalkMapProps> = ({ coordinates }) => {
  const { t } = useTranslation("social");
  if (coordinates.length === 0) return null;
  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];
  // Circular routes finish where they start
  const finishesElsewhere =
    end.latitude !== start.latitude || end.longitude !== start.longitude;

  return (
    <MapView
      provider={mapProvider}
      style={styles.map}
      initialRegion={regionForCoordinates(coordinates)}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      accessibilityLabel={t("map.label")}
    >
      <Polyline
        coordinates={coordinates}
        strokeColor={colors.error}
        strokeWidth={4}
        lineCap="round"
      />
      <Marker coordinate={start} title={t("map.start")} pinColor="green" />
      {finishesElsewhere ? <Marker coordinate={end} title={t("map.finish")} pinColor="red" /> : null}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    height: 220,
    borderRadius: 12,
  },
});
