import React, { ReactNode, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Card, Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isEmpty: boolean;
  emptyMessage: string;
  footer?: ReactNode;
  children: (width: number) => ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  isEmpty,
  emptyMessage,
  footer,
  children,
}) => {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width));
  };

  return (
    <Card mode="elevated" style={{ backgroundColor: theme.colors.surface }}>
      <Card.Content>
        <CustomText variant="titleMedium">{title}</CustomText>
        {subtitle ? (
          <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </CustomText>
        ) : null}

        <View style={styles.body} onLayout={handleLayout} testID="chart-area">
          {isEmpty ? (
            <View style={styles.empty}>
              <Icon source="bar-chart-outline" size={32} color={theme.colors.onSurfaceVariant} />
              <CustomText
                variant="bodyMedium"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
              >
                {emptyMessage}
              </CustomText>
            </View>
          ) : (
            width > 0 && children(width)
          )}
        </View>

        {!isEmpty && footer}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  body: {
    marginTop: 16,
    minHeight: 200,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: {
    textAlign: "center",
  },
});
