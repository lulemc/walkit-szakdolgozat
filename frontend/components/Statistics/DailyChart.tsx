// frontend/src/components/Statistics/DailyChart.tsx
// Improved daily chart with tooltips

import React from "react";
import { View, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";

interface DailyChartProps {
  data: Array<{ hour: number; steps: number }>;
}

export const DailyChart: React.FC<DailyChartProps> = ({ data }) => {
  const chartData = data
    .filter((item) => item.steps > 0)
    .map((item) => ({
      value: item.steps,
      label: item.hour % 3 === 0 ? `${item.hour}h` : "", // Show every 3rd hour
      frontColor: "#007AFF",
      gradientColor: "#4DA3FF",
      spacing: 2,
      labelWidth: 30,
      labelTextStyle: { color: "#6B7280", fontSize: 10 },
      topLabelComponent: () => (
        <View style={styles.tooltip}>{/* Tooltip will show on press */}</View>
      ),
    }));

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={300}
        height={200}
        barWidth={16}
        spacing={8}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={1}
        yAxisThickness={0}
        yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
        noOfSections={4}
        maxValue={Math.max(...data.map((d) => d.steps)) * 1.1}
        isAnimated
        animationDuration={800}
        showGradient
        gradientColor="#4DA3FF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  tooltip: {
    backgroundColor: "#1F2937",
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
});
