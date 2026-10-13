import React from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

export type ErrorVariant = "denied" | "unavailable" | "error";

interface ErrorStateProps {
  variant: ErrorVariant;
  error?: Error | null;
  onRetry: () => void;
  retrying?: boolean;
}

const COPY: Record<ErrorVariant, { icon: string; title: string; message: string; action?: string }> = {
  denied: {
    icon: "lock-closed-outline",
    title: "Health access needed",
    message:
      "Allow WalkIt to read your steps, walking distance and active energy so we can show your statistics.",
    action: "Open Settings",
  },
  unavailable: {
    icon: "phone-portrait-outline",
    title: "Apple Health isn't available",
    message:
      "Statistics come from Apple Health, which only works in the WalkIt iOS app. It isn't available in Expo Go, on Android or on the web.",
  },
  error: {
    icon: "alert-circle-outline",
    title: "Couldn't load your statistics",
    message: "Something went wrong while reading Apple Health. Please try again.",
    action: "Try again",
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({ variant, error, onRetry, retrying }) => {
  const theme = useTheme();
  const copy = COPY[variant];
  const handleAction = variant === "denied" ? () => Linking.openSettings() : onRetry;

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
