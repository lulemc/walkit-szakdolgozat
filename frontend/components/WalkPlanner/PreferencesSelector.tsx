import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Switch, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "@/components/CustomText";
import type { RoutePreferences } from "@/services/routeService";

interface PreferencesSelectorProps {
  preferences: RoutePreferences;
  onChange: (preferences: RoutePreferences) => void;
}

interface PreferenceOption {
  key: keyof RoutePreferences;
  icon: string;
}

// Labels and descriptions are planner:preferences.<key>, translated when shown
const PREFERENCE_OPTIONS: PreferenceOption[] = [
  { key: "parks", icon: "🌳" },
  { key: "waterfront", icon: "💧" },
  { key: "scenic", icon: "🏛️" },
  { key: "quietStreets", icon: "🤫" },
  { key: "beach", icon: "🏖️" },
  { key: "uphill", icon: "⛰️" },
  { key: "mountain", icon: "🏔️" },
  { key: "avoidHighways", icon: "🚫" },
];

const PreferencesSelector: React.FC<PreferencesSelectorProps> = ({
  preferences,
  onChange,
}) => {
  const theme = useTheme();
  const { t } = useTranslation("planner");
  const activeCount = Object.values(preferences).filter(Boolean).length;

  const togglePreference = (key: keyof RoutePreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  return (
    <View style={styles.container}>
      {PREFERENCE_OPTIONS.map((option) => {
        const label = t(`preferences.${option.key}.label`);
        const description = t(`preferences.${option.key}.description`);
        return (
          <TouchableOpacity
            key={option.key}
            testID={`preference-${option.key}`}
            style={[
              styles.preferenceItem,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
              preferences[option.key] && {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary,
              },
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
                      { color: theme.colors.onSurface },
                      preferences[option.key] && [
                        styles.preferenceLabelActive,
                        { color: theme.colors.onPrimaryContainer },
                      ],
                    ]}
                  >
                    {label}
                  </CustomText>
                  <CustomText
                    variant="bodySmall"
                    style={[styles.preferenceDescription, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {description}
                  </CustomText>
                </View>
              </View>
              <Switch
                accessibilityLabel={label}
                accessibilityHint={description}
                value={preferences[option.key]}
                onValueChange={() => togglePreference(option.key)}
                color={theme.colors.primary}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      {activeCount > 0 && (
        <View style={[styles.activeCount, { backgroundColor: theme.colors.surfaceVariant }]}>
          <CustomText variant="bodySmall" style={[styles.activeCountText, { color: theme.colors.onSurfaceVariant }]}>
            {t("activePreferences", { count: activeCount })}
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
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
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
    fontSize: 16,
  },
  preferenceText: {
    flex: 1,
    gap: 2,
  },
  preferenceLabel: {
    fontWeight: "500",
  },
  preferenceLabelActive: {
    fontWeight: "600",
  },
  preferenceDescription: {
    fontSize: 12,
  },
  activeCount: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activeCountText: {
    fontWeight: "500",
  },
});

export default PreferencesSelector;
