import React from "react";
import { View, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { CustomText } from "./CustomText";
import { PrimaryButton } from "./Button";
import { useTheme } from "react-native-paper";

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationModalProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <CustomText variant="titleMedium" style={styles.title}>
              {title}
            </CustomText>

            <CustomText variant="bodyMedium" style={styles.message}>
              {message}
            </CustomText>

            <View style={styles.buttonContainer}>
              <PrimaryButton
                mode="outlined"
                onPress={onClose}
                style={styles.button}
              >
                {cancelText}
              </PrimaryButton>

              <PrimaryButton
                mode="contained"
                onPress={onConfirm}
                style={styles.button}
              >
                {confirmText}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    backgroundColor: "red",
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
