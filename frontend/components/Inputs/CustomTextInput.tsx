import React from "react";
import { StyleSheet } from "react-native";
import { TextInput, TextInputProps, useTheme } from "react-native-paper";

interface CustomTextInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: boolean;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "none",
  error = false,
  ...props
}) => {
  const theme = useTheme();

  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      error={error}
      style={styles.input}
      theme={{ colors: { primary: theme.colors.primary } }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
});
