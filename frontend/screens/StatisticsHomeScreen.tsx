import React, { useEffect, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { SafeAreaInsetsContext, useSafeAreaInsets } from "react-native-safe-area-context";
import { WalkDetailView } from "@/components/Walks/WalkDetailView";
import { WalkHistorySection } from "@/components/Walks/WalkHistorySection";
import StatisticsScreen from "./StatisticsScreen";

type StatisticsTab = "activity" | "walks";

const TAB_BUTTONS = [
  { value: "activity", label: "Activity", icon: "pulse" },
  { value: "walks", label: "Walks", icon: "walk" },
];

/**
 * The Statistics tab: health activity, and the walks saved in WalkIt (with
 * each walk's detail). The switch sits above both, since the health view
 * replaces its whole screen while loading or when health data is unavailable.
 */
export default function StatisticsHomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<StatisticsTab>("activity");
  const [openWalkId, setOpenWalkId] = useState<string | null>(null);

  // Android back closes an open walk; otherwise the system handles it as usual
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "walks" || !openWalkId) return false;
      setOpenWalkId(null);
      return true;
    });
    return () => subscription.remove();
  }, [tab, openWalkId]);

  let content: React.ReactNode;
  if (tab === "activity") {
    content = <StatisticsScreen />;
  } else if (openWalkId) {
    content = <WalkDetailView walkId={openWalkId} onBack={() => setOpenWalkId(null)} />;
  } else {
    content = <WalkHistorySection onOpenWalk={setOpenWalkId} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <SegmentedButtons
          value={tab}
          onValueChange={(value) => setTab(value as StatisticsTab)}
          buttons={TAB_BUTTONS}
        />
      </View>
      {/* The bar already keeps clear of the notch, so the views below don't need to */}
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
        <View style={styles.container}>{content}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
