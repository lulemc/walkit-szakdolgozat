import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import i18n from '@/i18n';
import { renderWithTheme } from './renderWithTheme';
import { WalkGoalCard } from '../WalkGoalCard';

const props = { goalKm: 10, thisWeekM: 4200, streak: 3, onSaveGoal: jest.fn(() => Promise.resolve()) };

beforeEach(() => jest.clearAllMocks());

describe('WalkGoalCard', () => {
  it("shows this week's progress towards the goal and the streak", () => {
    const { getByText, getByLabelText } = renderWithTheme(<WalkGoalCard {...props} />);

    expect(getByText('4.2 of 10 km')).toBeTruthy();
    expect(getByText('🔥 3-week streak')).toBeTruthy();
    expect(getByLabelText('Weekly goal: 4.2 of 10 km, 42%. 3-week streak')).toBeTruthy();
  });

  it('celebrates a reached goal', () => {
    const { getByText } = renderWithTheme(<WalkGoalCard {...props} thisWeekM={12000} />);

    expect(getByText('Goal reached 🎉')).toBeTruthy();
  });

  it('invites to start a streak when there is none', () => {
    const { getByText } = renderWithTheme(<WalkGoalCard {...props} streak={0} />);

    expect(getByText('Walk this week to start a streak')).toBeTruthy();
  });

  it('changes the goal', async () => {
    const { getByText, getByLabelText, queryByText } = renderWithTheme(<WalkGoalCard {...props} />);

    fireEvent.press(getByText('Change goal'));
    fireEvent.changeText(getByLabelText('Weekly goal (km)'), '15');
    await act(async () => fireEvent.press(getByText('Save')));

    expect(props.onSaveGoal).toHaveBeenCalledWith(15);
    await waitFor(() => expect(queryByText('Weekly goal (km)')).toBeNull());
  });

  it('only accepts 1 to 200 km', () => {
    const { getByText, getByLabelText } = renderWithTheme(<WalkGoalCard {...props} />);

    fireEvent.press(getByText('Change goal'));
    fireEvent.changeText(getByLabelText('Weekly goal (km)'), '500');
    fireEvent.press(getByText('Save'));

    expect(getByText('Enter a goal between 1 and 200 km')).toBeTruthy();
    expect(props.onSaveGoal).not.toHaveBeenCalled();
  });

  it('keeps the dialog open with a message when saving fails', async () => {
    const onSaveGoal = jest.fn(() => Promise.reject(new Error('offline')));
    const { getByText, getByLabelText } = renderWithTheme(<WalkGoalCard {...props} onSaveGoal={onSaveGoal} />);

    fireEvent.press(getByText('Change goal'));
    fireEvent.changeText(getByLabelText('Weekly goal (km)'), '15');
    await act(async () => fireEvent.press(getByText('Save')));

    expect(getByText("Couldn't save the goal. Please try again.")).toBeTruthy();
  });
});

describe('WalkGoalCard in Hungarian', () => {
  beforeEach(() => i18n.changeLanguage('hu'));
  // Switching back re-renders the screen still on show
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('shows the goal and the streak in Hungarian', () => {
    const { getByText } = renderWithTheme(<WalkGoalCard {...props} />);

    expect(getByText('Heti cél')).toBeTruthy();
    expect(getByText('4.2 / 10 km')).toBeTruthy();
    expect(getByText('🔥 3 hetes sorozat')).toBeTruthy();
  });
});
