import React from 'react';
import { BackHandler } from 'react-native';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import StatisticsHomeScreen from '../StatisticsHomeScreen';

// The views have their own tests; here only the switching between them matters
jest.mock('../StatisticsScreen', () =>
  function MockStatisticsScreen() {
    const { Text } = jest.requireActual('react-native');
    return <Text>Health statistics</Text>;
  },
);
jest.mock('@/components/Walks/WalkHistorySection', () => ({
  WalkHistorySection: ({ onOpenWalk }: { onOpenWalk: (id: string) => void }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text onPress={() => onOpenWalk('w1')}>Walk history</Text>;
  },
}));
jest.mock('@/components/Walks/WalkDetailView', () => ({
  WalkDetailView: ({ walkId, onBack }: { walkId: string; onBack: () => void }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text onPress={onBack}>{`Walk detail ${walkId}`}</Text>;
  },
}));

let backHandler: () => boolean;

beforeEach(() => {
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    backHandler = handler as () => boolean;
    return { remove: jest.fn() };
  });
});

describe('StatisticsHomeScreen', () => {
  it('opens on the health statistics', () => {
    const { getByText } = renderWithTheme(<StatisticsHomeScreen />);

    expect(getByText('Health statistics')).toBeTruthy();
  });

  it('switches to my walks, opens one and goes back to the list', () => {
    const { getByText, queryByText } = renderWithTheme(<StatisticsHomeScreen />);

    fireEvent.press(getByText('Walks'));
    expect(getByText('Walk history')).toBeTruthy();
    expect(queryByText('Health statistics')).toBeNull();

    fireEvent.press(getByText('Walk history'));
    expect(getByText('Walk detail w1')).toBeTruthy();

    fireEvent.press(getByText('Walk detail w1'));
    expect(getByText('Walk history')).toBeTruthy();
  });

  it("goes back from a walk to the list with Android's back button, and leaves the list to the system", () => {
    const { getByText } = renderWithTheme(<StatisticsHomeScreen />);
    fireEvent.press(getByText('Walks'));
    fireEvent.press(getByText('Walk history'));

    let handled = false;
    act(() => {
      handled = backHandler();
    });

    expect(handled).toBe(true);
    expect(getByText('Walk history')).toBeTruthy();
    expect(backHandler()).toBe(false);
  });
});
