import Home from "@/app/(app)/home";
import Settings from "@/app/(app)/settings";
import { ScreenContainer } from "@/components";
import { ReactNode, useEffect, useState } from "react";
import { BottomNavigation } from "react-native-paper";
import { BaseRoute } from "react-native-paper/lib/typescript/components/BottomNavigation/BottomNavigation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "@/theme/colors";

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
    key: "settings",
    title: "Settings",
    focusedIcon: "settings",
    unfocusedIcon: "settings-outline",
  },
];

export const Navigation: React.FC<NavigationProps> = ({ children }) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState(routesArray);

  const renderScene = BottomNavigation.SceneMap({
    home: () => <Home />,
    settings: () => <Settings />,
  });

  useEffect(() => {
    console.log(index);
  }, [index]);

  return (
    <ScreenContainer style={{ padding: 0 }}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        barStyle={{
          backgroundColor: colors.primary,
        }}
        shifting={false}
        activeColor={colors.secondary}
        inactiveColor={colors.secondary}
        activeIndicatorStyle={{ backgroundColor: colors.darkGreen }}
        renderScene={renderScene}
        renderIcon={(menu) => (
          <Ionicons
            name={
              (menu.focused
                ? menu.route.focusedIcon
                : menu.route.unfocusedIcon) as any
            }
            size={20}
            color={colors.secondary}
            backgroundColor={colors.primary}
          />
        )}
      ></BottomNavigation>
    </ScreenContainer>
  );
};
