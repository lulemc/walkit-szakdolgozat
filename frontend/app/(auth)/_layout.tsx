import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../context/AuthProvider";

export default function AuthLayout() {
  const { token, loading } = useAuth();

  if (loading) return null;

  if (token) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}
