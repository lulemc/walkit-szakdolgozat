import React from 'react';
import { act } from '@testing-library/react-native';
import i18n from '@/i18n';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { ElevationProfile } from '../ElevationProfile';

const path = [
  { latitude: 47.5, longitude: 19.04, elevation: 110 },
  { latitude: 47.505, longitude: 19.04, elevation: 135.4 },
  { latitude: 47.51, longitude: 19.04, elevation: 120 },
];

describe('ElevationProfile', () => {
  it('draws the height along the route, with the lowest and highest point', () => {
    const { getAllByTestId, getByLabelText, getByText } = renderWithTheme(<ElevationProfile coordinates={path} />);

    expect(getAllByTestId('elevation-bar').length).toBeGreaterThan(10);
    expect(getByText('110 m')).toBeTruthy();
    expect(getByText('135 m')).toBeTruthy();
    expect(getByLabelText('Elevation profile: between 110 m and 135 m')).toBeTruthy();
  });

  it('shows nothing for a route without heights', () => {
    const { queryAllByTestId, queryByText } = renderWithTheme(
      <ElevationProfile coordinates={path.map(({ latitude, longitude }) => ({ latitude, longitude }))} />,
    );

    expect(queryAllByTestId('elevation-bar')).toHaveLength(0);
    expect(queryByText('110 m')).toBeNull();
  });
});

describe('ElevationProfile in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // Switching back re-renders the screen still on show
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('describes the profile in Hungarian', () => {
    const { getByLabelText } = renderWithTheme(<ElevationProfile coordinates={path} />);

    expect(getByLabelText('Szintprofil: 110 m és 135 m között')).toBeTruthy();
  });
});
