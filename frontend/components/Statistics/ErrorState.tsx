import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

export type ErrorVariant = "denied" | "unavailable" | "notInstalled" | "error";

interface ErrorStateProps {
  variant: ErrorVariant;
  providerName: string;
  error?: Error | null;
  onRetry: () => void;
  onOpenSettings: () => void;
  onInstall: () => void;
  retrying?: boolean;
}

interface Copy {
  icon: string;
  title: string;
  message: string;
  action?: string;
}

const getCopy = (
  variant: ErrorVariant,
  providerName: string,
  t: TFunction<["statistics", "common"]>,
): Copy => {
  const provider = { provider: providerName };
  switch (variant) {
    case "denied":
      return {
        icon: "lock-closed-outline",
        title: t("errors.denied.title"),
        message: t("errors.denied.message", provider),
        action: t("errors.denied.action"),
      };
    case "notInstalled":
      return {
        icon: "download-outline",
        title: t("errors.notInstalled.title"),
        message: t("errors.notInstalled.message"),
        action: t("errors.notInstalled.action"),
      };
    case "unavailable":
      return {
        icon: "phone-portrait-outline",
        title: t("errors.unavailable.title", provider),
        message: t("errors.unavailable.message"),
      };
    case "error":
      return {
        icon: "alert-circle-outline",
        title: t("errors.error.title"),
        message: t("errors.error.message", provider),
        action: t("common:actions.retry"),
      };
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant,
  providerName,
  error,
  onRetry,
  onOpenSettings,
  onInstall,
  retrying,
}) => {
  const theme = useTheme();
  const { t } = useTranslation(["statistics", "common"]);
  const copy = getCopy(variant, providerName, t);
  const handleAction =
    variant === "denied" ? onOpenSettings : variant === "notInstalled" ? onInstall : onRetry;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Icon source={copy.icon} size={56} color={theme.colors.primary} />
        <CustomText variant="headlineSmall" style={styles.center}>
          {copy.title}
        </CustomText>
        <CustomText
          variant="bodyLarge"
          style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
        >
          {copy.message}
        </CustomText>

        {copy.action ? (
          <PrimaryButton onPress={handleAction} loading={retrying} disabled={retrying}>
            {copy.action}
          </PrimaryButton>
        ) : null}

        {__DEV__ && error ? (
          <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Debug: {error.message}
          </CustomText>
        ) : null}
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
});
