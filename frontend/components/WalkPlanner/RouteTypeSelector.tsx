import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";

type RouteType = "circular" | "point-to-point";

interface RouteTypeSelectorProps {
  value: RouteType;
  onChange: (type: RouteType) => void;
}

export default function RouteTypeSelector({
  value,
  onChange,
}: RouteTypeSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.routeCard,
          {
            backgroundColor:
              value === "circular"
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
            borderColor:
              value === "circular" ? theme.colors.primary : "transparent",
          },
        ]}
        onPress={() => onChange("circular")}
      >
        <View style={styles.routeIcon}>
          <CustomText variant="headlineSmall">🔄</CustomText>
        </View>
        <View style={styles.routeContent}>
          <CustomText
            variant="titleSmall"
            style={[
              styles.routeTitle,
              {
                color:
                  value === "circular"
                    ? theme.colors.primary
                    : theme.colors.onSurface,
              },
            ]}
          >
            Circular Loop
          </CustomText>
          <CustomText
            variant="bodySmall"
            style={[
              styles.routeDescription,
              { opacity: value === "circular" ? 0.8 : 0.6 },
            ]}
          >
            Returns to start
          </CustomText>
        </View>
        {value === "circular" && (
          <View style={styles.checkmark}>
            <CustomText variant="titleSmall">✓</CustomText>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.routeCard,
          {
            backgroundColor:
              value === "point-to-point"
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
            borderColor:
              value === "point-to-point" ? theme.colors.primary : "transparent",
          },
        ]}
        onPress={() => onChange("point-to-point")}
      >
        <View style={styles.routeIcon}>
          <CustomText variant="headlineSmall">➡️</CustomText>
        </View>
        <View style={styles.routeContent}>
          <CustomText
            variant="titleSmall"
            style={[
              styles.routeTitle,
              {
                color:
                  value === "point-to-point"
                    ? theme.colors.primary
                    : theme.colors.onSurface,
              },
            ]}
          >
            Point-to-Point
          </CustomText>
          <CustomText
            variant="bodySmall"
            style={[
              styles.routeDescription,
              { opacity: value === "point-to-point" ? 0.8 : 0.6 },
            ]}
          >
            Different end point
          </CustomText>
        </View>
        {value === "point-to-point" && (
          <View style={styles.checkmark}>
            <CustomText variant="titleSmall">✓</CustomText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  routeIcon: {
    marginRight: 10,
  },
  routeContent: {
    flex: 1,
  },
  routeTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  routeDescription: {
    fontSize: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 150, 0, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
