import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";

interface SocialPlaceholderProps {
  icon: string;
  title?: string;
  message: string;
  onBack?: () => void;
}

/** Stand-in for Social views that later issues fill in */
export const SocialPlaceholder: React.FC<SocialPlaceholderProps> = ({
  icon,
  title,
  message,
  onBack,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon source={icon} size={48} color={theme.colors.primary} />
      {title ? (
        <CustomText variant="titleLarge" style={styles.center}>
          {title}
        </CustomText>
      ) : null}
      <CustomText
        variant="bodyMedium"
        style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
      >
        {message}
      </CustomText>
      {onBack ? (
        <PrimaryButton mode="outlined" icon="arrow-back" onPress={onBack}>
          Back
        </PrimaryButton>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 32,
  },
  center: {
    textAlign: "center",
  },
});
