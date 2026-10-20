import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { PrimaryButton, ScreenContainer } from "@/components";
import { useSocialNavigation } from "@/screens/social/socialNavigation";
import { CustomText } from "../CustomText";
import { FriendsSection } from "./FriendsSection";
import { SocialPlaceholder } from "./SocialPlaceholder";

type HubSection = "walks" | "friends";

const SECTION_BUTTONS = [
  { value: "walks", label: "Walks", icon: "walk" },
  { value: "friends", label: "Friends", icon: "people" },
];

/**
 * The Social tab's start view: group walks and friends. Each section owns its
 * scroll view (for pull-to-refresh) and shows this header at the top.
 */
export const SocialHub: React.FC = () => {
  const [section, setSection] = useState<HubSection>("walks");
  const { navigate } = useSocialNavigation();

  const header = (
    <View style={styles.header}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Social
      </CustomText>
      <SegmentedButtons
        value={section}
        onValueChange={(value) => setSection(value as HubSection)}
        buttons={SECTION_BUTTONS}
      />
    </View>
  );

  if (section === "friends") {
    return <FriendsSection header={header} />;
  }

  return (
    <ScreenContainer scrollable style={styles.screen} contentContainerStyle={styles.content}>
      {header}
      <PrimaryButton icon="add" onPress={() => navigate({ screen: "createWalk" })}>
        New group walk
      </PrimaryButton>
      <SocialPlaceholder icon="walk-outline" message="Your group walks will appear here." />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  header: {
    gap: 16,
  },
  title: {
    fontWeight: "700",
  },
});
