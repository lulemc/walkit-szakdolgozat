import SocialScreen from "@/screens/SocialScreen";
import { View, StyleSheet } from "react-native";

export default function Social() {
  return (
    <View style={styles.container}>
      <SocialScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
