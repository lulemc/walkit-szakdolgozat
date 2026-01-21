import { renderHook, act } from "@testing-library/react-native"; // Standard React hook tester
import { AuthProvider, useAuth } from "../../context/AuthProvider";
import { registerUser } from "@/services/authApi";
import { storage } from "@/utils/storage";
import { useRouter } from "expo-router";
import React from "react";

// Mock the API
jest.mock("@/services/authApi", () => ({
  registerUser: jest.fn(),
}));

// Mock Storage
jest.mock("@/utils/storage", () => ({
  storage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
  },
}));

// Mock Expo Router
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe("AuthContext Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should initialize with token from storage", async () => {
    (storage.getToken as jest.Mock).mockResolvedValue("existing-token");

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for the useEffect bootstrap to finish
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.token).toBe("existing-token");
    expect(result.current.loading).toBe(false);
  });

  it("should register successfully and update state", async () => {
    const mockToken = "new-jwt-token";
    (storage.getToken as jest.Mock).mockResolvedValue(null);
    (registerUser as jest.Mock).mockResolvedValue({ token: mockToken });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Perform registration
    await act(async () => {
      await result.current.register(
        "Test User",
        "test@test.com",
        "password123",
      );
    });

    expect(storage.setToken).toHaveBeenCalledWith(mockToken);
    expect(result.current.token).toBe(mockToken);
    expect(mockReplace).toHaveBeenCalledWith("/home");
  });

  it("should handle registration errors", async () => {
    (registerUser as jest.Mock).mockRejectedValue(new Error("Network Error"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.register("User", "e@e.com", "p");
      } catch (e) {
        // Error is expected to be re-thrown by the component
      }
    });

    expect(result.current.token).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
