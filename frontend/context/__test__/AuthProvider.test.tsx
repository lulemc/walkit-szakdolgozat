import { renderHook, act } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../../context/AuthProvider";
import { storage } from "@/utils/storage";
import { userStorage } from "@/utils/userStorage";
import { useRouter } from "expo-router";
import React from "react";
import { loginUser, registerUser } from "@/services/authApi";

// Mock the API
jest.mock("@/services/authApi", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

// Mock Storage
jest.mock("@/utils/storage", () => ({
  storage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
  },
}));

// Mock User Storage
jest.mock("@/utils/userStorage", () => ({
  userStorage: {
    getUser: jest.fn(),
    setUser: jest.fn(),
    removeUser: jest.fn(),
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
    // Setup default mock implementations for userStorage
    (userStorage.getUser as jest.Mock).mockResolvedValue(null);
    (userStorage.setUser as jest.Mock).mockResolvedValue(undefined);
    (userStorage.removeUser as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("should initialize with token from storage", async () => {
    const mockUser = {
      _id: "123",
      name: "Test User",
      email: "test@test.com",
    };

    (storage.getToken as jest.Mock).mockResolvedValue("existing-token");
    (userStorage.getUser as jest.Mock).mockResolvedValue(mockUser);

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
    const mockUser = {
      _id: "123",
      name: "Test User",
      email: "test@test.com",
    };

    (storage.getToken as jest.Mock).mockResolvedValue(null);
    (registerUser as jest.Mock).mockResolvedValue({
      token: mockToken,
      user: mockUser,
    });

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
    expect(userStorage.setUser).toHaveBeenCalledWith(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(mockReplace).toHaveBeenCalledWith("/");
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

  it("should throw if register returns no token", async () => {
    (registerUser as jest.Mock).mockResolvedValue({}); // no token

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(
        result.current.register("User", "test@test.com", "password"),
      ).rejects.toThrow("No token returned from backend");
    });

    expect(storage.setToken).not.toHaveBeenCalled();
    expect(result.current.token).toBeNull();
  });

  it("should login successfully and update state", async () => {
    const mockToken = "login-token";
    const mockUser = {
      _id: "456",
      name: "Login User",
      email: "login@test.com",
    };

    (loginUser as jest.Mock).mockResolvedValue({
      token: mockToken,
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("test@test.com", "password");
    });

    expect(storage.setToken).toHaveBeenCalledWith(mockToken);
    expect(userStorage.setUser).toHaveBeenCalledWith(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("should throw if login returns no token", async () => {
    (loginUser as jest.Mock).mockResolvedValue({}); // no token

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(
        result.current.login("test@test.com", "password"),
      ).rejects.toThrow("No token returned from backend");
    });

    expect(storage.setToken).not.toHaveBeenCalled();
    expect(result.current.token).toBeNull();
  });

  it("should logout successfully and clear token", async () => {
    const mockToken = "login-token";
    const mockUser = {
      _id: "456",
      name: "Login User",
      email: "login@test.com",
    };

    (loginUser as jest.Mock).mockResolvedValue({
      token: mockToken,
      user: mockUser,
    });
    (storage.removeToken as jest.Mock).mockResolvedValue(undefined);
    (userStorage.removeUser as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // First login
    await act(async () => {
      await result.current.login("test@test.com", "password");
    });

    expect(result.current.token).toBe(mockToken);

    // Then logout
    await act(async () => {
      await result.current.logout();
    });

    expect(storage.removeToken).toHaveBeenCalled();
    expect(userStorage.removeUser).toHaveBeenCalled();
    expect(result.current.token).toBeNull();
    expect(mockReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("should log error if token loading fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    (storage.getToken as jest.Mock).mockRejectedValue(
      new Error("Storage broken"),
    );

    renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load token",
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
