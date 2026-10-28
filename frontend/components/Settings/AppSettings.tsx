import { View, StyleSheet } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { ThemePreference, useThemePreference } from "@/context/ThemePreferenceProvider";

const THEME_BUTTONS = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

export default function AppSettings() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">App Settings</CustomText>
      <View style={styles.setting}>
        <CustomText variant="labelLarge">Appearance</CustomText>
        <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          System follows your phone&apos;s light or dark mode.
        </CustomText>
        <SegmentedButtons
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
          buttons={THEME_BUTTONS}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
    gap: 12,
  },
  setting: {
    gap: 8,
  },
});
