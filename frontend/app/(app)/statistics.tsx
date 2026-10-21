import StatisticsHomeScreen from "@/screens/StatisticsHomeScreen";
import { View, StyleSheet } from "react-native";

export default function Statistics() {
  return (
    <View style={styles.container}>
      <StatisticsHomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
