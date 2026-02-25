import { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useTheme, Card } from "react-native-paper";
import * as Location from "expo-location";
import { CustomText } from "@/components/CustomText";
import { PrimaryButton } from "@/components/Button";
import type { Route as RouteType } from "@/services/routeService";
import { colors } from "@/theme/colors";

interface ActiveWalkScreenProps {
  route: RouteType;
  onEndWalk: () => void;
}

interface WalkSession {
  startedAt: Date;
  distanceWalked: number;
  elapsedTime: number;
  breadcrumbs: Array<{
    latitude: number;
    longitude: number;
    timestamp: Date;
  }>;
  isPaused: boolean;
}

// MOCK GPS for testing at home
const MOCK_MODE = __DEV__; // Enable in development

export default function ActiveWalkScreen({
  route: walkRoute,
  onEndWalk,
}: ActiveWalkScreenProps) {
  const theme = useTheme();

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<any>(null);
  const timerInterval = useRef<any>(null);

  // Mock GPS state
  const mockPositionIndex = useRef(0);
  const mockInterval = useRef<any>(null);

  const [session, setSession] = useState<WalkSession>({
    startedAt: new Date(),
    distanceWalked: 0,
    elapsedTime: 0,
    breadcrumbs: [],
    isPaused: false,
  });

  const [currentPosition, setCurrentPosition] = useState(
    walkRoute.coordinates[0],
  );
  const [isTracking, setIsTracking] = useState(false);
  const [useMockGPS, setUseMockGPS] = useState(MOCK_MODE);

  useEffect(() => {
    startWalk();
    return () => {
      stopTracking();
    };
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    if (isTracking && !session.isPaused) {
      timerInterval.current = setInterval(() => {
        setSession((prev) => ({
          ...prev,
          elapsedTime: Math.floor(
            (new Date().getTime() - prev.startedAt.getTime()) / 1000,
          ),
        }));
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTracking, session.isPaused]);

  const startWalk = async () => {
    if (useMockGPS) {
      startMockGPS();
    } else {
      await startRealGPS();
    }
    setIsTracking(true);
  };

  const startMockGPS = () => {
    console.log("🎮 Starting MOCK GPS for testing");
    mockPositionIndex.current = 0;

    mockInterval.current = setInterval(() => {
      if (mockPositionIndex.current < walkRoute.coordinates.length) {
        const position = walkRoute.coordinates[mockPositionIndex.current];

        setCurrentPosition(position);

        const newBreadcrumb = {
          ...position,
          timestamp: new Date(),
        };

        setSession((prev) => {
          const newBreadcrumbs = [...prev.breadcrumbs, newBreadcrumb];
          const newDistance = calculatePathDistance(newBreadcrumbs);

          return {
            ...prev,
            breadcrumbs: newBreadcrumbs,
            distanceWalked: newDistance,
          };
        });

        mockPositionIndex.current++;
      } else {
        // Reached end of route
        if (mockInterval.current) {
          clearInterval(mockInterval.current);
        }
        Alert.alert("Walk Complete!", "You reached the end of the route!", [
          { text: "OK", onPress: () => handleFinishWalk() },
        ]);
      }
    }, 2000); // Update every 2 seconds (faster for testing)
  };

  const startRealGPS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to track your walk.",
        );
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
        },
        (location) => {
          const position = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setCurrentPosition(position);

          const newBreadcrumb = {
            ...position,
            timestamp: new Date(),
          };

          setSession((prev) => {
            const newBreadcrumbs = [...prev.breadcrumbs, newBreadcrumb];
            const newDistance = calculatePathDistance(newBreadcrumbs);

            return {
              ...prev,
              breadcrumbs: newBreadcrumbs,
              distanceWalked: newDistance,
            };
          });
        },
      );
    } catch (error) {
      console.error("Error starting GPS:", error);
      Alert.alert("Error", "Could not start GPS tracking");
    }
  };

  const stopTracking = () => {
    if (mockInterval.current) {
      clearInterval(mockInterval.current);
    }
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
  };

  const calculatePathDistance = (breadcrumbs: typeof session.breadcrumbs) => {
    let total = 0;
    for (let i = 1; i < breadcrumbs.length; i++) {
      total += haversineDistance(breadcrumbs[i - 1], breadcrumbs[i]);
    }
    return total;
  };

  const haversineDistance = (p1: any, p2: any) => {
    const R = 6371e3;
    const fi1 = (p1.latitude * Math.PI) / 180;
    const fi2 = (p2.latitude * Math.PI) / 180;
    const fi = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const lam = ((p2.longitude - p1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(fi / 2) * Math.sin(fi / 2) +
      Math.cos(fi1) * Math.cos(fi2) * Math.sin(lam / 2) * Math.sin(lam / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handlePauseResume = () => {
    setSession((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleFinishWalk = () => {
    Alert.alert(
      "Walk Complete! 🎉",
      `Distance: ${(session.distanceWalked / 1000).toFixed(2)}km\nTime: ${formatTime(session.elapsedTime)}`,
      [
        {
          text: "Save as Favorite",
          onPress: () => saveAsFavorite(),
        },
        {
          text: "Finish",
          onPress: () => {
            stopTracking();
            onEndWalk();
          },
        },
      ],
    );
  };

  const saveAsFavorite = async () => {
    // TODO: Implement save to favorites in backend
    console.log("💾 Saving route as favorite...");
    Alert.alert("Success!", "Route saved to your favorites!", [
      { text: "OK", onPress: () => onEndWalk() },
    ]);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const calculatePace = () => {
    if (session.distanceWalked === 0) return "0:00";
    const minPerKm = session.elapsedTime / 60 / (session.distanceWalked / 1000);
    const mins = Math.floor(minPerKm);
    const secs = Math.floor((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...walkRoute.coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={!useMockGPS}
        followsUserLocation={!useMockGPS}
      >
        {/* Planned Route */}
        <Polyline
          coordinates={walkRoute.coordinates}
          strokeColor={colors.error}
          strokeWidth={4}
          lineCap="round"
        />

        {/* Path Actually Walked */}
        {session.breadcrumbs.length > 1 && (
          <Polyline
            coordinates={session.breadcrumbs}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
          />
        )}

        {/* Current Position (for mock mode) */}
        {useMockGPS && (
          <Marker coordinate={currentPosition} title="You are here">
            <View style={styles.mockMarker}>
              <CustomText style={styles.mockMarkerText}>📍</CustomText>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Stats Panel */}
      <Card style={styles.statsCard}>
        <Card.Content>
          {useMockGPS && (
            <View style={styles.mockBanner}>
              <CustomText style={styles.mockBannerText}>
                🎮 MOCK GPS MODE (Testing)
              </CustomText>
            </View>
          )}

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <CustomText variant="bodySmall" style={styles.statLabel}>
                Distance
              </CustomText>
              <CustomText variant="titleLarge" style={styles.statValue}>
                {formatDistance(session.distanceWalked)}
              </CustomText>
              <CustomText variant="bodySmall" style={styles.statSubtext}>
                / {formatDistance(walkRoute.totalDistance)}
              </CustomText>
            </View>

            <View style={styles.statItem}>
              <CustomText variant="bodySmall" style={styles.statLabel}>
                Time
              </CustomText>
              <CustomText variant="titleLarge" style={styles.statValue}>
                {formatTime(session.elapsedTime)}
              </CustomText>
            </View>

            <View style={styles.statItem}>
              <CustomText variant="bodySmall" style={styles.statLabel}>
                Pace
              </CustomText>
              <CustomText variant="titleLarge" style={styles.statValue}>
                {calculatePace()}
              </CustomText>
              <CustomText variant="bodySmall" style={styles.statSubtext}>
                min/km
              </CustomText>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Controls */}
      <View style={styles.controls}>
        <PrimaryButton
          mode="contained"
          onPress={handlePauseResume}
          style={[styles.button, styles.pauseButton]}
        >
          {session.isPaused ? "Resume" : "Pause"}
        </PrimaryButton>

        <PrimaryButton
          mode="contained-tonal"
          onPress={handleFinishWalk}
          style={styles.button}
        >
          Finish Walk
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  statsCard: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
  },
  mockBanner: {
    backgroundColor: colors.beige,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  mockBannerText: {
    textAlign: "center",
    color: colors.secondary,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "#6B7280",
    marginBottom: 4,
  },
  statValue: {
    fontWeight: "700",
    color: colors.beige,
  },
  statSubtext: {
    color: colors.grey,
    fontSize: 10,
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  pauseButton: {
    backgroundColor: colors.error,
  },
  mockMarker: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mockMarkerText: {
    fontSize: 32,
  },
});
