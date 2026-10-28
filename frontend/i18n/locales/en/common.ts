export default {
  // Each language is named in itself in the language setting
  languageName: "English",
  actions: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    close: "Close",
    retry: "Try again",
    ok: "OK",
    back: "Back",
    confirm: "Confirm",
    edit: "Edit",
    done: "Done",
  },
  loadingApp: "Loading WalkIt",
  offline: "You're offline. Planning routes and social features need the internet.",
  // Bottom navigation tabs
  tabs: {
    home: "Home",
    statistics: "Statistics",
    social: "Social",
    settings: "Settings",
  },
  // Fallbacks when a request fails without a message from the server
  errors: {
    generic: "Something went wrong. Please try again.",
    unreachable: "Can't reach WalkIt. Check your internet connection and try again.",
    timeout: "WalkIt is taking too long to answer. Please try again.",
  },
  snackbar: {
    errorTitle: "Error",
    errorLabel: "Error: {{message}}",
  },
} as const;
