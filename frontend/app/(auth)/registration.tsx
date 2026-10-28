import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTextInput } from "@/hooks/form/useTextInput";
import { useAuth } from "@/context/AuthProvider";
import { MIN_PASSWORD_LENGTH, passwordTooShortMessage } from "@/utils/passwordRules";
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
  const { t } = useTranslation("auth");

  const name = useTextInput();
  const email = useTextInput();
  const password = useTextInput();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!name.value || !email.value || !password.value) {
      setError(t("allFieldsRequired"));
      return;
    }
    if (password.value.length < MIN_PASSWORD_LENGTH) {
      setError(passwordTooShortMessage());
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await register(name.value, email.value, password.value);
    } catch (err) {
      setError(apiErrorMessage(err, t("register.failed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        {t("register.title")}
      </CustomText>
      <CustomTextInput
        label={t("fields.name")}
        accessibilityLabel={t("fields.name")}
        value={name.value}
        onChangeText={name.onChangeText}
      />
      <CustomTextInput
        label={t("fields.email")}
        accessibilityLabel={t("fields.email")}
        value={email.value}
        onChangeText={email.onChangeText}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <CustomTextInput
        label={t("fields.password")}
        accessibilityLabel={t("fields.password")}
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
        {t("register.submit")}
      </PrimaryButton>
      <RowLayout>
        <CustomText>{t("register.haveAccount")}</CustomText>
        <PrimaryButton mode="text" onPress={() => router.replace("/login")}>
          <CustomText custom="link">{t("register.login")}</CustomText>
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
