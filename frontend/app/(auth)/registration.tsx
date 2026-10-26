import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTextInput } from "@/hooks/form/useTextInput";
import { useAuth } from "@/context/AuthProvider";
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE } from "@/utils/passwordRules";
import {
  CustomText,
  RowLayout,
  CustomTextInput,
  ScreenContainer,
  PrimaryButton,
} from "@/components";
import { apiErrorMessage } from "@/utils/apiError";

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { register } = useAuth();

  const name = useTextInput();
  const email = useTextInput();
  const password = useTextInput();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!name.value || !email.value || !password.value) {
      setError("All fields are required");
      return;
    }
    if (password.value.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_MESSAGE);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await register(name.value, email.value, password.value);
    } catch (err) {
      setError(apiErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Create account
      </CustomText>
      <CustomTextInput
        label="Name"
        accessibilityLabel="Name"
        value={name.value}
        onChangeText={name.onChangeText}
      />
      <CustomTextInput
        label="Email"
        accessibilityLabel="Email"
        value={email.value}
        onChangeText={email.onChangeText}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <CustomTextInput
        label="Password"
        accessibilityLabel="Password"
        value={password.value}
        onChangeText={password.onChangeText}
        secureTextEntry
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <PrimaryButton
        mode="contained"
        onPress={onSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Register
      </PrimaryButton>
      <RowLayout>
        <CustomText>Already have an account?</CustomText>
        <PrimaryButton mode="text" onPress={() => router.replace("/login")}>
          <CustomText custom="link">Login</CustomText>
        </PrimaryButton>
      </RowLayout>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    marginTop: 12,
  },
});

export default RegisterScreen;
