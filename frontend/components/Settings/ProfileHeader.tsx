import { StyleSheet, View } from "react-native";
import { CustomText } from "../CustomText";
import { Avatar } from "react-native-paper";
import { User } from "@/models/User";

export default function ProfileHeader(user: User) {
  return (
    <View style={styles.container}>
      <View style={{ position: "relative" }}>
        <Avatar.Image size={100} source={require("../../assets/cat.png")} />
      </View>
      <View style={styles.editButtonContainer}>
        <CustomText variant="titleSmall">{user?.name}</CustomText>
        <CustomText variant="bodySmall">{user?.email}</CustomText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "transparent",
    display: "flex",
    flexDirection: "row",
    gap: 15,
    paddingVertical: 15,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  editButtonContainer: {
    gap: 6,
    flexDirection: "column",
    alignItems: "flex-start",
  },
});
