import Home from "@/app/(app)/home";
import Settings from "@/app/(app)/settings";
import Statistics from "@/app/(app)/statistics";
import Social from "@/app/(app)/social";
import { ScreenContainer } from "@/components";
import {
  SocialSummaryProvider,
  useSocialSummary,
} from "@/context/SocialSummaryProvider";
import { SocialNavigationProvider } from "@/screens/social/socialNavigation";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { BottomNavigation, useTheme } from "react-native-paper";
import { BaseRoute } from "react-native-paper/lib/typescript/components/BottomNavigation/BottomNavigation";

interface NavigationProps {
  children: ReactNode;
}

const routesArray: BaseRoute[] = [
  {
    key: "home",
    title: "Home",
    focusedIcon: "home",
    unfocusedIcon: "home-outline",
  },
  {
    key: "statistics",
    title: "Statistics",
    focusedIcon: "pie-chart",
    unfocusedIcon: "pie-chart-outline",
  },
  {
    key: "social",
    title: "Social",
    focusedIcon: "people",
    unfocusedIcon: "people-outline",
  },
  {
    key: "settings",
    title: "Settings",
    focusedIcon: "settings",
    unfocusedIcon: "settings-outline",
  },
];

const renderScene = BottomNavigation.SceneMap({
  home: () => <Home />,
  statistics: () => <Statistics />,
  social: () => <Social />,
  settings: () => <Settings />,
});

const NavigationBar: React.FC = () => {
  const [index, setIndex] = useState(0);
  const theme = useTheme();
  const { total, refresh } = useSocialSummary();

  // The Social tab's badge counts pending friend requests and walk invitations
  const routes = useMemo(
    () =>
      routesArray.map((route) =>
        route.key === "social"
          ? { ...route, badge: total > 0 ? total : false }
          : route,
      ),
    [total],
  );

  const handleIndexChange = useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      if (routesArray[nextIndex].key === "social") refresh();
    },
    [refresh],
  );

  // Other tabs can open a Social view, e.g. "Plan group walk" on Home
  const openSocialTab = useCallback(
    () =>
      handleIndexChange(
        routesArray.findIndex((route) => route.key === "social"),
      ),
    [handleIndexChange],
  );

  return (
    <SocialNavigationProvider onOpen={openSocialTab}>
      <ScreenContainer style={{ padding: 0 }}>
        <BottomNavigation
          navigationState={{ index, routes }}
          onIndexChange={handleIndexChange}
          barStyle={{
            backgroundColor: theme.colors.background,
          }}
          shifting={false}
          activeColor={theme.colors.onSurface}
          inactiveColor={theme.colors.onSurface}
          activeIndicatorStyle={{ backgroundColor: theme.colors.background }}
          renderScene={renderScene}
        ></BottomNavigation>
      </ScreenContainer>
    </SocialNavigationProvider>
  );
};

// The provider wraps the tabs so every screen inside can refresh the badge
export const Navigation: React.FC<NavigationProps> = () => (
  <SocialSummaryProvider>
    <NavigationBar />
  </SocialSummaryProvider>
);
