export default {
  map: {
    label: "Map of your walk: the planned route and the path walked so far",
    youAreHere: "You are here",
  },
  stats: {
    // One sentence for screen readers
    summaryLabel: "Walked {{distance}} of {{planned}} in {{time}}, pace {{pace}} minutes per kilometre",
    distance: "Distance",
    time: "Time",
    pace: "Pace",
    paceUnit: "min/km",
  },
  summary: {
    title: "Walk complete! 🎉",
    inFavourites: "In your favourites",
    addToFavourites: "Add route to favourites",
    save: "Save walk",
    discard: "Discard",
  },
  discardDialog: {
    title: "Discard this walk?",
    message: "It won't be saved.",
    keep: "Keep",
    discard: "Discard",
  },
  endDialog: {
    title: "End this walk?",
    message: "You can save it on the next screen.",
    keepWalking: "Keep walking",
    end: "End walk",
  },
  permissionDenied: "Location permission is needed to track your walk.",
  trackingFailed: "Couldn't start tracking your location.",
  simulatedGps: "🎮 Simulated GPS (testing)",
  keepScreenOn: "Keep the screen on: tracking stops while it's locked.",
  pause: "Pause",
  resume: "Resume",
  finish: "Finish Walk",
  // Android shows this while the walk is tracked in the background
  notification: {
    title: "Tracking your walk",
    body: "WalkIt records your route while the screen is off.",
  },
  // Walk time (walkMetrics.formatElapsed), e.g. "2m 5s"
  elapsed: {
    minutesSeconds: "{{minutes}}m {{seconds}}s",
    hoursMinutesSeconds: "{{hours}}h {{minutes}}m {{seconds}}s",
  },
} as const;
