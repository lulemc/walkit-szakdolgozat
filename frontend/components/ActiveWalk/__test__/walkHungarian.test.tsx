import React from 'react';
import { act } from '@testing-library/react-native';
import i18n from '@/i18n';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { WalkSummaryView } from '../WalkSummaryView';
import { WalkStatsPanel } from '../WalkStatsPanel';
import { WALK_LOCATION_OPTIONS } from '@/services/walkLocationTask';

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));

describe('walk in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // In act(): the language change re-renders what is still on screen
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('shows the walk summary in Hungarian', () => {
    const { getByText } = renderWithTheme(
      <WalkSummaryView
        distanceM={1234}
        elapsedSec={3725}
        saving={false}
        error={null}
        favorite="available"
        onSave={jest.fn()}
        onDiscard={jest.fn()}
        onFavorite={jest.fn()}
      />,
    );

    expect(getByText('Séta teljesítve! 🎉')).toBeTruthy();
    expect(getByText('Séta mentése')).toBeTruthy();
    expect(getByText('Útvonal hozzáadása a kedvencekhez')).toBeTruthy();
    expect(getByText('1 ó 2 p 5 mp')).toBeTruthy();
    expect(getByText('1.23km')).toBeTruthy();
  });

  it('reads the walk so far out in Hungarian', () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <WalkStatsPanel distanceM={1000} plannedDistanceM={5000} elapsedSec={600} />,
    );

    expect(getByText('Tempó')).toBeTruthy();
    expect(
      getByLabelText('Megtett táv: 1.00km / 5.00km, idő: 10 p 0 mp, tempó: 10:00 perc kilométerenként'),
    ).toBeTruthy();
  });

  it('shows the Android tracking notification in the current language', () => {
    expect(WALK_LOCATION_OPTIONS.foregroundService?.notificationTitle).toBe('Követjük a sétád');
  });
});
