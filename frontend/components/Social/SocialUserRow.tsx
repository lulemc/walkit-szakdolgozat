import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";

interface SocialUserRowProps {
  name: string;
  subtitle?: string;
  /** Buttons shown on the right */
  children?: ReactNode;
  /** Read out for the person (avatar and text); the buttons stay separate */
  accessibilityLabel?: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

/** One person in a social list: avatar, name, a line of detail and actions */
export const SocialUserRow: React.FC<SocialUserRowProps> = ({
  name,
  subtitle,
  children,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={styles.person}
        accessible={accessibilityLabel !== undefined}
        accessibilityLabel={accessibilityLabel}
      >
        <Avatar.Text size={40} label={initialsOf(name)} />
        <View style={styles.text}>
          <CustomText variant="titleSmall">{name}</CustomText>
          {subtitle ? (
            <CustomText
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {subtitle}
            </CustomText>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  person: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
