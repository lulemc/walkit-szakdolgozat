import { createContext, useContext } from "react";
import type { Route } from "@/services/routeService";

/** The views inside the Social tab (it has no stack navigator; views switch by state) */
export type SocialView =
  | { screen: "hub" }
  | { screen: "walkDetail"; walkId: string }
  | { screen: "createWalk"; route?: Route }
  | { screen: "activeWalk"; route: Route };

export interface SocialNavigation {
  view: SocialView;
  navigate: (view: SocialView) => void;
  /** Back to the hub */
  goBack: () => void;
}

export const SocialNavigationContext = createContext<SocialNavigation | null>(null);

export const useSocialNavigation = (): SocialNavigation => {
  const navigation = useContext(SocialNavigationContext);
  if (!navigation) {
    throw new Error("useSocialNavigation must be used inside the Social screen");
  }
  return navigation;
};
