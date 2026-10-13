// frontend/src/components/Statistics/MonthlyChart.tsx
// Improved monthly chart with area fill and data points

import React from "react";
import { View, StyleSheet } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface MonthlyChartProps {
  data: Array<{ date: Date; steps: number }>;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const chartData = data.map((item, index) => ({
    value: item.steps,
    label: index % 5 === 0 ? `${index + 1}` : "",
    labelTextStyle: { color: "#6B7280", fontSize: 10 },
    dataPointText:
      index === data.length - 1 ? `${(item.steps / 1000).toFixed(1)}k` : "",
    dataPointLabelComponent:
      index === data.length - 1
        ? () => (
            <View style={styles.dataPointLabel}>
              {/* Last point indicator */}
            </View>
          )
        : undefined,
  }));

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={300}
        height={220}
        color="#007AFF"
        thickness={3}
        curved
        areaChart
        startFillColor="rgba(0, 122, 255, 0.3)"
        endFillColor="rgba(0, 122, 255, 0.05)"
        startOpacity={0.9}
        endOpacity={0.2}
        hideRules
        hideYAxisText={false}
        yAxisColor="#E5E7EB"
        yAxisThickness={0}
        yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
        xAxisColor="#E5E7EB"
        xAxisThickness={1}
        xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10 }}
        noOfSections={4}
        maxValue={Math.max(...data.map((d) => d.steps)) * 1.15}
        isAnimated
        animationDuration={1200}
        animateOnDataChange
        dataPointsHeight={6}
        dataPointsWidth={6}
        dataPointsColor="#007AFF"
        dataPointsRadius={3}
        hideDataPoints={false}
        showVerticalLines={false}
        verticalLinesColor="#E5E7EB"
        spacing={10}
        initialSpacing={10}
        endSpacing={20}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  dataPointLabel: {
    backgroundColor: "#007AFF",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
