import React from 'react';
import { BackHandler } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import { useSavedRoutes } from '@/hooks/useSavedRoutes';
import { routeService } from '@/services/routeService';
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
const unnamed = makeRoute({
  _id: 'r2',
  name: null,
  totalDistance: 3000,
  status: 'draft',
  coordinates: [
    { latitude: 47.52, longitude: 19.06 },
    { latitude: 47.53, longitude: 19.07 },
  ],
});
const getRoute = jest.spyOn(routeService, 'getRoute');

/** Lists come without coordinates; the detail loads the whole route */
const summaryOf = ({ coordinates, ...summary }: typeof riverside) => summary;

const saved = {
  favourites: [summaryOf(riverside)],
  recent: [summaryOf(unnamed)],
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
  getRoute.mockImplementation(async (id) => (id === 'r1' ? riverside : unnamed));
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandler = handler as () => boolean;
    return { remove: jest.fn() };
  });
});

const renderScreen = (props: Partial<React.ComponentProps<typeof MyRoutesScreen>> = {}) => {
  const handlers = { onBack: jest.fn(), onWalk: jest.fn(), onPlanGroupWalk: jest.fn() };
  return { ...renderWithTheme(<MyRoutesScreen {...handlers} {...props} />), ...handlers };
};

/** Opens the route and waits until the whole route has loaded */
const openRiverside = async (screen: ReturnType<typeof renderScreen>) => {
  fireEvent.press(screen.getByLabelText('Open Riverside loop'));
  await screen.findByLabelText('Map of the route');
};

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
    it('loads the whole route and shows it on a map with its details', async () => {
      const screen = renderScreen();

      await openRiverside(screen);

      expect(getRoute).toHaveBeenCalledWith('r1');
      expect(screen.getByText('Riverside loop')).toBeTruthy();
      expect(screen.getByText('Walked 3 times')).toBeTruthy();
    });

    it("can't be walked until the whole route has loaded", () => {
      getRoute.mockReturnValue(new Promise(() => {}));
      const screen = renderScreen();

      fireEvent.press(screen.getByLabelText('Open Riverside loop'));

      expect(screen.getByRole('button', { name: 'Walk this route' })).toBeDisabled();
      expect(screen.getByLabelText('Loading the route')).toBeTruthy();
    });

    it('offers a retry when the whole route fails to load', async () => {
      getRoute.mockRejectedValueOnce(new Error('Network Error'));
      const screen = renderScreen();
      fireEvent.press(screen.getByLabelText('Open Riverside loop'));

      fireEvent.press(await screen.findByText('Try again'));

      expect(await screen.findByLabelText('Map of the route')).toBeTruthy();
    });

    it('says when a route is only a draft, which is removed after 7 days', async () => {
      const screen = renderScreen();

      fireEvent.press(screen.getByLabelText('Open Circular route'));

      expect(await screen.findByText(/removed after 7 days unless you favourite, rename or walk it/)).toBeTruthy();
      fireEvent.press(screen.getByText('Back'));
      await openRiverside(screen);
      expect(screen.queryByText(/removed after 7 days/)).toBeNull();
    });

    it('walks the route again', async () => {
      const screen = renderScreen();
      await openRiverside(screen);

      fireEvent.press(screen.getByText('Walk this route'));

      expect(screen.onWalk).toHaveBeenCalledWith(riverside);
    });

    it('plans a group walk with it, where group walks are available', async () => {
      const screen = renderScreen();
      await openRiverside(screen);

      fireEvent.press(screen.getByText('Plan group walk'));

      expect(screen.onPlanGroupWalk).toHaveBeenCalledWith(riverside);
    });

    it("doesn't offer group walks without the Social tab", async () => {
      const screen = renderScreen({ onPlanGroupWalk: undefined });
      await openRiverside(screen);

      expect(screen.queryByText('Plan group walk')).toBeNull();
    });

    it('takes a favourite out of the favourites, and adds other routes', async () => {
      const screen = renderScreen();
      await openRiverside(screen);
      fireEvent.press(screen.getByText('Remove from favourites'));
      expect(saved.toggleFavorite).toHaveBeenCalledWith(saved.favourites[0]);

      fireEvent.press(screen.getByText('Back'));
      fireEvent.press(screen.getByLabelText('Open Circular route'));
      await screen.findByLabelText('Map of the route');
      fireEvent.press(screen.getByText('Add to favourites'));
      expect(saved.toggleFavorite).toHaveBeenCalledWith(saved.recent[0]);
    });

    it('renames the route', async () => {
      const screen = renderScreen();
      await openRiverside(screen);

      fireEvent.press(screen.getByText('Rename'));
      expect(screen.getByLabelText('Route name').props.value).toBe('Riverside loop');
      fireEvent.changeText(screen.getByLabelText('Route name'), '  Hill loop ');
      fireEvent.press(screen.getByText('Save'));

      await waitFor(() => expect(saved.rename).toHaveBeenCalledWith('r1', 'Hill loop'));
      expect(await screen.findByText('Walk this route')).toBeTruthy();
    });

    it("can't save an empty name", async () => {
      const screen = renderScreen();
      await openRiverside(screen);
      fireEvent.press(screen.getByText('Rename'));

      fireEvent.changeText(screen.getByLabelText('Route name'), '   ');

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('deletes the route after confirming, then shows the list', async () => {
      const screen = renderScreen();
      await openRiverside(screen);

      fireEvent.press(screen.getByText('Delete route'));
      fireEvent.press(await screen.findByText('Keep'));
      expect(saved.remove).not.toHaveBeenCalled();

      fireEvent.press(screen.getByText('Delete route'));
      fireEvent.press(await screen.findByText('Delete'));

      await waitFor(() => expect(saved.remove).toHaveBeenCalledWith('r1'));
      expect(await screen.findByText('Favourites')).toBeTruthy();
    });

    it("shows the backend's message when an action fails", async () => {
      (useSavedRoutes as jest.Mock).mockReturnValue({ ...saved, actionError: 'Route not found' });
      const screen = renderScreen();

      await openRiverside(screen);

      expect(screen.getByText('Route not found')).toBeTruthy();
    });
  });

  describe("Android's back button", () => {
    it('goes from a route to the list, and from the list to the planner', async () => {
      const screen = renderScreen();
      await openRiverside(screen);

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
