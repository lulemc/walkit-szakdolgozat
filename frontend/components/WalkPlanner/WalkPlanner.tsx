import { useState, useEffect, useRef, RefObject } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CustomText } from "@/components/CustomText";
import { PrimaryButton } from "@/components/Button";
import { useWalkPlanner } from "@/hooks/useWalkPlanner";
import { useDraggablePanel } from "@/hooks/useDraggablePanel";
import WalkPlannerMap from "@/components/WalkPlanner/WalkPlannerMap";
import MapSelectionIndicator from "@/components/WalkPlanner/MapSelectionIndicator";
import DraggablePanel from "@/components/WalkPlanner/DraggablePanel";
import LocationSelector from "@/components/WalkPlanner/LocationSelector";
import RouteTypeSelector from "@/components/WalkPlanner/RouteTypeSelector";
import DistanceSelector from "@/components/WalkPlanner/DistanceSelector";
import PreferencesSelector from "@/components/WalkPlanner/PreferencesSelector";
import RouteInfoCard from "@/components/WalkPlanner/RouteInfoCard";

type RootStackParamList = {
  Home: undefined;
  WalkPlanner: undefined;
  ActiveWalk: { route: any };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WalkPlannerScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

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
    preferences,
    setPreferences,
    isGeneratingRoute,
    generatedRoute,
    generateRoute,
    clearRoute,
  } = useWalkPlanner();

  const { panGesture, animatedPanelStyle, collapsePanel } = useDraggablePanel({
    onExpand: scrollToTop,
  });

  const [cardVisible, setCardVisible] = useState(true);
  const hasCollapsed = useRef(false);

  useEffect(() => {
    if (generatedRoute && !isGeneratingRoute && !hasCollapsed.current) {
      setTimeout(() => {
        collapsePanel?.();
      }, 300);

      hasCollapsed.current = true;
      setCardVisible(true);
    }

    if (!generatedRoute) {
      hasCollapsed.current = false;
    }
  }, [generatedRoute, isGeneratingRoute]);

  const canGenerateRoute = (): boolean => {
    if (!startLocation) return false;
    if (routeType === "point-to-point" && !destinationLocation) return false;
    if (isGeneratingRoute) return false;
    return true;
  };

  const handleCloseInfoCard = () => {
    setCardVisible(false);
  };

  const handleGenerateRoute = async () => {
    hasCollapsed.current = false;
    setCardVisible(true);
    await generateRoute();
  };

  const handleStartWalk = () => {
    if (!generatedRoute) {
      Alert.alert("Error", "No route to start");
      return;
    }

    navigation.navigate("ActiveWalk", {
      route: generatedRoute,
    });
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
        mapRef={mapRef as RefObject<any>}
        mapRegion={mapRegion}
        currentLocation={currentLocation}
        startLocation={startLocation}
        destinationLocation={destinationLocation}
        routeType={routeType}
        generatedRoute={generatedRoute}
        onMapPress={(event) => handleMapPress(event.nativeEvent.coordinate)}
      />

      {mapSelectionMode !== "none" && (
        <MapSelectionIndicator
          type={mapSelectionMode}
          onCancel={() => setMapSelectionMode("none")}
        />
      )}

      {generatedRoute && !isGeneratingRoute && cardVisible && (
        <View style={styles.routeInfoContainer}>
          <RouteInfoCard
            route={generatedRoute}
            onClose={handleCloseInfoCard}
            onStartWalk={handleStartWalk} // NEW
          />
        </View>
      )}

      <DraggablePanel
        panGesture={panGesture}
        animatedPanelStyle={animatedPanelStyle}
        scrollRef={scrollRef as RefObject<any>}
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

        <View style={styles.section}>
          <CustomText variant="titleMedium" style={styles.sectionTitle}>
            ⚙️ Preferences
          </CustomText>
          <PreferencesSelector
            preferences={preferences}
            onChange={setPreferences}
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            mode="contained"
            onPress={handleGenerateRoute}
            disabled={!canGenerateRoute()}
            loading={isGeneratingRoute}
            style={styles.button}
          >
            {isGeneratingRoute
              ? "Generating Route..."
              : generatedRoute
                ? "Regenerate Route"
                : "Generate Route"}
          </PrimaryButton>

          {generatedRoute && !isGeneratingRoute && (
            <PrimaryButton
              mode="outlined"
              onPress={clearRoute}
              style={styles.button}
              textColor={theme.colors.error}
            >
              Clear Route
            </PrimaryButton>
          )}
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
  routeInfoContainer: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 10,
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
