import { useState } from "react";
import { View, StyleSheet } from "react-native";
import WalkPlannerScreen from "@/screens/WalkPlanner";
import ActiveWalkScreen from "@/screens/ActiveWalkScreen";
import type { Route } from "@/services/routeService";
import { useOptionalSocialNavigation } from "@/screens/social/socialNavigation";

export default function HomeScreen() {
  const [activeWalk, setActiveWalk] = useState<Route | null>(null);
  const social = useOptionalSocialNavigation();

  // Group walks are planned in the Social tab, so only offer it where there is one
  const handlePlanGroupWalk = social
    ? (route: Route) => social.open({ screen: "createWalk", route })
    : undefined;

  const handleStartWalk = (route: Route) => {
    setActiveWalk(route);
  };

  const handleEndWalk = () => {
    setActiveWalk(null);
  };

  return (
    <View style={styles.container}>
      {activeWalk ? (
        <ActiveWalkScreen route={activeWalk} onEndWalk={handleEndWalk} />
      ) : (
        <WalkPlannerScreen
          onStartWalk={handleStartWalk}
          onPlanGroupWalk={handlePlanGroupWalk}
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
