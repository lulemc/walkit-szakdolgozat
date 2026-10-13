import React from "react";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "react-native-paper";
import type { HealthData } from "@/services/healthKitService";
import { colors } from "@/theme/colors";
import { formatCompactNumber, getDayAbbreviation } from "@/utils/healthFormatters";
import { CHART_SECTIONS, fitBars, niceMax, Y_AXIS_WIDTH } from "./chartLayout";

interface WeeklyChartProps {
  data: HealthData[];
  goal: number;
  width: number;
}

const CHART_HEIGHT = 200;

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, goal, width }) => {
  const theme = useTheme();
  const layout = fitBars(width, data.length, 0.55);
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 10 };

  const chartData = data.map((day, index) => {
    const isToday = index === data.length - 1;
    return {
      value: day.steps,
      label: getDayAbbreviation(day.date),
      frontColor: isToday ? colors.secondary : theme.colors.primary,
      labelTextStyle: {
        ...axisText,
        color: isToday ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
        fontWeight: isToday ? ("700" as const) : ("400" as const),
      },
    };
  });

  return (
    <BarChart
      data={chartData}
      width={layout.chartWidth}
      height={CHART_HEIGHT}
      barWidth={layout.barWidth}
      spacing={layout.spacing}
      initialSpacing={layout.initialSpacing}
      endSpacing={layout.initialSpacing}
      disableScroll
      roundedTop
      maxValue={niceMax(
        data.map((d) => d.steps),
        goal * 1.1,
      )}
      noOfSections={CHART_SECTIONS}
      yAxisLabelWidth={Y_AXIS_WIDTH}
      yAxisThickness={0}
      yAxisTextStyle={axisText}
      xAxisColor={theme.colors.outlineVariant}
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
  );
};
