import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Follow the phone's setting, or always light or dark */
export type ThemePreference = "system" | "light" | "dark";

export const THEME_PREFERENCE_KEY = "walkit.themePreference";
const PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

interface ThemePreferenceApi {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const ThemePreferenceContext = createContext<ThemePreferenceApi | null>(null);

/** The light/dark choice from Settings, remembered on the phone */
export const ThemePreferenceProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  // State is only updated in the promise callback, after reading the stored choice
  useEffect(() => {
    AsyncStorage.getItem(THEME_PREFERENCE_KEY).then(
      (stored) => {
        if (PREFERENCES.includes(stored as ThemePreference)) setPreferenceState(stored as ThemePreference);
      },
      () => {
        // Can't read it: follow the phone
      },
    );
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
  }, []);

  const api = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemePreferenceContext.Provider value={api}>{children}</ThemePreferenceContext.Provider>;
};

const followThePhone: ThemePreferenceApi = { preference: "system", setPreference: async () => {} };

/** Without the provider (e.g. in a test) the app follows the phone */
export const useThemePreference = (): ThemePreferenceApi =>
  useContext(ThemePreferenceContext) ?? followThePhone;
