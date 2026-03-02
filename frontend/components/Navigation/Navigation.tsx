import Home from "@/app/(app)/home";
import Settings from "@/app/(app)/settings";
import Statistics from "@/app/(app)/statistics";
import { ScreenContainer } from "@/components";
import { ReactNode, useState } from "react";
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
    key: "settings",
    title: "Settings",
    focusedIcon: "settings",
    unfocusedIcon: "settings-outline",
  },
];

export const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState(routesArray);
  const theme = useTheme();

  const renderScene = BottomNavigation.SceneMap({
    home: () => <Home />,
    settings: () => <Settings />,
    statistics: () => <Statistics />,
  });

  return (
    <ScreenContainer style={{ padding: 0 }}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
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
  );
};
