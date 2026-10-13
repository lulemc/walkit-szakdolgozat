import StatisticsScreen from "@/screens/StatisticsScreen";
import { View, StyleSheet } from "react-native";

export default function Statistics() {
  return (
    <View style={styles.container}>
      <StatisticsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
