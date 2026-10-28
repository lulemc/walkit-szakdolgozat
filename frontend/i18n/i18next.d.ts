import "i18next";
import type en from "./locales/en";

// t() only accepts keys that exist in the English texts
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof en;
  }
}
