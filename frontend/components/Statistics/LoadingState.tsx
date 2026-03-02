import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const LoadingState: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.skeleton, styles.titleSkeleton]} />
        <View style={[styles.skeleton, styles.subtitleSkeleton]} />
      </View>

      {/* Today's Cards Skeleton */}
      <View style={styles.cardsContainer}>
        <View style={[styles.skeleton, styles.cardSkeleton]} />
        <View style={[styles.skeleton, styles.cardSkeleton]} />
        <View style={[styles.skeleton, styles.cardSkeleton]} />
      </View>

      {/* Tabs Skeleton */}
      <View style={styles.tabsContainer}>
        <View style={[styles.skeleton, styles.tabSkeleton]} />
        <View style={[styles.skeleton, styles.tabSkeleton]} />
        <View style={[styles.skeleton, styles.tabSkeleton]} />
      </View>

      {/* Chart Skeleton */}
      <View style={[styles.skeleton, styles.chartSkeleton]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  skeleton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
  },
  titleSkeleton: {
    width: 150,
    height: 28,
    marginBottom: 8,
  },
  subtitleSkeleton: {
    width: 100,
    height: 16,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  cardSkeleton: {
    width: width - 32,
    height: 120,
    marginBottom: 12,
    borderRadius: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  tabSkeleton: {
    width: (width - 48) / 3,
    height: 40,
    borderRadius: 20,
  },
  chartSkeleton: {
    width: width - 32,
    height: 250,
    borderRadius: 16,
  },
});
