import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { CustomText } from "../CustomText";
import { SocialPlaceholder } from "./SocialPlaceholder";

type HubSection = "walks" | "friends";

const SECTION_BUTTONS = [
  { value: "walks", label: "Walks", icon: "walk" },
  { value: "friends", label: "Friends", icon: "people" },
];

/** The Social tab's start view: group walks and friends */
export const SocialHub: React.FC = () => {
  const [section, setSection] = useState<HubSection>("walks");

  return (
    <View style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Social
      </CustomText>

      <SegmentedButtons
        value={section}
        onValueChange={(value) => setSection(value as HubSection)}
        buttons={SECTION_BUTTONS}
      />

      {section === "walks" ? (
        <SocialPlaceholder icon="walk-outline" message="Your group walks will appear here." />
      ) : (
        <SocialPlaceholder icon="people-outline" message="Your friends will appear here." />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontWeight: "700",
  },
});
