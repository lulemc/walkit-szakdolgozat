import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Extends app.json with values that must not be committed. The Google Maps
 * SDK keys come from the environment: `.env` locally, EAS environment
 * variables for builds (see .env.example).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosMapsKey = process.env.GOOGLE_MAPS_IOS_KEY;
  const androidMapsKey = process.env.GOOGLE_MAPS_ANDROID_KEY;

  return {
    ...config,
    // Always set in app.json; repeated because the type requires them
    name: config.name ?? "frontend",
    slug: config.slug ?? "frontend",
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        ...(iosMapsKey && { googleMapsApiKey: iosMapsKey }),
      },
    },
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        ...(androidMapsKey && { googleMaps: { apiKey: androidMapsKey } }),
      },
    },
  };
};
