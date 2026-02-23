import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Switch, useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import type { RoutePreferences } from "@/services/routeService";

interface PreferencesSelectorProps {
  preferences: RoutePreferences;
  onChange: (preferences: RoutePreferences) => void;
}

interface PreferenceOption {
  key: keyof RoutePreferences;
  label: string;
  icon: string;
  description: string;
}

const PREFERENCE_OPTIONS: PreferenceOption[] = [
  {
    key: "parks",
    label: "Parks",
    icon: "🌳",
    description: "Route through parks and green spaces",
  },
  {
    key: "waterfront",
    label: "Waterfront",
    icon: "💧",
    description: "Walk along rivers, lakes, or coastline",
  },
  {
    key: "scenic",
    label: "Scenic",
    icon: "🏛️",
    description: "Pass by landmarks and points of interest",
  },
  {
    key: "quietStreets",
    label: "Quiet Streets",
    icon: "🤫",
    description: "Prefer calm, low-traffic areas",
  },
  {
    key: "beach",
    label: "Beach",
    icon: "🏖️",
    description: "Walk along beaches and shorelines",
  },
  {
    key: "uphill",
    label: "Uphill",
    icon: "⛰️",
    description: "Include elevation gain for a workout",
  },
  {
    key: "mountain",
    label: "Mountain Trails",
    icon: "🏔️",
    description: "Hiking paths and mountain routes",
  },
  {
    key: "avoidHighways",
    label: "Avoid Highways",
    icon: "🚫",
    description: "Stay away from major roads",
  },
];

const PreferencesSelector: React.FC<PreferencesSelectorProps> = ({
  preferences,
  onChange,
}) => {
  const theme = useTheme();

  const togglePreference = (key: keyof RoutePreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <View style={styles.container}>
      {PREFERENCE_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.preferenceItem,
            preferences[option.key] && styles.preferenceItemActive,
          ]}
          onPress={() => togglePreference(option.key)}
          activeOpacity={0.7}
        >
          <View style={styles.preferenceContent}>
            <View style={styles.preferenceHeader}>
              <CustomText style={styles.preferenceIcon}>
                {option.icon}
              </CustomText>
              <View style={styles.preferenceText}>
                <CustomText
                  variant="bodyMedium"
                  style={[
                    styles.preferenceLabel,
                    preferences[option.key] && styles.preferenceLabelActive,
                  ]}
                >
                  {option.label}
                </CustomText>
                <CustomText
                  variant="bodySmall"
                  style={styles.preferenceDescription}
                >
                  {option.description}
                </CustomText>
              </View>
            </View>
            <Switch
              value={preferences[option.key]}
              onValueChange={() => togglePreference(option.key)}
              color={theme.colors.primary}
            />
          </View>
        </TouchableOpacity>
      ))}

      {Object.values(preferences).filter(Boolean).length > 0 && (
        <View style={styles.activeCount}>
          <CustomText variant="bodySmall" style={styles.activeCountText}>
            {Object.values(preferences).filter(Boolean).length} preference
            {Object.values(preferences).filter(Boolean).length !== 1
              ? "s"
              : ""}{" "}
            active
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  preferenceItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  preferenceItemActive: {
    borderColor: "#007AFF",
    backgroundColor: "#F0F9FF",
  },
  preferenceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  preferenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  preferenceIcon: {
    fontSize: 24,
  },
  preferenceText: {
    flex: 1,
    gap: 2,
  },
  preferenceLabel: {
    fontWeight: "500",
    color: "#374151",
  },
  preferenceLabelActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  preferenceDescription: {
    color: "#6B7280",
    fontSize: 12,
  },
  activeCount: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    alignItems: "center",
  },
  activeCountText: {
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default PreferencesSelector;
