import React from 'react';
import { act } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import HomeScreen from '@/app/(app)/home';
import { SocialNavigationProvider, useSocialNavigation } from '@/screens/social/socialNavigation';
import type { Route } from '@/services/routeService';

// Only the props Home hands to the planner are under test here
const mockPlannerProps = jest.fn();
jest.mock('@/screens/WalkPlanner', () => (props: unknown) => {
  mockPlannerProps(props);
  return null;
});
const mockWalkProps = jest.fn();
jest.mock('@/screens/ActiveWalkScreen', () => (props: unknown) => {
  mockWalkProps(props);
  return null;
});
const mockMyRoutesProps = jest.fn();
jest.mock('@/screens/MyRoutesScreen', () => (props: unknown) => {
  mockMyRoutesProps(props);
  return null;
});

const route = { _id: 'r1' } as Route;
const lastPlannerProps = () => mockPlannerProps.mock.calls.at(-1)[0];
const lastMyRoutesProps = () => mockMyRoutesProps.mock.calls.at(-1)[0];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeScreen', () => {
  it("doesn't offer group walks without the Social tab", () => {
    renderWithTheme(<HomeScreen />);

    expect(lastPlannerProps().onPlanGroupWalk).toBeUndefined();
  });

  it('plans a group walk with the route by opening the Social create-walk view', () => {
    let social: ReturnType<typeof useSocialNavigation> | undefined;
    const SocialProbe = () => {
      social = useSocialNavigation();
      return null;
    };
    const onOpen = jest.fn();
    renderWithTheme(
      <SocialNavigationProvider onOpen={onOpen}>
        <HomeScreen />
        <SocialProbe />
      </SocialNavigationProvider>,
    );

    act(() => lastPlannerProps().onPlanGroupWalk(route));

    expect(social?.view).toEqual({ screen: 'createWalk', route });
    expect(onOpen).toHaveBeenCalled();
  });

  describe('my routes', () => {
    it('opens from the planner and goes back to it', () => {
      renderWithTheme(<HomeScreen />);

      act(() => lastPlannerProps().onOpenMyRoutes());
      expect(mockMyRoutesProps).toHaveBeenCalled();

      mockPlannerProps.mockClear();
      act(() => lastMyRoutesProps().onBack());
      expect(mockPlannerProps).toHaveBeenCalled();
    });

    it('walks a saved route, then returns to the planner', () => {
      renderWithTheme(<HomeScreen />);
      act(() => lastPlannerProps().onOpenMyRoutes());

      act(() => lastMyRoutesProps().onWalk(route));
      expect(mockWalkProps).toHaveBeenLastCalledWith(expect.objectContaining({ route }));

      mockPlannerProps.mockClear();
      act(() => mockWalkProps.mock.calls.at(-1)[0].onEndWalk());
      expect(mockPlannerProps).toHaveBeenCalled();
    });

    it('offers group walks only with the Social tab', () => {
      renderWithTheme(<HomeScreen />);
      act(() => lastPlannerProps().onOpenMyRoutes());
      expect(lastMyRoutesProps().onPlanGroupWalk).toBeUndefined();
    });

    it('plans a group walk with a saved route in the Social tab', () => {
      let social: ReturnType<typeof useSocialNavigation> | undefined;
      const SocialProbe = () => {
        social = useSocialNavigation();
        return null;
      };
      renderWithTheme(
        <SocialNavigationProvider onOpen={jest.fn()}>
          <HomeScreen />
          <SocialProbe />
        </SocialNavigationProvider>,
      );
      act(() => lastPlannerProps().onOpenMyRoutes());

      act(() => lastMyRoutesProps().onPlanGroupWalk(route));

      expect(social?.view).toEqual({ screen: 'createWalk', route });
    });
  });
});
