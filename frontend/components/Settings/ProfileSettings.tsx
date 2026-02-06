import React, { useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { CustomText } from "../CustomText";
import { CustomTextInput } from "../Inputs/CustomTextInput";
import { PrimaryButton } from "../Button";
import { CustomDatePicker } from "../Inputs/CustomDatePicker";
import { CustomRadioButton } from "../Inputs/CustomRadioButton";
import { activityLevelOptions, sexOptions } from "@/enums/enums";
import { User } from "@/models/User";
import UserService from "@/services/userService";
import { userStorage } from "@/utils/userStorage";
import ConfirmationModal from "../ConformationModal";
import ChangePasswordModal from "./ChangePasswordModal";

interface ProfileSettingsProps extends User {
  onProfileUpdate?: (updatedUser: User) => void;
}

export default function ProfileSettings({
  onProfileUpdate,
  ...user
}: ProfileSettingsProps) {
  console.log(user);
  const [userName, setUserName] = useState(user.name || "");
  const [dateOfBirth, setDateOfBirth] = useState<Date>(
    user.dateOfBirth ? new Date(user.dateOfBirth) : new Date(),
  );
  const [sex, setSex] = useState(user.sex || sexOptions[0].value);
  const [height, setHeight] = useState(user.height?.toString() || "");
  const [weight, setWeight] = useState(user.weight?.toString() || "");
  const [activityLevel, setActivityLevel] = useState(
    user.activityLevel || activityLevelOptions[0].value,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      const updateData = {
        name: userName,
        dateOfBirth: dateOfBirth.toISOString(),
        sex,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        activityLevel,
      };

      const response = await UserService.updateUserProfile(
        user._id,
        updateData,
      );
      await userStorage.setUser(response.user);

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeClick = () => {
    setShowPasswordConfirmation(true);
  };

  const handlePasswordConfirm = () => {
    setShowPasswordConfirmation(false);
    setShowPasswordModal(true);
  };

  const handlePasswordChanged = () => {
    console.log("Password changed successfully");
  };

  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">Profile Settings</CustomText>
      <CustomText variant="bodySmall">
        Here you can update your profile settings such as email, personal infos,
        and password.
      </CustomText>

      <View style={styles.inputContainer}>
        <CustomTextInput
          value={userName}
          onChangeText={setUserName}
          label="Username"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomDatePicker
          label="Date of birth"
          value={dateOfBirth}
          onChange={setDateOfBirth}
          disabled={isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomRadioButton
          options={sexOptions}
          value={sex}
          onValueChange={setSex}
          label="Sex"
          disabled={isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomTextInput
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          label="Height (cm)"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomTextInput
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          label="Weight (kg)"
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomRadioButton
          options={activityLevelOptions}
          value={activityLevel}
          onValueChange={setActivityLevel}
          label="Activity Level"
          disabled={isLoading}
        />
      </View>

      <View style={styles.saveButtonContainer}>
        <PrimaryButton
          mode="contained"
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : "Save Profile"}
        </PrimaryButton>
      </View>

      <PrimaryButton mode="text" onPress={handlePasswordChangeClick}>
        Change Password
      </PrimaryButton>

      <ConfirmationModal
        visible={showPasswordConfirmation}
        onClose={() => setShowPasswordConfirmation(false)}
        onConfirm={handlePasswordConfirm}
        title="Change Password"
        message="Are you sure you want to change your password?"
        confirmText="Yes, change password"
        cancelText="Cancel"
      />

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={user._id}
        onPasswordChanged={handlePasswordChanged}
      />
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
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
});
