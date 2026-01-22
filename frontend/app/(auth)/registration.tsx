import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTextInput } from "@/hooks/form/useTextInput";
import { useAuth } from "@/context/AuthProvider";
import { testNetworkRequest } from "@/services/authApi";
import {
  CustomText,
  RowLayout,
  CustomTextInput,
  ScreenContainer,
  PrimaryButton,
} from "@/components";

const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { register } = useAuth();

  const name = useTextInput();
  const email = useTextInput();
  const password = useTextInput();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    testNetworkRequest().catch((err) => {
      console.error("Network test failed:", err.message);
    });
  }, []);

  const onSubmit = async () => {
    if (!name.value || !email.value || !password.value) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await register(name.value, email.value, password.value);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
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
        value={name.value}
        onChangeText={name.onChangeText}
      />
      <CustomTextInput
        label="Email"
        value={email.value}
        onChangeText={email.onChangeText}
        autoCapitalize="none"
        keyboardType="email-address"
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
