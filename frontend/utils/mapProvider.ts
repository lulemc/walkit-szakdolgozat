import { Platform } from "react-native";
import { PROVIDER_GOOGLE } from "react-native-maps";
import Constants, { ExecutionEnvironment } from "expo-constants";

// Expo Go on iOS doesn't include Google Maps, so fall back to Apple Maps there
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const mapProvider =
  isExpoGo && Platform.OS === "ios" ? undefined : PROVIDER_GOOGLE;
