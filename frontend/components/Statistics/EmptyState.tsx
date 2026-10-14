import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

interface EmptyStateProps {
  providerName: string;
  onRefresh: () => void;
  refreshing: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ providerName, onRefresh, refreshing }) => {
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
          {`We couldn't find any steps, distance or calories in ${providerName} for the last 30 days.`}
        </CustomText>

        <View style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Icon source="bulb-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <CustomText variant="bodySmall" style={styles.tipText}>
            {`Make sure your phone is recording activity and that WalkIt has permission to read it in ${providerName}.`}
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
