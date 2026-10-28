import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { CustomText } from "../CustomText";
import { CustomTextInput } from "../Inputs/CustomTextInput";
import { PrimaryButton } from "../Button";
import { CustomDatePicker } from "../Inputs/CustomDatePicker";
import { CustomRadioButton } from "../Inputs/CustomRadioButton";
import { activityLevelOptions, sexOptions } from "@/enums/enums";
import { User } from "@/types/User";
import UserService from "@/services/userService";
import { userStorage } from "@/utils/userStorage";
import ConfirmationModal from "../ConformationModal";
import ChangePasswordModal from "./ChangePasswordModal";
import { apiErrorMessage } from "@/utils/apiError";
import { useSnackbar } from "@/context/SnackbarProvider";
import type SettingsTexts from "@/i18n/locales/en/settings";

interface ProfileSettingsProps extends User {
  onProfileUpdate?: (updatedUser: User) => void;
}

export default function ProfileSettings({
  onProfileUpdate,
  ...user
}: ProfileSettingsProps) {
  const { showMessage } = useSnackbar();
  const { t } = useTranslation(["settings", "common"]);
  // The option lists keep the stored values; their labels follow the app language
  const translatedSexOptions = sexOptions.map((option) => ({
    ...option,
    label: t(`sexOptions.${option.value as keyof (typeof SettingsTexts)["sexOptions"]}`),
  }));
  const translatedActivityLevels = activityLevelOptions.map((option) => ({
    ...option,
    label: t(`activityLevels.${option.value as keyof (typeof SettingsTexts)["activityLevels"]}`),
  }));
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

      const updatedUser = await UserService.updateUserProfile(
        user._id,
        updateData,
      );
      await userStorage.setUser(updatedUser);
      // So the settings screen shows the new profile without reloading
      onProfileUpdate?.(updatedUser);

      showMessage(t("profile.saved"));
    } catch (error) {
      showMessage(apiErrorMessage(error, t("profile.saveFailed")), { type: "error" });
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

  return (
    <View style={styles.container}>
      <CustomText variant="titleMedium">{t("profile.title")}</CustomText>
      <CustomText variant="bodySmall">{t("profile.description")}</CustomText>

      <View style={styles.inputContainer}>
        <CustomTextInput
          value={userName}
          onChangeText={setUserName}
          label={t("profile.username")}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomDatePicker
          label={t("profile.dateOfBirth")}
          value={dateOfBirth}
          onChange={setDateOfBirth}
          disabled={isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomRadioButton
          options={translatedSexOptions}
          value={sex}
          onValueChange={setSex}
          label={t("profile.sex")}
          disabled={isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomTextInput
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          label={t("profile.height")}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomTextInput
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          label={t("profile.weight")}
          editable={!isLoading}
        />
      </View>

      <View style={styles.inputContainer}>
        <CustomRadioButton
          options={translatedActivityLevels}
          value={activityLevel}
          onValueChange={setActivityLevel}
          label={t("profile.activityLevel")}
          disabled={isLoading}
        />
      </View>

      <View style={styles.saveButtonContainer}>
        <PrimaryButton
          mode="contained"
          onPress={handleSaveProfile}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : t("profile.save")}
        </PrimaryButton>
      </View>

      <PrimaryButton mode="text" onPress={handlePasswordChangeClick}>
        {t("profile.changePassword")}
      </PrimaryButton>

      <ConfirmationModal
        visible={showPasswordConfirmation}
        onClose={() => setShowPasswordConfirmation(false)}
        onConfirm={handlePasswordConfirm}
        title={t("profile.changePassword")}
        message={t("profile.confirmChangeMessage")}
        confirmText={t("profile.confirmChange")}
        cancelText={t("common:actions.cancel")}
      />

      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={user._id}
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
