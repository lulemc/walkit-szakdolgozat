import { useAppTheme } from "../useAppTheme";
import { useColorScheme } from "react-native";

// 🔑 Mock react-native-paper themes completely
jest.mock("@/theme/paperTheme", () => ({
  lightTheme: { mode: "light" },
  darkTheme: { mode: "dark" },
}));

// Mock only the module behind react-native's useColorScheme export
jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("useAppTheme", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns darkTheme when scheme is dark", () => {
    (useColorScheme as jest.Mock).mockReturnValue("dark");

    const theme = useAppTheme();

    expect(theme).toEqual({ mode: "dark" });
  });

  it("returns lightTheme when scheme is light", () => {
    (useColorScheme as jest.Mock).mockReturnValue("light");

    const theme = useAppTheme();

    expect(theme).toEqual({ mode: "light" });
  });

  it("returns lightTheme when scheme is null", () => {
    (useColorScheme as jest.Mock).mockReturnValue(null);

    const theme = useAppTheme();

    expect(theme).toEqual({ mode: "light" });
  });
});
