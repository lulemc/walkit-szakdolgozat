import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import RouteInfoCard from '../RouteInfoCard';
import type { Route } from '@/services/routeService';

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
  preferences: {},
  coordinates: [],
  startLocation: { latitude: 0, longitude: 0, address: 'Start' },
  endLocation: { latitude: 0, longitude: 0, address: 'Start' },
} as unknown as Route;

describe('RouteInfoCard', () => {
  it('offers only Start Walk when group walks are not available here', () => {
    const { getByText, queryByText } = renderWithTheme(
      <RouteInfoCard route={route} onClose={jest.fn()} onStartWalk={jest.fn()} />,
    );

    expect(getByText('Start Walk')).toBeTruthy();
    expect(queryByText('Plan group walk')).toBeNull();
  });

  it('offers to plan a group walk with this route', () => {
    const onPlanGroupWalk = jest.fn();
    const { getByText } = renderWithTheme(
      <RouteInfoCard
        route={route}
        onClose={jest.fn()}
        onStartWalk={jest.fn()}
        onPlanGroupWalk={onPlanGroupWalk}
      />,
    );

    fireEvent.press(getByText('Plan group walk'));

    expect(onPlanGroupWalk).toHaveBeenCalledWith(route);
  });
});
