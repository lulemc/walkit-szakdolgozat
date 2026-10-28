import React from "react";
import { act, fireEvent } from "@testing-library/react-native";
import i18n from "@/i18n";
import { renderWithTheme } from "./renderWithTheme";
import { LoadingState } from "../LoadingState";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";

const actions = () => ({ onRetry: jest.fn(), onOpenSettings: jest.fn(), onInstall: jest.fn() });

describe("LoadingState", () => {
  it("renders an accessible skeleton", () => {
    const { getByTestId, getByLabelText } = renderWithTheme(<LoadingState />);
    expect(getByTestId("statistics-loading")).toBeTruthy();
    expect(getByLabelText("Loading statistics")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("names the provider and refreshes", () => {
    const onRefresh = jest.fn();
    const { getByText } = renderWithTheme(
      <EmptyState providerName="Health Connect" onRefresh={onRefresh} refreshing={false} />,
    );

    expect(getByText("No activity yet")).toBeTruthy();
    expect(getByText(/in Health Connect for the last 30 days/)).toBeTruthy();

    fireEvent.press(getByText("Refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState", () => {
  it("opens the provider's settings when access is denied", () => {
    const handlers = actions();
    const { getByText } = renderWithTheme(
      <ErrorState variant="denied" providerName="Health Connect" {...handlers} />,
    );

    expect(getByText("Health access needed")).toBeTruthy();
    expect(getByText(/in Health Connect/)).toBeTruthy();
    fireEvent.press(getByText("Open Settings"));

    expect(handlers.onOpenSettings).toHaveBeenCalled();
    expect(handlers.onRetry).not.toHaveBeenCalled();
  });

  it("offers to install Health Connect", () => {
    const handlers = actions();
    const { getByText } = renderWithTheme(
      <ErrorState variant="notInstalled" providerName="Health Connect" {...handlers} />,
    );

    expect(getByText("Health Connect is required")).toBeTruthy();
    fireEvent.press(getByText("Get Health Connect"));
    expect(handlers.onInstall).toHaveBeenCalled();
  });

  it("explains an unavailable provider, without an action", () => {
    const { getByText, queryByText } = renderWithTheme(
      <ErrorState variant="unavailable" providerName="Apple Health" {...actions()} />,
    );

    expect(getByText("Apple Health isn't available")).toBeTruthy();
    expect(queryByText("Try again")).toBeNull();
  });

  it("retries after an error", () => {
    const handlers = actions();
    const { getByText } = renderWithTheme(
      <ErrorState
        variant="error"
        providerName="Apple Health"
        error={new Error("boom")}
        {...handlers}
      />,
    );

    expect(getByText(/while reading Apple Health/)).toBeTruthy();
    fireEvent.press(getByText("Try again"));
    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("States in Hungarian", () => {
  beforeEach(() => i18n.changeLanguage("hu"));
  // Switching back re-renders the screen still on show
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("shows the empty state in Hungarian", () => {
    const { getByText } = renderWithTheme(
      <EmptyState providerName="Health Connect" onRefresh={jest.fn()} refreshing={false} />,
    );

    expect(getByText("Még nincs aktivitás")).toBeTruthy();
    expect(getByText(/^Az elmúlt 30 napból .*\(forrás: Health Connect\)\.$/)).toBeTruthy();
    expect(getByText("Frissítés")).toBeTruthy();
  });

  it("shows the access and error states in Hungarian", () => {
    const denied = renderWithTheme(
      <ErrorState variant="denied" providerName="Apple Health" {...actions()} />,
    );
    expect(denied.getByText("Hozzáférés kell az egészségadatokhoz")).toBeTruthy();
    expect(denied.getByText("Beállítások megnyitása")).toBeTruthy();
    denied.unmount();

    const failed = renderWithTheme(
      <ErrorState variant="error" providerName="Apple Health" {...actions()} />,
    );
    expect(failed.getByText("Nem sikerült betölteni a statisztikádat")).toBeTruthy();
    expect(failed.getByText("Újra")).toBeTruthy();
  });
});
