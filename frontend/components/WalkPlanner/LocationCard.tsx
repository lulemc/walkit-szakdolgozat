import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import ActionButton from "../ActionButton";
import type { Location } from "@/types/walkPlanner";

interface LocationCardProps {
  location: Location | null;
  isCurrentLocation: boolean;
  showActions: boolean;
  onUseCurrentLocation?: () => void;
  onEnableSearch: () => void;
  onEnableMapSelection: () => void;
  onClear?: () => void;
}

export default function LocationCard({
  location,
  isCurrentLocation,
  showActions,
  onUseCurrentLocation,
  onEnableSearch,
  onEnableMapSelection,
  onClear,
}: LocationCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <View style={styles.info}>
        <CustomText variant="bodyMedium" style={styles.name}>
          {location?.name || "Not set"}
        </CustomText>

        {location?.address && (
          <CustomText variant="bodySmall" style={styles.address}>
            {location.address}
          </CustomText>
        )}

        {isCurrentLocation && (
          <CustomText variant="bodySmall" style={styles.badge}>
            📍 Current Location
          </CustomText>
        )}

        {!location && (
          <CustomText
            variant="bodySmall"
            style={[styles.hint, { color: theme.colors.error }]}
          >
            Search or pick on map to set location
          </CustomText>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onUseCurrentLocation && (
            <ActionButton
              label="Current"
              onPress={onUseCurrentLocation}
              active={isCurrentLocation}
            />
          )}
          <ActionButton label="🔍 Search" onPress={onEnableSearch} />
          <ActionButton label="🗺️ Map" onPress={onEnableMapSelection} />
          {onClear && location && (
            <ActionButton label="Clear" onPress={onClear} variant="error" />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  info: {
    gap: 4,
  },
  name: {
    fontWeight: "500",
  },
  address: {
    opacity: 0.7,
    fontSize: 12,
  },
  badge: {
    color: "#0a7ea4",
    fontWeight: "500",
    marginTop: 4,
  },
  hint: {
    fontStyle: "italic",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
});
