import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { PLACE_SEARCH_DEBOUNCE_MS } from '@/hooks/usePlaceSearch';
import LocationSelector from '../LocationSelector';

const heroes = { placeId: 'p1', description: 'Heroes Square, Budapest', mainText: 'Heroes Square', secondaryText: 'Budapest' };

const renderSelector = () => {
  const props = {
    currentLocation: null,
    startLocation: null,
    destinationLocation: null,
    routeType: 'circular' as const,
    onStartLocationChange: jest.fn(),
    onDestinationLocationChange: jest.fn(),
    onUseCurrentLocation: jest.fn(),
    onEnableMapSelection: jest.fn(),
    onSearchLocation: jest.fn().mockResolvedValue([heroes]),
    onSelectPlace: jest.fn().mockResolvedValue(undefined),
  };
  return { ...renderWithTheme(<LocationSelector {...props} />), props };
};

const typeAndWait = async (screen: ReturnType<typeof renderSelector>, text: string) => {
  fireEvent.changeText(screen.getByLabelText('Search for a place'), text);
  await act(async () => {
    jest.advanceTimersByTime(PLACE_SEARCH_DEBOUNCE_MS);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LocationSelector search', () => {
  it('searches once typing pauses, then picks a place with the same session token', async () => {
    const screen = renderSelector();
    fireEvent.press(screen.getByText('🔍 Search'));

    fireEvent.changeText(screen.getByLabelText('Search for a place'), 'her');
    await typeAndWait(screen, 'heroes');

    expect(screen.props.onSearchLocation).toHaveBeenCalledTimes(1);
    const [query, type, token] = screen.props.onSearchLocation.mock.calls[0];
    expect([query, type]).toEqual(['heroes', 'start']);

    await act(async () => {
      fireEvent.press(screen.getByText('Heroes Square'));
    });

    expect(screen.props.onSelectPlace).toHaveBeenCalledWith('p1', 'start', token);
  });

  it('says when search is unavailable', async () => {
    const screen = renderSelector();
    screen.props.onSearchLocation.mockRejectedValue(new Error('REQUEST_DENIED'));
    fireEvent.press(screen.getByText('🔍 Search'));

    await typeAndWait(screen, 'heroes');

    expect(screen.getByText('Search is unavailable right now. You can still pick a point on the map.')).toBeTruthy();
  });
});
