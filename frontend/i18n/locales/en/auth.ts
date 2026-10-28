export default {
  fields: {
    name: "Name",
    email: "Email",
    password: "Password",
  },
  allFieldsRequired: "All fields are required",
  login: {
    title: "Login",
    submit: "Sign In",
    noAccount: "Don’t have an account?",
    register: "Register",
    failed: "Login failed",
  },
  register: {
    title: "Create account",
    submit: "Register",
    haveAccount: "Already have an account?",
    login: "Login",
    failed: "Registration failed",
  },
  password: {
    tooShort: "Password must be at least {{min}} characters long",
  },
  sessionExpired: "Your session has expired. Please log in again.",
} as const;
