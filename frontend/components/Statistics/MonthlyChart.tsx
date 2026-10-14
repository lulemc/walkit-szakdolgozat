import React from "react";
import { View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "react-native-paper";
import type { HealthData } from "@/services/health/types";
import { formatCompactNumber } from "@/utils/healthFormatters";
import { AxisLabels } from "./AxisLabels";
import { CHART_SECTIONS, fitLine, niceMax, pointX, Y_AXIS_WIDTH } from "./chartLayout";

interface MonthlyChartProps {
  data: HealthData[];
  goal: number;
  width: number;
}

const CHART_HEIGHT = 180;
const LABEL_EVERY_DAYS = 7;

const formatDayMonth = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}`;

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, goal, width }) => {
  const theme = useTheme();
  const layout = fitLine(width, data.length);
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 10 };

  // Label every 7th day plus the last one, skipping it if it would crowd the previous label
  const lastIndex = data.length - 1;
  const labelIndexes = data
    .map((_, index) => index)
    .filter((index) => index % LABEL_EVERY_DAYS === 0 && lastIndex - index >= 3);
  if (lastIndex >= 0) labelIndexes.push(lastIndex);

  return (
    <View>
      <LineChart
        data={data.map((day) => ({ value: day.steps }))}
        width={layout.chartWidth}
        height={CHART_HEIGHT}
        spacing={layout.spacing}
        initialSpacing={layout.initialSpacing}
        endSpacing={layout.initialSpacing}
        disableScroll
        areaChart
        curved
        color={theme.colors.primary}
        thickness={3}
        startFillColor={theme.colors.primary}
        endFillColor={theme.colors.primary}
        startOpacity={0.35}
        endOpacity={0.02}
        hideDataPoints
        maxValue={niceMax(
          data.map((d) => d.steps),
          goal * 1.1,
        )}
        noOfSections={CHART_SECTIONS}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        yAxisThickness={0}
        yAxisTextStyle={axisText}
        xAxisColor={theme.colors.outlineVariant}
        xAxisLabelsHeight={0}
        rulesType="dashed"
        rulesColor={theme.colors.outlineVariant}
        formatYLabel={(label) => formatCompactNumber(Number(label))}
        showReferenceLine1
        referenceLine1Position={goal}
        referenceLine1Config={{
          color: theme.colors.onSurfaceVariant,
          type: "dashed",
          dashWidth: 4,
          dashGap: 4,
          thickness: 1,
          labelText: "Goal",
          labelTextStyle: axisText,
        }}
        isAnimated
      />
      <AxisLabels
        labels={labelIndexes.map((index) => ({
          x: pointX(layout, index),
          text: formatDayMonth(data[index].date),
        }))}
      />
    </View>
  );
};
