import { CustomText, ScreenContainer } from "@/components";
import AppSettings from "@/components/Settings/AppSettings";
import ProfileHeader from "@/components/Settings/ProfileHeader";
import ProfileSettings from "@/components/Settings/ProfileSettings";
import { useState, useEffect } from "react";
import { Divider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Settings() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Simulate an async operation, e.g., fetching data
  }, []);

  return (
    <ScreenContainer scrollable={true}>
      <ProfileHeader />
      <Divider />
      <ProfileSettings />
      <Divider />
      <AppSettings />
    </ScreenContainer>
  );
}
