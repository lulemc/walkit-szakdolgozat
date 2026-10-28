import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useTranslation } from "react-i18next";
import { CustomText } from "@/components/CustomText";
import type { Coordinates } from "@/services/routeService";
import { colors } from "@/theme/colors";

interface ActiveWalkMapProps {
  plannedRoute: Coordinates[];
  /** The walked path, one segment per stretch between pauses */
  segments: Coordinates[][];
  position: Coordinates;
  /** Simulated GPS: draw the position ourselves instead of the device's location dot */
  simulated: boolean;
}

/** The planned route and the path walked so far */
export const ActiveWalkMap: React.FC<ActiveWalkMapProps> = ({
  plannedRoute,
  segments,
  position,
  simulated,
}) => {
  const { t } = useTranslation("walk");

  return (
    <MapView
      style={styles.map}
      initialRegion={{ ...plannedRoute[0], latitudeDelta: 0.01, longitudeDelta: 0.01 }}
      accessibilityLabel={t("map.label")}
      showsUserLocation={!simulated}
      followsUserLocation={!simulated}
    >
      <Polyline coordinates={plannedRoute} strokeColor={colors.error} strokeWidth={4} lineCap="round" />

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

      {simulated ? (
        <Marker coordinate={position} title={t("map.youAreHere")}>
          <View style={styles.marker}>
            <CustomText style={styles.markerText}>📍</CustomText>
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
  marker: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  markerText: {
    fontSize: 22,
  },
});
