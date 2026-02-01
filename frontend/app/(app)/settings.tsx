import { CustomText, ScreenContainer } from "@/components";
import { useState, useEffect } from "react";

export default function Settings() {
  useEffect(() => {
    // Simulate an async operation, e.g., fetching data
  }, []);

  return (
    <ScreenContainer>
      <CustomText>Settings screen</CustomText>
    </ScreenContainer>
  );
}
