import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../context/AuthProvider";

export default function AppLayout() {
  const { token } = useAuth();

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}
