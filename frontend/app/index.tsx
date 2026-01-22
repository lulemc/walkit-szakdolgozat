import { useAuth } from "@/context/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import Home from "./(app)/home";

export default function Index() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, []);

  return <Home />;
}
