import React from 'react';
import { act } from '@testing-library/react-native';
import i18n from '@/i18n';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import RouteInfoCard from '../RouteInfoCard';
import PreferencesSelector from '../PreferencesSelector';
import type { Route, RoutePreferences } from '@/services/routeService';
import { formatDuration } from '@/utils/timeUtils';

const route = {
  _id: 'r1',
  name: null,
  type: 'circular',
  totalDistance: 5200,
  estimatedDuration: 65,
  elevationGain: 10,
  elevationLoss: 10,
  maxElevation: null,
  minElevation: null,
  preferenceScore: 70,
  preferences: { parks: true },
  coordinates: [],
  startLocation: { latitude: 0, longitude: 0, address: 'Start' },
  endLocation: { latitude: 0, longitude: 0, address: 'Start' },
} as unknown as Route;

const preferences: RoutePreferences = {
  parks: true,
  waterfront: true,
  avoidHighways: false,
  scenic: false,
  uphill: false,
  mountain: false,
  quietStreets: false,
  beach: false,
};

describe('planner in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // In act(): the language change re-renders what is still on screen
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('shows the route summary in Hungarian', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <RouteInfoCard route={route} onClose={jest.fn()} onStartWalk={jest.fn()} onPlanGroupWalk={jest.fn()} />,
    );

    expect(getByText('📊 Útvonal összegzése')).toBeTruthy();
    expect(getByText('Séta indítása')).toBeTruthy();
    expect(getByText('Közös séta szervezése')).toBeTruthy();
    expect(getByText('🌳 Parkok')).toBeTruthy();
    expect(getByText('1 ó 5 p')).toBeTruthy();
    expect(getByText('12.5 perc/km')).toBeTruthy();
    expect(getByLabelText('Összegzés bezárása')).toBeTruthy();
  });

  it('names the preferences and counts the active ones in Hungarian', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <PreferencesSelector preferences={preferences} onChange={jest.fn()} />,
    );

    expect(getByText('Vízpart')).toBeTruthy();
    expect(getByLabelText('Főutak kerülése')).toBeTruthy();
    expect(getByText('2 preferencia bekapcsolva')).toBeTruthy();
  });

  it('formats walk durations in Hungarian', () => {
    expect(formatDuration(45)).toBe('45 perc');
    expect(formatDuration(120)).toBe('2 óra');
    expect(formatDuration(90)).toBe('1 óra 30 perc');
  });
});
