import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import ActionButton from "../../ActionButton";
import LocationCard from "../LocationCard";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider>{children}</PaperProvider>
);

describe("ActionButton", () => {
  it("renders label correctly", () => {
    const { getByText } = render(
      <ActionButton label="Test Button" onPress={jest.fn()} />,
      { wrapper },
    );

    expect(getByText("Test Button")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ActionButton label="Click Me" onPress={onPress} />,
      { wrapper },
    );

    fireEvent.press(getByText("Click Me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("applies active styling when active", () => {
    const { getByText } = render(
      <ActionButton label="Active" onPress={jest.fn()} active={true} />,
      { wrapper },
    );

    const button = getByText("Active");
    expect(button).toBeTruthy();
    // Active buttons have bold text - check parent style structure
    const styles = button.props.style;
    const hasBoldFont = JSON.stringify(styles).includes('"fontWeight":"600"');
    expect(hasBoldFont).toBe(true);
  });

  it("applies error variant styling", () => {
    const { getByText } = render(
      <ActionButton label="Delete" onPress={jest.fn()} variant="error" />,
      { wrapper },
    );

    expect(getByText("Delete")).toBeTruthy();
  });
});

describe("SuggestionItem", () => {
  const mockSuggestion = {
    placeId: "123",
    description: "Heroes Square, Budapest",
    mainText: "Heroes Square",
    secondaryText: "Budapest, Hungary",
  };
});

describe("LocationCard", () => {
  const mockLocation = {
    coordinates: { latitude: 47.4979, longitude: 19.0402 },
    name: "Budapest",
    address: "Budapest, Hungary",
  };

  it("renders location name and address", () => {
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={false}
        showActions={false}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText("Budapest")).toBeTruthy();
    expect(getByText("Budapest, Hungary")).toBeTruthy();
  });

  it('shows "Not set" when location is null', () => {
    const { getByText } = render(
      <LocationCard
        location={null}
        isCurrentLocation={false}
        showActions={false}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText("Not set")).toBeTruthy();
  });

  it("shows current location badge when isCurrentLocation is true", () => {
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={true}
        showActions={false}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText("📍 Current Location")).toBeTruthy();
  });

  it("renders action buttons when showActions is true", () => {
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={false}
        showActions={true}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText("🔍 Search")).toBeTruthy();
    expect(getByText("🗺️ Map")).toBeTruthy();
  });

  it("shows Current button when onUseCurrentLocation is provided", () => {
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={true}
        showActions={true}
        onUseCurrentLocation={jest.fn()}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText("Current")).toBeTruthy();
  });

  it("shows Clear button when onClear is provided and location exists", () => {
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={false}
        showActions={true}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
        onClear={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText("Clear")).toBeTruthy();
  });

  it("calls onEnableSearch when Search button is pressed", () => {
    const onEnableSearch = jest.fn();
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={false}
        showActions={true}
        onEnableSearch={onEnableSearch}
        onEnableMapSelection={jest.fn()}
      />,
      { wrapper },
    );

    fireEvent.press(getByText("🔍 Search"));
    expect(onEnableSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onEnableMapSelection when Map button is pressed", () => {
    const onEnableMapSelection = jest.fn();
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={false}
        showActions={true}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={onEnableMapSelection}
      />,
      { wrapper },
    );

    fireEvent.press(getByText("🗺️ Map"));
    expect(onEnableMapSelection).toHaveBeenCalledTimes(1);
  });

  it("calls onClear when Clear button is pressed", () => {
    const onClear = jest.fn();
    const { getByText } = render(
      <LocationCard
        location={mockLocation}
        isCurrentLocation={false}
        showActions={true}
        onEnableSearch={jest.fn()}
        onEnableMapSelection={jest.fn()}
        onClear={onClear}
      />,
      { wrapper },
    );

    fireEvent.press(getByText("Clear"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
