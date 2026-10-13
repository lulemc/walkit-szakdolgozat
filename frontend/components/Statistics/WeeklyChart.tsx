// frontend/src/components/Statistics/WeeklyChart.tsx
// Improved weekly chart with gradient bars

import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { BarChart } from "react-native-gifted-charts";

interface WeeklyChartProps {
  data: Array<{ date: Date; steps: number }>;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const dayNamesFull = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const chartData = data.map((item, index) => {
    const isToday = index === data.length - 1;
    const steps = item.steps;

    return {
      value: steps,
      label: dayNames[item.date.getDay()],
      frontColor: isToday ? "#007AFF" : "#60A5FA",
      gradientColor: isToday ? "#4DA3FF" : "#93C5FD",
      labelTextStyle: {
        color: isToday ? "#007AFF" : "#6B7280",
        fontSize: 12,
        fontWeight: (isToday ? "700" : "400") as any,
      },
      topLabelComponent: () => (
        <Text style={[styles.topLabel, isToday && styles.todayLabel]}>
          {(steps / 1000).toFixed(1)}k
        </Text>
      ),
    };
  });

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={300}
        height={220}
        barWidth={32}
        spacing={20}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
        noOfSections={4}
        maxValue={Math.max(...data.map((d) => d.steps)) * 1.2}
        isAnimated
        animationDuration={1000}
        showGradient
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  topLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "600" as any,
    marginBottom: 4,
  },
  todayLabel: {
    color: "#007AFF",
    fontWeight: "700" as any,
  },
});
