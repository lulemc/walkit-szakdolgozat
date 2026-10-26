import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { Route, RouteSummary } from "@/services/routeService";

/** The views inside the Social tab (it has no stack navigator; views switch by state) */
export type SocialView =
  | { screen: "hub" }
  | { screen: "walkDetail"; walkId: string }
  | { screen: "createWalk"; route?: RouteSummary }
  /** groupWalkId is set when walking a group walk's route */
  | { screen: "activeWalk"; route: Route; groupWalkId?: string };

export interface SocialNavigation {
  view: SocialView;
  navigate: (view: SocialView) => void;
  /** Back to the hub */
  goBack: () => void;
  /** Shows a view and brings the Social tab to the front, e.g. from the Home tab */
  open: (view: SocialView) => void;
}

export const SOCIAL_HUB: SocialView = { screen: "hub" };

const SocialNavigationContext = createContext<SocialNavigation | null>(null);

interface SocialNavigationProviderProps {
  /** The view to start on (the hub by default) */
  initialView?: SocialView;
  /** Called by open(), to switch to the Social tab */
  onOpen?: () => void;
  children: ReactNode;
}

/**
 * Holds the Social tab's current view. It sits above the tabs so other tabs
 * can open a Social view, like "Plan group walk" on the Home tab.
 */
export const SocialNavigationProvider = ({
  initialView = SOCIAL_HUB,
  onOpen,
  children,
}: SocialNavigationProviderProps) => {
  const [view, setView] = useState<SocialView>(initialView);

  const goBack = useCallback(() => setView(SOCIAL_HUB), []);
  const open = useCallback(
    (nextView: SocialView) => {
      setView(nextView);
      onOpen?.();
    },
    [onOpen],
  );
  const navigation = useMemo(
    () => ({ view, navigate: setView, goBack, open }),
    [view, goBack, open],
  );

  return (
    <SocialNavigationContext.Provider value={navigation}>
      {children}
    </SocialNavigationContext.Provider>
  );
};

/** The Social navigation, or null outside the provider (where there is no Social tab) */
export const useOptionalSocialNavigation = (): SocialNavigation | null =>
  useContext(SocialNavigationContext);

export const useSocialNavigation = (): SocialNavigation => {
  const navigation = useOptionalSocialNavigation();
  if (!navigation) {
    throw new Error("useSocialNavigation must be used inside the Social screen");
  }
  return navigation;
};
