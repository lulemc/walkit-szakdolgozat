import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "@/components/CustomText";

interface MapSelectionIndicatorProps {
  type: "start" | "destination";
  onCancel: () => void;
}

export default function MapSelectionIndicator({
  type,
  onCancel,
}: MapSelectionIndicatorProps) {
  const theme = useTheme();
  const { t } = useTranslation(["planner", "common"]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <CustomText variant="bodyMedium" style={styles.text}>
        {type === "start" ? t("mapPick.start") : t("mapPick.destination")}
      </CustomText>
      <TouchableOpacity
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel={t("mapPick.cancelLabel")}
        style={[
          styles.cancelButton,
          { backgroundColor: theme.colors.errorContainer },
        ]}
      >
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          {t("common:actions.cancel")}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    flex: 1,
    fontWeight: "600",
    marginRight: 12,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
