import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <CustomText variant="bodyMedium" style={styles.text}>
        👆 Tap on map to set {type === "start" ? "start" : "destination"}{" "}
        location
      </CustomText>
      <TouchableOpacity
        onPress={onCancel}
        style={[
          styles.cancelButton,
          { backgroundColor: theme.colors.errorContainer },
        ]}
      >
        <CustomText variant="bodySmall" style={{ color: theme.colors.error }}>
          Cancel
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
