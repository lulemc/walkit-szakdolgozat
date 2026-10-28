import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CustomText } from "../CustomText";
import { CustomTextInput } from "../Inputs/CustomTextInput";
import { PrimaryButton } from "../Button";
import UserService from "@/services/userService";
import { storage } from "@/utils/storage";
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE } from "@/utils/passwordRules";
import { useTheme } from "react-native-paper";
import { apiErrorMessage } from "@/utils/apiError";
import { useSnackbar } from "@/context/SnackbarProvider";

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onPasswordChanged?: () => void;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  userId,
  onPasswordChanged,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // The server's answer when the change fails; shown in the dialog (a snackbar would be behind it)
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { showMessage } = useSnackbar();

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const theme = useTheme();

  const validatePassword = (password: string): string => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return PASSWORD_TOO_SHORT_MESSAGE;
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handleChangePassword = async () => {
    setSubmitError(null);
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    let hasErrors = false;
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
      hasErrors = true;
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
      hasErrors = true;
    } else {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
        hasErrors = true;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasErrors = true;
    }

    // Only compared when both are filled in, so empty fields say "required"
    if (currentPassword && currentPassword === newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);

      const response = await UserService.changePassword(userId, {
        currentPassword,
        newPassword,
      });

      if (response.token) {
        await storage.setToken(response.token);
      }

      setIsLoading(false);
      handleClose();

      showMessage("Your password has been changed.");

      onPasswordChanged?.();
    } catch (error) {
      setIsLoading(false);
      setSubmitError(
        apiErrorMessage(
          error,
          "Failed to change password. Please check your current password and try again.",
        ),
      );
    }
  };

  const handleClose = () => {
    setSubmitError(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
        // Tapping outside closes it; screen readers use Cancel (or back) instead,
        // since an accessible backdrop would hide everything inside it
        accessible={false}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer} accessible={false}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <CustomText variant="titleMedium" style={styles.title}>
              Change Password
            </CustomText>

            <CustomText variant="bodySmall" style={styles.description}>
              Please enter your current password and choose a new secure
              password.
            </CustomText>

            <View style={styles.inputContainer}>
              <CustomTextInput
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
                error={!!errors.currentPassword}
              />
              {errors.currentPassword ? (
                <CustomText variant="bodySmall" style={styles.errorText}>
                  {errors.currentPassword}
                </CustomText>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <CustomTextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
                error={!!errors.newPassword}
              />
              {errors.newPassword ? (
                <CustomText variant="bodySmall" style={styles.errorText}>
                  {errors.newPassword}
                </CustomText>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <CustomTextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword ? (
                <CustomText variant="bodySmall" style={styles.errorText}>
                  {errors.confirmPassword}
                </CustomText>
              ) : null}
            </View>

            <View style={styles.passwordRequirements}>
              <CustomText variant="bodySmall" style={styles.requirementsTitle}>
                Password requirements:
              </CustomText>
              <CustomText variant="bodySmall" style={styles.requirement}>
                • At least 8 characters
              </CustomText>
              <CustomText variant="bodySmall" style={styles.requirement}>
                • One uppercase letter
              </CustomText>
              <CustomText variant="bodySmall" style={styles.requirement}>
                • One lowercase letter
              </CustomText>
              <CustomText variant="bodySmall" style={styles.requirement}>
                • One number
              </CustomText>
            </View>

            {submitError ? (
              <CustomText variant="bodySmall" style={styles.errorText} accessibilityRole="alert">
                {submitError}
              </CustomText>
            ) : null}

            <View style={styles.buttonContainer}>
              <PrimaryButton
                mode="outlined"
                onPress={handleClose}
                disabled={isLoading}
                style={styles.button}
              >
                Cancel
              </PrimaryButton>

              <PrimaryButton
                mode="contained"
                onPress={handleChangePassword}
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  "Change Password"
                )}
              </PrimaryButton>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.7,
  },
  inputContainer: {
    marginBottom: 16,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  passwordRequirements: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  requirement: {
    opacity: 0.7,
    marginLeft: 8,
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
