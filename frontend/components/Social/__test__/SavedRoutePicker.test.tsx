import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { routeService } from '@/services/routeService';
import { SavedRoutePicker } from '../SavedRoutePicker';
import { makeRoute } from './routeFixtures';

jest.mock('@/context/AuthProvider', () => ({
  useAuth: () => ({ user: { _id: 'u1', name: 'Me' } }),
}));

// Only the request is replaced; the formatters stay real
const getUserRoutes = jest.spyOn(routeService, 'getUserRoutes');

const riverside = makeRoute({ _id: 'fav', name: 'Riverside loop', isFavorite: true });
const recent = makeRoute({ _id: 'new', totalDistance: 3000 });

beforeEach(() => {
  jest.clearAllMocks();
  getUserRoutes.mockResolvedValue([recent, riverside]);
});

describe('SavedRoutePicker', () => {
  it('lists my favourite and recent routes', async () => {
    const { findByText, getByText, getAllByText } = renderWithTheme(
      <SavedRoutePicker onSelect={jest.fn()} onBack={jest.fn()} />,
    );

    expect(await findByText('Riverside loop')).toBeTruthy();
    expect(getByText('Favourites')).toBeTruthy();
    expect(getByText('Recent')).toBeTruthy();
    expect(getByText('Circular route')).toBeTruthy();
    expect(getByText(/3\.0km/)).toBeTruthy();
    // A favourite isn't repeated among the recent routes
    expect(getAllByText('Riverside loop')).toHaveLength(1);
    expect(getUserRoutes).toHaveBeenCalledWith('u1');
  });

  it('shows only the 10 most recent routes', async () => {
    getUserRoutes.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => makeRoute({ _id: `r${i}`, name: `Route ${i}` })),
    );
    const { findByText, queryByText } = renderWithTheme(
      <SavedRoutePicker onSelect={jest.fn()} onBack={jest.fn()} />,
    );

    expect(await findByText('Route 9')).toBeTruthy();
    expect(queryByText('Route 10')).toBeNull();
  });

  it('picks a route', async () => {
    const onSelect = jest.fn();
    const { findByLabelText } = renderWithTheme(
      <SavedRoutePicker onSelect={onSelect} onBack={jest.fn()} />,
    );

    fireEvent.press(await findByLabelText('Choose Riverside loop'));

    expect(onSelect).toHaveBeenCalledWith(riverside);
  });

  it('explains how to get a route when there are none', async () => {
    getUserRoutes.mockResolvedValue([]);
    const { findByText } = renderWithTheme(
      <SavedRoutePicker onSelect={jest.fn()} onBack={jest.fn()} />,
    );

    expect(await findByText(/No saved routes yet/)).toBeTruthy();
  });

  it('offers a retry when the routes fail to load', async () => {
    getUserRoutes.mockRejectedValueOnce(new Error('Network Error'));
    const { findByText, getByText } = renderWithTheme(
      <SavedRoutePicker onSelect={jest.fn()} onBack={jest.fn()} />,
    );

    expect(await findByText("Couldn't load your routes")).toBeTruthy();
    fireEvent.press(getByText('Try again'));

    expect(await findByText('Riverside loop')).toBeTruthy();
  });

  it('goes back', async () => {
    const onBack = jest.fn();
    const { findByText } = renderWithTheme(<SavedRoutePicker onSelect={jest.fn()} onBack={onBack} />);

    fireEvent.press(await findByText('Back'));

    expect(onBack).toHaveBeenCalled();
  });
});
