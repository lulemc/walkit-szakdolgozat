import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

interface EmptyStateProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh, refreshing }) => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Icon source="footsteps-outline" size={56} color={theme.colors.primary} />
        <CustomText variant="headlineSmall" style={styles.center}>
          No activity yet
        </CustomText>
        <CustomText
          variant="bodyLarge"
          style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
        >
          {"We couldn't find any steps, distance or calories in Apple Health for the last 30 days."}
        </CustomText>

        <View style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Icon source="bulb-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <CustomText variant="bodySmall" style={styles.tipText}>
            Make sure your iPhone is recording activity, and that WalkIt can read it in Settings →
            Health → Data Access & Devices.
          </CustomText>
        </View>

        <PrimaryButton icon="refresh" onPress={onRefresh} loading={refreshing} disabled={refreshing}>
          Refresh
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: 16,
  },
  center: {
    textAlign: "center",
  },
  tip: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
  },
});
