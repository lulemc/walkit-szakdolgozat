import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { formatLastUpdated } from "@/utils/healthFormatters";
import { CustomText } from "../CustomText";

interface StatisticsHeaderProps {
  lastUpdated: Date | null;
  providerName: string;
}

export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({
  lastUpdated,
  providerName,
}) => {
  const theme = useTheme();
  const { t } = useTranslation("statistics");

  return (
    <View style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        {t("title")}
      </CustomText>
      <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {lastUpdated
          ? t("header.updated", { time: formatLastUpdated(lastUpdated) })
          : t("header.source", { provider: providerName })}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontWeight: "700",
  },
});
