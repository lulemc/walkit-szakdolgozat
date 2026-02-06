import { View, StyleSheet } from "react-native";
import { CustomText } from "../CustomText";

export default function AppSettings() {
  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">App Settings</CustomText>
      <CustomText variant="bodySmall">
        Here you can update application settings - later
      </CustomText>
      <CustomText variant="labelSmall">
        App Theme / Dark Mode - later
      </CustomText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 15,
  },
  inputContainer: {
    marginTop: 10,
  },
});
