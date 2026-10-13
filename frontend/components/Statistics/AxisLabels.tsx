import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { Y_AXIS_WIDTH } from "./chartLayout";

const LABEL_WIDTH = 36;

interface AxisLabelsProps {
  // x is measured from the start of the plot area (after the y-axis labels)
  labels: { x: number; text: string }[];
}

export const AxisLabels: React.FC<AxisLabelsProps> = ({ labels }) => {
  const theme = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {labels.map(({ x, text }) => (
        <CustomText
          key={text}
          variant="labelSmall"
          style={[
            styles.label,
            { left: x - LABEL_WIDTH / 2, color: theme.colors.onSurfaceVariant },
          ]}
        >
          {text}
        </CustomText>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    height: 16,
    marginLeft: Y_AXIS_WIDTH,
    marginTop: 4,
  },
  label: {
    position: "absolute",
    width: LABEL_WIDTH,
    textAlign: "center",
    fontSize: 10,
  },
});
