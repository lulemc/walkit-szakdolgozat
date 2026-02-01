import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { CustomText } from "../CustomText";
import { CustomTextInput } from "../Inputs/CustomTextInput";
import { PrimaryButton } from "../Button";
import { CustomDatePicker } from "../Inputs/CustomDatePicker";
import { CustomRadioButton } from "../Inputs/CustomRadioButton";
import { activityLevelOptions, sexOptions } from "@/enums/enums";

export default function ProfileSettings() {
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [date, setDate] = useState<Date>(new Date());

  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">Profile Settings</CustomText>
      <CustomText variant="bodySmall">
        Here you can update your profile settings such as email, personal infos,
        and password.
      </CustomText>
      <View style={styles.inputContainer}>
        <CustomTextInput
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          label="Username"
        ></CustomTextInput>
      </View>
      <View style={styles.rowInputContainer}>
        <CustomDatePicker
          label="Date of birth"
          value={date}
          onChange={() => setDate}
        ></CustomDatePicker>
      </View>
      <View style={styles.inputContainer}>
        <CustomRadioButton
          options={sexOptions}
          value={sexOptions[0].value}
          onValueChange={() => setDateOfBirth}
          label="Sex"
        />
      </View>
      <View style={styles.inputContainer}>
        <CustomTextInput
          keyboardType="numeric"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          label="Height"
        ></CustomTextInput>
      </View>
      <View style={styles.inputContainer}>
        <CustomTextInput
          keyboardType="numeric"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          label="Weight"
        ></CustomTextInput>
      </View>
      <View style={styles.inputContainer}>
        <CustomRadioButton
          options={activityLevelOptions}
          value={activityLevelOptions[0].value}
          onValueChange={() => setDateOfBirth}
          label="Acivity Level"
        />
      </View>
      <PrimaryButton mode="text" onPress={() => {}}>
        Change Email
      </PrimaryButton>

      <PrimaryButton mode="text" onPress={() => {}}>
        Change Password
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 15,
  },
  inputContainer: {
    marginTop: 10,
  },
  rowInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
