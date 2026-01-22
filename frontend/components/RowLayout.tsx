import React from "react";
import { StyleSheet, View } from "react-native";

export const RowLayout: React.FC<{
  children: React.ReactNode;
  style?: object;
}> = ({ children, style }) => {
  return <View style={[style, styles.row]}>{children}</View>;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
});
