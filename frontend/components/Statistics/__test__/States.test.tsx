import React from "react";
import { Linking } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithTheme } from "./renderWithTheme";
import { LoadingState } from "../LoadingState";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";

describe("LoadingState", () => {
  it("renders an accessible skeleton", () => {
    const { getByTestId, getByLabelText } = renderWithTheme(<LoadingState />);
    expect(getByTestId("statistics-loading")).toBeTruthy();
    expect(getByLabelText("Loading statistics")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("explains the missing data and refreshes", () => {
    const onRefresh = jest.fn();
    const { getByText } = renderWithTheme(<EmptyState onRefresh={onRefresh} refreshing={false} />);

    expect(getByText("No activity yet")).toBeTruthy();
    expect(getByText(/Data Access & Devices/)).toBeTruthy();

    fireEvent.press(getByText("Refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState", () => {
  it("opens Settings when access is denied", () => {
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    const onRetry = jest.fn();
    const { getByText } = renderWithTheme(<ErrorState variant="denied" onRetry={onRetry} />);

    expect(getByText("Health access needed")).toBeTruthy();
    fireEvent.press(getByText("Open Settings"));

    expect(openSettings).toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("explains that Apple Health is iOS only, without an action", () => {
    const { getByText, queryByText } = renderWithTheme(
      <ErrorState variant="unavailable" onRetry={jest.fn()} />,
    );

    expect(getByText("Apple Health isn't available")).toBeTruthy();
    expect(queryByText("Try again")).toBeNull();
  });

  it("retries after an error", () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithTheme(
      <ErrorState variant="error" error={new Error("boom")} onRetry={onRetry} />,
    );

    fireEvent.press(getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
