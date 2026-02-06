import { CustomText, ScreenContainer } from "@/components";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Simulate an async operation, e.g., fetching datac
  }, []);

  return (
    <ScreenContainer>
      <CustomText>Home screen</CustomText>
    </ScreenContainer>
  );
}
