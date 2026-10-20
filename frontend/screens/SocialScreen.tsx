import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler } from "react-native";
import { ScreenContainer } from "@/components";
import { SocialHub } from "@/components/Social/SocialHub";
import { SocialPlaceholder } from "@/components/Social/SocialPlaceholder";
import ActiveWalkScreen from "@/screens/ActiveWalkScreen";
import { SocialNavigationContext, SocialView } from "@/screens/social/socialNavigation";

const HUB: SocialView = { screen: "hub" };

interface SocialScreenProps {
  /** The view to open on (the hub by default) */
  initialView?: SocialView;
}

/**
 * The Social tab. Views switch by state, like the Home tab does: the hub
 * (walks and friends) and the walk detail, create-walk and active-walk views.
 */
export default function SocialScreen({ initialView = HUB }: SocialScreenProps) {
  const [view, setView] = useState<SocialView>(initialView);

  const goBack = useCallback(() => setView(HUB), []);
  const navigation = useMemo(() => ({ view, navigate: setView, goBack }), [view, goBack]);

  // Android back returns to the hub; on the hub the system handles it as usual
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (view.screen === "hub") return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [view, goBack]);

  // The hub's sections scroll themselves (for pull-to-refresh)
  if (view.screen === "hub") {
    return (
      <SocialNavigationContext.Provider value={navigation}>
        <SocialHub />
      </SocialNavigationContext.Provider>
    );
  }

  // The walk screen manages its own full-screen layout
  if (view.screen === "activeWalk") {
    return (
      <SocialNavigationContext.Provider value={navigation}>
        <ActiveWalkScreen route={view.route} onEndWalk={goBack} />
      </SocialNavigationContext.Provider>
    );
  }

  return (
    <SocialNavigationContext.Provider value={navigation}>
      <ScreenContainer scrollable style={{ padding: 16 }}>
        {view.screen === "walkDetail" && (
          <SocialPlaceholder
            icon="walk-outline"
            title="Group walk"
            message="The walk's details will appear here."
            onBack={goBack}
          />
        )}
        {view.screen === "createWalk" && (
          <SocialPlaceholder
            icon="add-circle-outline"
            title="Plan a group walk"
            message="Planning a group walk will be possible here."
            onBack={goBack}
          />
        )}
      </ScreenContainer>
    </SocialNavigationContext.Provider>
  );
}
