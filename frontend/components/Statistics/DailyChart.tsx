import React from "react";
import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import type { HourlySteps } from "@/services/health/types";
import { colors } from "@/theme/colors";
import { formatCompactNumber } from "@/utils/healthFormatters";
import { AxisLabels } from "./AxisLabels";
import { barCenter, CHART_SECTIONS, fitBars, niceMax, Y_AXIS_WIDTH } from "./chartLayout";

interface DailyChartProps {
  data: HourlySteps[];
  width: number;
}

const CHART_HEIGHT = 180;
const LABELLED_HOURS = [0, 6, 12, 18];

export const DailyChart: React.FC<DailyChartProps> = ({ data, width }) => {
  const theme = useTheme();
  const { t } = useTranslation("statistics");
  const layout = fitBars(width, data.length);
  const currentHour = new Date().getHours();
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 10 };

  const chartData = data.map(({ hour, steps }) => ({
    value: steps,
    // Highlight the hour in progress
    frontColor: hour === currentHour ? colors.secondary : theme.colors.primary,
  }));

  return (
    <View>
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
        maxValue={niceMax(data.map((d) => d.steps))}
        noOfSections={CHART_SECTIONS}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        yAxisThickness={0}
        yAxisTextStyle={axisText}
        xAxisColor={theme.colors.outlineVariant}
        xAxisLabelsHeight={0}
        rulesType="dashed"
        rulesColor={theme.colors.outlineVariant}
        formatYLabel={(label) => formatCompactNumber(Number(label))}
        isAnimated
      />
      <AxisLabels
        labels={LABELLED_HOURS.map((hour) => ({ x: barCenter(layout, hour), text: t("charts.hour", { hour }) }))}
      />
    </View>
  );
};
