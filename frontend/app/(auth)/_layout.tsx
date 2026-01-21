import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../context/AuthProvider";

export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  if (token) {
    return <Redirect href="/(app)" />;
  }

  return <Slot />;
}
