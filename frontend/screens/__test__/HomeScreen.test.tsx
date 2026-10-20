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
jest.mock('@/screens/ActiveWalkScreen', () => () => null);

const route = { _id: 'r1' } as Route;
const lastPlannerProps = () => mockPlannerProps.mock.calls.at(-1)[0];

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
});
