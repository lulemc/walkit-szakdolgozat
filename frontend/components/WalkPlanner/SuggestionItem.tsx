import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "@/components/CustomText";
import { PlaceSuggestion } from "@/types/walkPlanner";

interface SuggestionItemProps {
  suggestion: PlaceSuggestion;
  onPress: () => void;
}

export default function SuggestionItem({
  suggestion,
  onPress,
}: SuggestionItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: theme.colors.outlineVariant },
      ]}
      onPress={onPress}
    >
      <CustomText variant="bodyMedium" style={styles.mainText}>
        {suggestion.mainText}
      </CustomText>
      <CustomText variant="bodySmall" style={styles.secondaryText}>
        {suggestion.secondaryText}
      </CustomText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mainText: {
    fontWeight: "500",
    marginBottom: 4,
  },
  secondaryText: {
    opacity: 0.7,
    fontSize: 12,
  },
});
