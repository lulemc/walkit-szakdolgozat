import { Appbar } from "react-native-paper";
import { CustomText } from "../CustomText";
import { StyleSheet } from "react-native";

export const Header = () => {
  return (
    <Appbar.Header statusBarHeight={1} style={styles.appHeader}>
      <CustomText>Header</CustomText>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  appHeader: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
