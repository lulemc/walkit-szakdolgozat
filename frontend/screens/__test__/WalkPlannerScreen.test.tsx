import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { useWalkPlanner } from '@/hooks/useWalkPlanner';
import WalkPlannerScreen from '../WalkPlanner';

jest.mock('@/hooks/useWalkPlanner', () => ({ useWalkPlanner: jest.fn() }));
// Reanimated's worklets need native code; their mock runs in Jest
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
// The panel's gestures and animation aren't under test here
jest.mock('@/hooks/useDraggablePanel', () => ({
  useDraggablePanel: () => {
    const { Gesture } = jest.requireActual('react-native-gesture-handler');
    return { panGesture: Gesture.Pan(), animatedPanelStyle: {}, collapsePanel: jest.fn() };
  },
}));

const start = { coordinates: { latitude: 47.5, longitude: 19.04 }, name: 'Start', address: 'Budapest' };
const route = makeRoute({ _id: 'r1', name: 'Riverside loop' });
const noPreferences = {
  parks: false,
  waterfront: false,
  avoidHighways: false,
  scenic: false,
  uphill: false,
  mountain: false,
  quietStreets: false,
  beach: false,
};

const planner = (overrides = {}) => ({
  mapRef: { current: null },
  scrollRef: { current: null },
  currentLocation: start.coordinates,
  startLocation: start,
  destinationLocation: null,
  loading: false,
  mapRegion: { ...start.coordinates, latitudeDelta: 0.05, longitudeDelta: 0.05 },
  selectedDistance: 5,
  routeType: 'circular',
  mapSelectionMode: 'none',
  setStartLocation: jest.fn(),
  setDestinationLocation: jest.fn(),
  setSelectedDistance: jest.fn(),
  setRouteType: jest.fn(),
  setMapSelectionMode: jest.fn(),
  handleUseCurrentLocation: jest.fn(),
  handleEnableMapSelection: jest.fn(),
  handleMapPress: jest.fn(),
  handleSearchLocation: jest.fn().mockResolvedValue([]),
  handleSelectPlace: jest.fn(),
  scrollToTop: jest.fn(),
  preferences: noPreferences,
  setPreferences: jest.fn(),
  isGeneratingRoute: false,
  generatedRoute: null,
  routeError: null,
  generateRoute: jest.fn().mockResolvedValue(undefined),
  clearRoute: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WalkPlannerScreen', () => {
  it('waits for the location first', () => {
    (useWalkPlanner as jest.Mock).mockReturnValue(planner({ loading: true }));

    const { getByText } = renderWithTheme(<WalkPlannerScreen />);

    expect(getByText('Getting your location...')).toBeTruthy();
  });

  it('generates a route from the chosen start', async () => {
    const state = planner();
    (useWalkPlanner as jest.Mock).mockReturnValue(state);
    const { getByText } = renderWithTheme(<WalkPlannerScreen />);

    fireEvent.press(getByText('Generate Route'));

    await waitFor(() => expect(state.generateRoute).toHaveBeenCalled());
  });

  it("can't generate without a start, or a point-to-point route without a destination", () => {
    (useWalkPlanner as jest.Mock).mockReturnValue(planner({ startLocation: null }));
    const withoutStart = renderWithTheme(<WalkPlannerScreen />);
    expect(withoutStart.getByRole('button', { name: 'Generate Route' })).toBeDisabled();
    withoutStart.unmount();

    (useWalkPlanner as jest.Mock).mockReturnValue(planner({ routeType: 'point-to-point' }));
    const withoutDestination = renderWithTheme(<WalkPlannerScreen />);
    expect(withoutDestination.getByRole('button', { name: 'Generate Route' })).toBeDisabled();
  });

  it('shows the generated route and starts the walk on it', () => {
    (useWalkPlanner as jest.Mock).mockReturnValue(planner({ generatedRoute: route }));
    const onStartWalk = jest.fn();
    const { getByText } = renderWithTheme(<WalkPlannerScreen onStartWalk={onStartWalk} />);

    expect(getByText('Regenerate Route')).toBeTruthy();
    fireEvent.press(getByText('Start Walk'));

    expect(onStartWalk).toHaveBeenCalledWith(route);
  });

  it('clears the route', () => {
    const state = planner({ generatedRoute: route });
    (useWalkPlanner as jest.Mock).mockReturnValue(state);
    const { getByText } = renderWithTheme(<WalkPlannerScreen />);

    fireEvent.press(getByText('Clear Route'));

    expect(state.clearRoute).toHaveBeenCalled();
  });

  it('opens my routes, where that is available', () => {
    (useWalkPlanner as jest.Mock).mockReturnValue(planner());
    const onOpenMyRoutes = jest.fn();
    const withRoutes = renderWithTheme(<WalkPlannerScreen onOpenMyRoutes={onOpenMyRoutes} />);

    fireEvent.press(withRoutes.getByText('My routes'));
    expect(onOpenMyRoutes).toHaveBeenCalled();
    withRoutes.unmount();

    expect(renderWithTheme(<WalkPlannerScreen />).queryByText('My routes')).toBeNull();
  });

  it('tells how to pick a point on the map', () => {
    const state = planner({ mapSelectionMode: 'start' });
    (useWalkPlanner as jest.Mock).mockReturnValue(state);
    const { getByText } = renderWithTheme(<WalkPlannerScreen />);

    fireEvent.press(getByText('Cancel'));

    expect(state.setMapSelectionMode).toHaveBeenCalledWith('none');
  });
});
