import { useState } from "react";
import { View, StyleSheet } from "react-native";
import WalkPlannerScreen from "@/screens/WalkPlanner";
import ActiveWalkScreen from "@/screens/ActiveWalkScreen";
import MyRoutesScreen from "@/screens/MyRoutesScreen";
import type { Route } from "@/services/routeService";
import { useOptionalSocialNavigation } from "@/screens/social/socialNavigation";

/** The Home tab's views; they switch by state, like the Social tab's */
type HomeView = { screen: "planner" } | { screen: "myRoutes" } | { screen: "activeWalk"; route: Route };

const PLANNER: HomeView = { screen: "planner" };

export default function HomeScreen() {
  const [view, setView] = useState<HomeView>(PLANNER);
  const social = useOptionalSocialNavigation();

  // Group walks are planned in the Social tab, so only offer it where there is one
  const handlePlanGroupWalk = social
    ? (route: Route) => social.open({ screen: "createWalk", route })
    : undefined;

  const startWalk = (route: Route) => setView({ screen: "activeWalk", route });
  const showPlanner = () => setView(PLANNER);

  return (
    <View style={styles.container}>
      {view.screen === "activeWalk" ? (
        <ActiveWalkScreen route={view.route} onEndWalk={showPlanner} />
      ) : view.screen === "myRoutes" ? (
        <MyRoutesScreen
          onBack={showPlanner}
          onWalk={startWalk}
          onPlanGroupWalk={handlePlanGroupWalk}
        />
      ) : (
        <WalkPlannerScreen
          onStartWalk={startWalk}
          onPlanGroupWalk={handlePlanGroupWalk}
          onOpenMyRoutes={() => setView({ screen: "myRoutes" })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
