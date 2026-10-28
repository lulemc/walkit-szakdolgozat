export default {
  title: "Statistics",
  tabs: {
    activity: "Activity",
    walks: "Walks",
  },
  header: {
    updated: "Updated {{time}} · pull down to refresh",
    source: "Your activity from {{provider}}",
  },
  lastUpdated: {
    justNow: "just now",
    minutesAgo: "{{minutes}} min ago",
    hoursAgo: "{{hours}}h ago",
  },
  // Names of the non-native health data sources (Apple Health and Health Connect keep their names)
  provider: {
    demo: "Demo data",
    unsupported: "Health data",
  },
  views: {
    day: "Day",
    week: "Week",
    month: "Month",
  },
  refreshFailed: "Couldn't refresh. Showing your last data.",
  loading: "Loading statistics",
  today: {
    title: "Today",
    stepsLabel: "{{steps}} steps today",
    stepsGoal: "steps · goal {{goal}}",
    goalReached: "Daily goal reached 🎉",
    goalPercent: "{{percent}}% of your daily goal",
  },
  trend: {
    vsYesterday: "vs yesterday",
    text: "{{change}}% {{label}}",
  },
  metrics: {
    distance: "Distance",
    calories: "Calories",
  },
  walkTotals: "WalkIt walks this week",
  goal: {
    title: "Weekly goal",
    progress: "{{done}} of {{goal}} km",
    reached: "Goal reached 🎉",
    streak_one: "🔥 {{count}}-week streak",
    streak_other: "🔥 {{count}}-week streak",
    streakLabel_one: "{{count}}-week streak",
    streakLabel_other: "{{count}}-week streak",
    noStreak: "Walk this week to start a streak",
    summaryLabel: "Weekly goal: {{progress}}, {{percent}}%. {{streak}}",
    change: "Change goal",
    inputLabel: "Weekly goal (km)",
    invalid: "Enter a goal between 1 and 200 km",
    saveFailed: "Couldn't save the goal. Please try again.",
  },
  charts: {
    goal: "Goal",
    hour: "{{hour}}h",
    dayMonth: "{{day}}/{{month}}",
    summary: "{{steps}} steps · {{distance}}",
    day: {
      title: "Today by hour",
      subtitle: "{{steps}} steps so far",
      empty:
        "No steps recorded yet today. Your hourly activity will show up here once you start moving.",
    },
    week: {
      title: "Last 7 days",
      empty: "No activity in the last 7 days. Your daily steps will appear here.",
    },
    month: {
      title: "Last 30 days",
      empty: "No activity in the last 30 days. Your daily steps will appear here.",
    },
  },
  insights: {
    average: "Daily average",
    averageValue: "{{steps}} steps",
    bestDay: "Best day",
    activeDays: "Active days",
    activeDaysValue: "{{active}} of {{total}}",
    streak: "Current streak",
    streakValue_one: "{{count}} day",
    streakValue_other: "{{count}} days",
  },
  empty: {
    title: "No activity yet",
    message:
      "We couldn't find any steps, distance or calories in {{provider}} for the last 30 days.",
    tip: "Make sure your phone is recording activity and that WalkIt has permission to read it in {{provider}}.",
    refresh: "Refresh",
  },
  errors: {
    denied: {
      title: "Health access needed",
      message:
        "Allow WalkIt to read your steps, walking distance and active energy in {{provider}} so we can show your statistics.",
      action: "Open Settings",
    },
    notInstalled: {
      title: "Health Connect is required",
      message:
        "WalkIt reads your activity through Health Connect. Install or update it from the Play Store, then come back and try again.",
      action: "Get Health Connect",
    },
    unavailable: {
      title: "{{provider}} isn't available",
      message:
        "Health data isn't available on this device or in this version of the app. Use the WalkIt app on iPhone (Apple Health) or Android (Health Connect).",
    },
    error: {
      title: "Couldn't load your statistics",
      message: "Something went wrong while reading {{provider}}. Please try again.",
    },
  },
  calorieMessage: {
    none: "Let's get moving! 💪",
    start: "Good start! 🔥",
    great: "Great work! ⚡",
    awesome: "Awesome! 🎉",
    amazing: "Amazing! 🚀",
  },
} as const;
