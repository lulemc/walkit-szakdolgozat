import React from 'react';
import { BackHandler } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { useSavedRoutes } from '@/hooks/useSavedRoutes';
import MyRoutesScreen from '../MyRoutesScreen';

jest.mock('@/hooks/useSavedRoutes', () => ({ useSavedRoutes: jest.fn() }));

const riverside = makeRoute({
  _id: 'r1',
  name: 'Riverside loop',
  isFavorite: true,
  walkCount: 3,
  coordinates: [
    { latitude: 47.5, longitude: 19.04 },
    { latitude: 47.51, longitude: 19.05 },
  ],
});
const unnamed = makeRoute({ _id: 'r2', name: null, totalDistance: 3000 });

const saved = {
  favourites: [riverside],
  recent: [unnamed],
  status: 'ready',
  actionError: null,
  reload: jest.fn(),
  toggleFavorite: jest.fn().mockResolvedValue(true),
  rename: jest.fn().mockResolvedValue(true),
  remove: jest.fn().mockResolvedValue(true),
};

let backHandler: () => boolean;

beforeEach(() => {
  jest.clearAllMocks();
  (useSavedRoutes as jest.Mock).mockReturnValue(saved);
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandler = handler as () => boolean;
    return { remove: jest.fn() };
  });
});

const renderScreen = (props: Partial<React.ComponentProps<typeof MyRoutesScreen>> = {}) => {
  const handlers = { onBack: jest.fn(), onWalk: jest.fn(), onPlanGroupWalk: jest.fn() };
  return { ...renderWithTheme(<MyRoutesScreen {...handlers} {...props} />), ...handlers };
};

const openRiverside = (screen: ReturnType<typeof renderScreen>) =>
  fireEvent.press(screen.getByLabelText('Open Riverside loop'));

describe('MyRoutesScreen', () => {
  describe('the list', () => {
    it('shows my favourite and recent routes', () => {
      const { getByText, getByLabelText } = renderScreen();

      expect(getByText('Favourites')).toBeTruthy();
      expect(getByText('Recent')).toBeTruthy();
      expect(getByLabelText('Open Riverside loop')).toBeTruthy();
      expect(getByLabelText('Open Circular route')).toBeTruthy();
    });

    it('explains how routes get here when there are none', () => {
      (useSavedRoutes as jest.Mock).mockReturnValue({ ...saved, favourites: [], recent: [] });

      const { getByText } = renderScreen();

      expect(getByText(/No saved routes yet/)).toBeTruthy();
    });

    it('offers a retry when loading fails', () => {
      (useSavedRoutes as jest.Mock).mockReturnValue({ ...saved, favourites: [], recent: [], status: 'error' });
      const { getByText } = renderScreen();

      fireEvent.press(getByText('Try again'));

      expect(saved.reload).toHaveBeenCalled();
    });

    it('goes back to the planner', () => {
      const { getByText, onBack } = renderScreen();

      fireEvent.press(getByText('Back'));

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('a route', () => {
    it('shows the route on a map with its details', () => {
      const screen = renderScreen();

      openRiverside(screen);

      expect(screen.getByText('Riverside loop')).toBeTruthy();
      expect(screen.getByLabelText('Map of the route')).toBeTruthy();
      expect(screen.getByText('Walked 3 times')).toBeTruthy();
    });

    it('walks the route again', () => {
      const screen = renderScreen();
      openRiverside(screen);

      fireEvent.press(screen.getByText('Walk this route'));

      expect(screen.onWalk).toHaveBeenCalledWith(riverside);
    });

    it('plans a group walk with it, where group walks are available', () => {
      const screen = renderScreen();
      openRiverside(screen);

      fireEvent.press(screen.getByText('Plan group walk'));

      expect(screen.onPlanGroupWalk).toHaveBeenCalledWith(riverside);
    });

    it("doesn't offer group walks without the Social tab", () => {
      const screen = renderScreen({ onPlanGroupWalk: undefined });
      openRiverside(screen);

      expect(screen.queryByText('Plan group walk')).toBeNull();
    });

    it('takes a favourite out of the favourites, and adds other routes', () => {
      const screen = renderScreen();
      openRiverside(screen);
      fireEvent.press(screen.getByText('Remove from favourites'));
      expect(saved.toggleFavorite).toHaveBeenCalledWith(riverside);

      fireEvent.press(screen.getByText('Back'));
      fireEvent.press(screen.getByLabelText('Open Circular route'));
      fireEvent.press(screen.getByText('Add to favourites'));
      expect(saved.toggleFavorite).toHaveBeenCalledWith(unnamed);
    });

    it('renames the route', async () => {
      const screen = renderScreen();
      openRiverside(screen);

      fireEvent.press(screen.getByText('Rename'));
      expect(screen.getByLabelText('Route name').props.value).toBe('Riverside loop');
      fireEvent.changeText(screen.getByLabelText('Route name'), '  Hill loop ');
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => expect(saved.rename).toHaveBeenCalledWith('r1', 'Hill loop'));
      expect(await screen.findByText('Walk this route')).toBeTruthy();
    });

    it("can't save an empty name", () => {
      const screen = renderScreen();
      openRiverside(screen);
      fireEvent.press(screen.getByText('Rename'));

      fireEvent.changeText(screen.getByLabelText('Route name'), '   ');

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('deletes the route after confirming, then shows the list', async () => {
      const screen = renderScreen();
      openRiverside(screen);

      fireEvent.press(screen.getByText('Delete route'));
      fireEvent.press(await screen.findByText('Keep'));
      expect(saved.remove).not.toHaveBeenCalled();

      fireEvent.press(screen.getByText('Delete route'));
      fireEvent.press(await screen.findByText('Delete'));

      await waitFor(() => expect(saved.remove).toHaveBeenCalledWith('r1'));
      expect(await screen.findByText('Favourites')).toBeTruthy();
    });

    it("shows the backend's message when an action fails", () => {
      (useSavedRoutes as jest.Mock).mockReturnValue({ ...saved, actionError: 'Route not found' });
      const screen = renderScreen();

      openRiverside(screen);

      expect(screen.getByText('Route not found')).toBeTruthy();
    });
  });

  describe("Android's back button", () => {
    it('goes from a route to the list, and from the list to the planner', () => {
      const screen = renderScreen();
      openRiverside(screen);

      act(() => {
        expect(backHandler()).toBe(true);
      });
      expect(screen.getByText('Favourites')).toBeTruthy();

      act(() => {
        expect(backHandler()).toBe(true);
      });
      expect(screen.onBack).toHaveBeenCalled();
    });
  });
});
