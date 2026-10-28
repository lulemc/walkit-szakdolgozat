import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { darkTheme, lightTheme } from '@/theme/paperTheme';
import { WalkStatsPanel } from '../ActiveWalk/WalkStatsPanel';
import PreferencesSelector from '../WalkPlanner/PreferencesSelector';
import RouteInfoCard from '../WalkPlanner/RouteInfoCard';

const styleOf = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as TextStyle) as TextStyle | undefined;
const colorOf = (element: { props: { style?: unknown } }) => styleOf(element)?.color;
const backgroundOf = (element: { props: { style?: unknown } }) => styleOf(element)?.backgroundColor;

const none = {
  parks: false,
  waterfront: false,
  avoidHighways: false,
  scenic: false,
  uphill: false,
  mountain: false,
  quietStreets: false,
  beach: false,
};

// Colours come from the theme, so text stays readable in dark mode
describe.each([
  ['light', lightTheme],
  ['dark', darkTheme],
])('%s theme', (_name, theme) => {
  it("the walk's numbers use the theme's text colour", () => {
    const { getByText } = renderWithTheme(
      <WalkStatsPanel distanceM={1234} plannedDistanceM={5200} elapsedSec={600} />,
      { theme },
    );

    expect(colorOf(getByText('1.23km'))).toBe(theme.colors.onSurface);
    expect(colorOf(getByText('Distance'))).toBe(theme.colors.onSurfaceVariant);
  });

  it("the preferences sit on the theme's surface, with its text colours", () => {
    const { getByText, getByTestId } = renderWithTheme(
      <PreferencesSelector preferences={none} onChange={jest.fn()} />,
      { theme },
    );

    expect(backgroundOf(getByTestId('preference-parks'))).toBe(theme.colors.surface);
    expect(colorOf(getByText('Parks'))).toBe(theme.colors.onSurface);
    expect(colorOf(getByText('Route through parks and green spaces'))).toBe(theme.colors.onSurfaceVariant);
  });

  it("the route summary's labels and chips use the theme", () => {
    const { getByText } = renderWithTheme(
      <RouteInfoCard route={makeRoute({ preferences: { ...none, parks: true } })} onClose={jest.fn()} onStartWalk={jest.fn()} />,
      { theme },
    );

    expect(colorOf(getByText('Distance'))).toBe(theme.colors.onSurfaceVariant);
    expect(colorOf(getByText('🌳 Parks'))).toBe(theme.colors.onSurfaceVariant);
  });
});
