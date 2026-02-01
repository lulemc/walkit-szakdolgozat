import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { HelperText } from "react-native-paper";
import { useTextInput } from "@/hooks/form/useTextInput";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthProvider";
import {
  CustomText,
  RowLayout,
  CustomTextInput,
  ScreenContainer,
  PrimaryButton,
} from "@/components";

const LoginScreen: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const router = useRouter();
  const email = useTextInput();
  const password = useTextInput();

  const onSubmit = async () => {
    if (!email.value || !password.value) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await login(email.value, password.value);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Login
      </CustomText>

      <CustomTextInput
        label="Email"
        value={email.value}
        onChangeText={email.onChangeText}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <CustomTextInput
        label="Password"
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
        Sign In
      </PrimaryButton>

      <RowLayout>
        <CustomText>Don’t have an account?</CustomText>
        <PrimaryButton
          mode="text"
          onPress={() => {
            router.replace("/registration");
          }}
        >
          <CustomText variant="bodyMedium" custom="link">
            Register
          </CustomText>
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
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    marginTop: 12,
  },
});

export default LoginScreen;
