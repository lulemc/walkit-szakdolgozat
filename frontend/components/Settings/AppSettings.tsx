import { View, StyleSheet } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { CustomText } from "../CustomText";
import { ThemePreference, useThemePreference } from "@/context/ThemePreferenceProvider";
import { LanguagePreference, useLanguagePreference } from "@/context/LanguagePreferenceProvider";

export default function AppSettings() {
  const theme = useTheme();
  const { t } = useTranslation(["settings", "common"]);
  const { preference, setPreference } = useThemePreference();
  const language = useLanguagePreference();

  const themeButtons = [
    { value: "system", label: t("app.themeSystem"), icon: "phone-portrait-outline" },
    { value: "light", label: t("app.themeLight"), icon: "sunny-outline" },
    { value: "dark", label: t("app.themeDark"), icon: "moon-outline" },
  ];
  // Each language is named in itself, so it can be found from either one
  const languageButtons = [
    { value: "system", label: t("app.languageSystem") },
    { value: "en", label: t("common:languageName", { lng: "en" }) },
    { value: "hu", label: t("common:languageName", { lng: "hu" }) },
  ];
  const muted = { color: theme.colors.onSurfaceVariant };

  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">{t("app.title")}</CustomText>
      <View style={styles.setting}>
        <CustomText variant="labelLarge">{t("app.appearance")}</CustomText>
        <CustomText variant="bodySmall" style={muted}>
          {t("app.appearanceHint")}
        </CustomText>
        <SegmentedButtons
          value={preference}
          onValueChange={(value) => setPreference(value as ThemePreference)}
          buttons={themeButtons}
        />
      </View>
      <View style={styles.setting}>
        <CustomText variant="labelLarge">{t("app.language")}</CustomText>
        <SegmentedButtons
          value={language.preference}
          onValueChange={(value) => language.setPreference(value as LanguagePreference)}
          buttons={languageButtons}
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
