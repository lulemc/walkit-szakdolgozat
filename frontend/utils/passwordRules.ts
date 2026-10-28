import i18n from "@/i18n";

/** Same minimum as the backend (backend/src/utils/validation.js) */
export const MIN_PASSWORD_LENGTH = 8;

/** In the app's current language, so it is built when shown */
export const passwordTooShortMessage = (): string =>
  i18n.t("auth:password.tooShort", { min: MIN_PASSWORD_LENGTH });
