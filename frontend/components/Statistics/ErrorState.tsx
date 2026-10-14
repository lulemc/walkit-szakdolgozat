import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
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

const getCopy = (variant: ErrorVariant, providerName: string): Copy => {
  switch (variant) {
    case "denied":
      return {
        icon: "lock-closed-outline",
        title: "Health access needed",
        message: `Allow WalkIt to read your steps, walking distance and active energy in ${providerName} so we can show your statistics.`,
        action: "Open Settings",
      };
    case "notInstalled":
      return {
        icon: "download-outline",
        title: "Health Connect is required",
        message:
          "WalkIt reads your activity through Health Connect. Install or update it from the Play Store, then come back and try again.",
        action: "Get Health Connect",
      };
    case "unavailable":
      return {
        icon: "phone-portrait-outline",
        title: `${providerName} isn't available`,
        message:
          "Health data isn't available on this device or in this version of the app. Use the WalkIt app on iPhone (Apple Health) or Android (Health Connect).",
      };
    case "error":
      return {
        icon: "alert-circle-outline",
        title: "Couldn't load your statistics",
        message: `Something went wrong while reading ${providerName}. Please try again.`,
        action: "Try again",
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
  const copy = getCopy(variant, providerName);
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
