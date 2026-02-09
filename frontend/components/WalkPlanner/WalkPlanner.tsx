import React from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import { PrimaryButton } from "@/components/Button";
import { formatDuration, calculateWalkDuration } from "@/utils/timeUtils";
import { useWalkPlanner } from "@/hooks/useWalkPlanner";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";
import WalkPlannerMap from "@/components/WalkPlanner/WalkPlannerMap";
import MapSelectionIndicator from "@/components/WalkPlanner/MapSelectionIndicator";
import DraggablePanel from "@/components/WalkPlanner/DraggablePanel";
import LocationSelector from "@/components/WalkPlanner/LocationSelector";
import RouteTypeSelector from "@/components/WalkPlanner/RouteTypeSelector";
import DistanceSelector from "@/components/WalkPlanner/DistanceSelector";

export default function WalkPlannerScreen() {
  const theme = useTheme();

  const {
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
  } = useWalkPlanner();

  const { panGesture, animatedPanelStyle } = useDraggablePanel({
    onExpand: scrollToTop,
  });

  const handleContinue = () => {
    if (!startLocation) {
      Alert.alert("Error", "Please select a start location");
      return;
    }

    if (routeType === "point-to-point" && !destinationLocation) {
      Alert.alert(
        "Error",
        "Please select a destination for point-to-point route",
      );
      return;
    }

    const summary = `Route Type: ${routeType === "circular" ? "Circular Loop" : "Point-to-Point"}\nDistance: ${selectedDistance.toFixed(1)} km\nEstimated time: ${formatDuration(calculateWalkDuration(selectedDistance))}\n\nStart: ${startLocation.name}\n${startLocation.address}${
      routeType === "point-to-point" && destinationLocation
        ? `\n\nDestination: ${destinationLocation.name}\n${destinationLocation.address}`
        : ""
    }`;

    Alert.alert("Route Summary", summary);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <CustomText style={styles.loadingText}>
          Getting your location...
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WalkPlannerMap
        mapRef={mapRef as React.RefObject<any>}
        mapRegion={mapRegion}
        currentLocation={currentLocation}
        startLocation={startLocation}
        destinationLocation={destinationLocation}
        routeType={routeType}
        onMapPress={(event) => handleMapPress(event.nativeEvent.coordinate)}
      />

      {mapSelectionMode !== "none" && (
        <MapSelectionIndicator
          type={mapSelectionMode}
          onCancel={() => setMapSelectionMode("none")}
        />
      )}

      <DraggablePanel
        panGesture={panGesture}
        animatedPanelStyle={animatedPanelStyle}
        scrollRef={scrollRef as React.RefObject<any>}
        scrollEnabled={mapSelectionMode === "none"}
      >
        <CustomText variant="titleLarge" style={styles.title}>
          Plan Your Walk
        </CustomText>

        <View style={styles.section}>
          <CustomText variant="titleMedium" style={styles.sectionTitle}>
            📍 Location
          </CustomText>
          <LocationSelector
            currentLocation={currentLocation}
            startLocation={startLocation}
            destinationLocation={destinationLocation}
            routeType={routeType}
            onStartLocationChange={setStartLocation}
            onDestinationLocationChange={setDestinationLocation}
            onUseCurrentLocation={handleUseCurrentLocation}
            onEnableMapSelection={handleEnableMapSelection}
            onSearchLocation={handleSearchLocation}
            onSelectPlace={handleSelectPlace}
          />
        </View>

        <View style={styles.section}>
          <CustomText variant="titleMedium" style={styles.sectionTitle}>
            🔄 Route Type
          </CustomText>
          <RouteTypeSelector value={routeType} onChange={setRouteType} />
        </View>

        <View style={styles.section}>
          <CustomText variant="titleMedium" style={styles.sectionTitle}>
            📏 Distance
          </CustomText>
          <DistanceSelector
            value={selectedDistance}
            onChange={setSelectedDistance}
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            mode="contained"
            onPress={handleContinue}
            style={styles.button}
          >
            Continue
          </PrimaryButton>
        </View>
      </DraggablePanel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  title: {
    marginBottom: 24,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "500",
  },
  actions: {
    gap: 12,
    marginTop: 16,
    paddingBottom: 20,
  },
  button: {
    width: "100%",
  },
});
