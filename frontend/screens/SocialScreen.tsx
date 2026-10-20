import React, { useEffect } from "react";
import { BackHandler } from "react-native";
import { ScreenContainer } from "@/components";
import { CreateGroupWalk } from "@/components/Social/CreateGroupWalk";
import { SocialHub } from "@/components/Social/SocialHub";
import { GroupWalkDetailView } from "@/components/Social/GroupWalkDetailView";
import ActiveWalkScreen from "@/screens/ActiveWalkScreen";
import {
  SocialNavigationProvider,
  SocialView,
  useOptionalSocialNavigation,
  useSocialNavigation,
} from "@/screens/social/socialNavigation";

interface SocialScreenProps {
  /** The view to open on (the hub by default) */
  initialView?: SocialView;
}

/**
 * The Social tab. Views switch by state, like the Home tab does: the hub
 * (walks and friends) and the walk detail, create-walk and active-walk views.
 * The view state normally comes from the provider above the tabs, so other
 * tabs can open a view; without one (e.g. on its own) it keeps its own.
 */
export default function SocialScreen({ initialView }: SocialScreenProps) {
  const sharedNavigation = useOptionalSocialNavigation();
  if (sharedNavigation) return <SocialViews />;

  return (
    <SocialNavigationProvider initialView={initialView}>
      <SocialViews />
    </SocialNavigationProvider>
  );
}

function SocialViews() {
  const { view, navigate, goBack } = useSocialNavigation();

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
  if (view.screen === "hub") return <SocialHub />;

  // The detail view scrolls itself (for pull-to-refresh)
  if (view.screen === "walkDetail") {
    return <GroupWalkDetailView key={view.walkId} walkId={view.walkId} onBack={goBack} />;
  }

  // The walk screen manages its own full-screen layout
  if (view.screen === "activeWalk") {
    return <ActiveWalkScreen route={view.route} onEndWalk={goBack} />;
  }

  return (
    <ScreenContainer scrollable style={{ padding: 16 }}>
      <CreateGroupWalk
        // A new route from the planner starts the flow over
        key={view.route?._id}
        initialRoute={view.route}
        onCreated={(walk) => navigate({ screen: "walkDetail", walkId: walk._id })}
        onCancel={goBack}
      />
    </ScreenContainer>
  );
}
