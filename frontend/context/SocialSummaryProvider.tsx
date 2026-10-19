import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { groupWalkService } from "@/services/groupWalkService";
import type { SocialSummary } from "@/types/social";

interface SocialSummaryContextValue {
  summary: SocialSummary;
  /** Pending friend requests plus walk invitations, for the tab badge */
  total: number;
  /** Reload the counts, e.g. after accepting a request or answering an invitation */
  refresh: () => Promise<void>;
}

const EMPTY_SUMMARY: SocialSummary = { pendingFriendRequests: 0, pendingInvitations: 0 };

const SocialSummaryContext = createContext<SocialSummaryContextValue | null>(null);

/**
 * Keeps the Social badge counts up to date: loaded on mount, when the app
 * returns to the foreground, and whenever a screen calls refresh(). The badge
 * is not essential, so a failed load keeps the last counts instead of erroring.
 */
export const SocialSummaryProvider = ({ children }: { children: React.ReactNode }) => {
  const [summary, setSummary] = useState<SocialSummary>(EMPTY_SUMMARY);

  // State is only updated in the promise callbacks, after the request finished
  const refresh = useCallback(
    () =>
      groupWalkService.getSummary().then(setSummary, (error: Error) => {
        console.warn("[SocialSummary] Couldn't load the badge counts:", error?.message);
      }),
    [],
  );

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo(
    () => ({
      summary,
      total: summary.pendingFriendRequests + summary.pendingInvitations,
      refresh,
    }),
    [summary, refresh],
  );

  return <SocialSummaryContext.Provider value={value}>{children}</SocialSummaryContext.Provider>;
};

export const useSocialSummary = (): SocialSummaryContextValue => {
  const context = useContext(SocialSummaryContext);
  if (!context) {
    throw new Error("useSocialSummary must be used inside a SocialSummaryProvider");
  }
  return context;
};
