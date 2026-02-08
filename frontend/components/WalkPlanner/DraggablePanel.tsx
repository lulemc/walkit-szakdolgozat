import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { CustomText } from "@/components/CustomText";

interface DraggablePanelProps {
  children: React.ReactNode;
  panGesture: any;
  animatedPanelStyle: any;
  scrollRef: React.RefObject<ScrollView>;
  scrollEnabled: boolean;
}

export default function DraggablePanel({
  children,
  panGesture,
  animatedPanelStyle,
  scrollRef,
  scrollEnabled,
}: DraggablePanelProps) {
  const theme = useTheme();

  return (
    <Animated.View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surface },
        animatedPanelStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.dragHandleContainer}>
          <View style={styles.dragHandle} />
          <CustomText variant="bodySmall" style={styles.dragHint}>
            Drag to adjust
          </CustomText>
        </View>
      </GestureDetector>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    marginBottom: 4,
  },
  dragHint: {
    opacity: 0.5,
    fontSize: 11,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
});
