import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../ScreenContainer";

const PULSE_MS = 700;

export const LoadingState: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation("statistics");
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timing = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: PULSE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
    const pulse = Animated.loop(Animated.sequence([timing(0.45), timing(1)]));

    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  const block = [styles.block, { backgroundColor: theme.colors.surfaceVariant }];

  return (
    <ScreenContainer scrollable style={styles.screen}>
      <Animated.View
        style={{ opacity }}
        testID="statistics-loading"
        accessibilityLabel={t("loading")}
        accessibilityRole="progressbar"
      >
        <View style={[block, styles.title]} />
        <View style={[block, styles.subtitle]} />
        <View style={[block, styles.hero]} />
        <View style={styles.row}>
          <View style={[block, styles.metric]} />
          <View style={[block, styles.metric]} />
        </View>
        <View style={[block, styles.tabs]} />
        <View style={[block, styles.chart]} />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  block: {
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    width: "45%",
    height: 28,
    marginBottom: 8,
  },
  subtitle: {
    width: "65%",
    height: 16,
  },
  hero: {
    height: 170,
    borderRadius: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  metric: {
    flex: 1,
    height: 110,
    borderRadius: 16,
  },
  tabs: {
    height: 40,
    borderRadius: 20,
  },
  chart: {
    height: 260,
    borderRadius: 16,
  },
});
