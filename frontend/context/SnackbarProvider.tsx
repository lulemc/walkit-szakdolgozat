import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { Snackbar, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export const SNACKBAR_DURATION_MS = 4000;

export type SnackbarType = "info" | "error";

interface SnackbarApi {
  /** A short notice at the bottom that goes away by itself (no button to press) */
  showMessage: (message: string, options?: { type?: SnackbarType }) => void;
}

const SnackbarContext = createContext<SnackbarApi | null>(null);

/** Without the provider (e.g. a hook on its own), messages fall back to an alert */
const alertFallback: SnackbarApi = {
  showMessage: (message, { type = "info" } = {}) =>
    Alert.alert(type === "error" ? i18n.t("snackbar.errorTitle") : "WalkIt", message),
};

/** Short notices instead of alerts that block the screen */
export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [current, setCurrent] = useState<{ message: string; type: SnackbarType } | null>(null);
  const [visible, setVisible] = useState(false);

  const showMessage = useCallback<SnackbarApi["showMessage"]>((message, { type = "info" } = {}) => {
    setCurrent({ message, type });
    setVisible(true);
  }, []);

  const api = useMemo(() => ({ showMessage }), [showMessage]);
  const isError = current?.type === "error";

  return (
    <SnackbarContext.Provider value={api}>
      {children}
      <Snackbar
        visible={visible && current !== null}
        onDismiss={() => setVisible(false)}
        duration={SNACKBAR_DURATION_MS}
        action={{ label: t("actions.ok"), onPress: () => setVisible(false) }}
        style={[styles.snackbar, isError && { backgroundColor: theme.colors.error }]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={
          current
            ? isError
              ? t("snackbar.errorLabel", { message: current.message })
              : current.message
            : undefined
        }
      >
        {current?.message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarApi => useContext(SnackbarContext) ?? alertFallback;

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 80,
  },
});
