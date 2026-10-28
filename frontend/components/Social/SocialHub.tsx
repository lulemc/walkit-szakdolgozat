import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSocialNavigation } from "@/screens/social/socialNavigation";
import { CustomText } from "../CustomText";
import { FriendsSection } from "./FriendsSection";
import { GroupWalksSection } from "./GroupWalksSection";

type HubSection = "walks" | "friends";

const SECTION_BUTTONS = [
  { value: "walks", labelKey: "hub.walks", icon: "walk" },
  { value: "friends", labelKey: "hub.friends", icon: "people" },
] as const;

/**
 * The Social tab's start view: group walks and friends. Each section owns its
 * scroll view (for pull-to-refresh) and shows this header at the top.
 */
export const SocialHub: React.FC = () => {
  const [section, setSection] = useState<HubSection>("walks");
  const { navigate } = useSocialNavigation();
  const { t } = useTranslation("social");

  const header = (
    <View style={styles.header}>
      <CustomText variant="headlineMedium" style={styles.title}>
        {t("hub.title")}
      </CustomText>
      <SegmentedButtons
        value={section}
        onValueChange={(value) => setSection(value as HubSection)}
        buttons={SECTION_BUTTONS.map(({ labelKey, ...button }) => ({ ...button, label: t(labelKey) }))}
      />
    </View>
  );

  if (section === "friends") {
    return <FriendsSection header={header} />;
  }

  return (
    <GroupWalksSection
      header={header}
      onOpenWalk={(walkId) => navigate({ screen: "walkDetail", walkId })}
      onNewWalk={() => navigate({ screen: "createWalk" })}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 16,
  },
  title: {
    fontWeight: "700",
  },
});
