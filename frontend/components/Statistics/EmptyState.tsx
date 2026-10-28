import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("statistics");

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Icon source="footsteps-outline" size={56} color={theme.colors.primary} />
        <CustomText variant="headlineSmall" style={styles.center}>
          {t("empty.title")}
        </CustomText>
        <CustomText
          variant="bodyLarge"
          style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
        >
          {t("empty.message", { provider: providerName })}
        </CustomText>

        <View style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Icon source="bulb-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <CustomText variant="bodySmall" style={styles.tipText}>
            {t("empty.tip", { provider: providerName })}
          </CustomText>
        </View>

        <PrimaryButton icon="refresh" onPress={onRefresh} loading={refreshing} disabled={refreshing}>
          {t("empty.refresh")}
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
