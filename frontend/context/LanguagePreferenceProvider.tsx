import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { deviceLanguage, Language, LANGUAGES } from "@/i18n";

/** Use the phone's language, or always English or Hungarian */
export type LanguagePreference = "system" | Language;

export const LANGUAGE_PREFERENCE_KEY = "walkit.language";
const PREFERENCES: LanguagePreference[] = ["system", ...LANGUAGES];

interface LanguagePreferenceApi {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => Promise<void>;
}

export const LanguagePreferenceContext = createContext<LanguagePreferenceApi | null>(null);

// Changing to the current language would still re-render every translated text
const apply = async (preference: LanguagePreference) => {
  const language = preference === "system" ? deviceLanguage() : preference;
  if (i18n.language !== language) await i18n.changeLanguage(language);
};

/** The language choice from Settings, remembered on the phone */
export const LanguagePreferenceProvider = ({ children }: { children: ReactNode }) => {
  const [preference, setPreferenceState] = useState<LanguagePreference>("system");

  // State is only updated in the promise callback, after reading the stored choice
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY).then(
      (stored) => {
        const known = PREFERENCES.includes(stored as LanguagePreference);
        if (known) setPreferenceState(stored as LanguagePreference);
        apply(known ? (stored as LanguagePreference) : "system");
      },
      () => {
        // Can't read it: keep the phone's language
      },
    );
  }, []);

  const setPreference = useCallback(async (next: LanguagePreference) => {
    setPreferenceState(next);
    await apply(next);
    await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, next);
  }, []);

  const api = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <LanguagePreferenceContext.Provider value={api}>{children}</LanguagePreferenceContext.Provider>;
};

const followThePhone: LanguagePreferenceApi = { preference: "system", setPreference: async () => {} };

/** Without the provider (e.g. in a test) the app uses the phone's language */
export const useLanguagePreference = (): LanguagePreferenceApi =>
  useContext(LanguagePreferenceContext) ?? followThePhone;
