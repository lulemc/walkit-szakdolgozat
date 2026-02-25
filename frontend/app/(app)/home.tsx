import { useState } from "react";
import { View, StyleSheet } from "react-native";
import WalkPlannerScreen from "@/screens/WalkPlanner";
import ActiveWalkScreen from "@/screens/ActiveWalkScreen";
import type { Route } from "@/services/routeService";

export default function HomeScreen() {
  const [activeWalk, setActiveWalk] = useState<Route | null>(null);

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
        <WalkPlannerScreen onStartWalk={handleStartWalk} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
