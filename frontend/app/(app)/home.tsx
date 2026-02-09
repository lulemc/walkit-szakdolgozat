import { ScreenContainer } from "@/components";
import { useEffect } from "react";
import WalkPlanner from "@/components/WalkPlanner/WalkPlanner";

export default function Home() {
  useEffect(() => {
    // Simulate an async operation, e.g., fetching datac
  }, []);

  return (
    <ScreenContainer style={{ padding: 0 }}>
      <WalkPlanner />
    </ScreenContainer>
  );
}
