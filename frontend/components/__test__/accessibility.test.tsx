import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import { makeRoute } from '@/components/Social/__test__/routeFixtures';
import ConfirmationModal from '../ConformationModal';
import ActionButton from '../ActionButton';
import SuggestionItem from '../WalkPlanner/SuggestionItem';
import MapSelectionIndicator from '../WalkPlanner/MapSelectionIndicator';
import SearchCard from '../WalkPlanner/SearchCard';
import RouteInfoCard from '../WalkPlanner/RouteInfoCard';
import { WalkStatsPanel } from '../ActiveWalk/WalkStatsPanel';

// Screen readers need a role and a name for everything that can be pressed
describe('accessibility', () => {
  it("dialogs can be closed with a named button, and their content isn't hidden in one element", () => {
    const onClose = jest.fn();
    const { getByRole, getByText } = renderWithTheme(
      <ConfirmationModal visible onClose={onClose} onConfirm={jest.fn()} title="Delete" message="Sure?" />,
    );

    expect(getByText('Sure?')).toBeTruthy();
    expect(getByRole('button', { name: 'Confirm' })).toBeTruthy();
    fireEvent.press(getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('action buttons are buttons named after their label', () => {
    const { getByRole } = renderWithTheme(<ActionButton label="📍 Current" onPress={jest.fn()} active />);

    expect(getByRole('button', { name: '📍 Current' })).toBeSelected();
  });

  it('place suggestions read as one button with the place and its area', () => {
    const { getByRole } = renderWithTheme(
      <SuggestionItem
        suggestion={{ placeId: 'p1', description: 'Heroes Square', mainText: 'Heroes Square', secondaryText: 'Budapest' }}
        onPress={jest.fn()}
      />,
    );

    expect(getByRole('button', { name: 'Heroes Square, Budapest' })).toBeTruthy();
  });

  it('picking on the map can be cancelled with a named button', () => {
    const onCancel = jest.fn();
    const { getByRole } = renderWithTheme(<MapSelectionIndicator type="start" onCancel={onCancel} />);

    fireEvent.press(getByRole('button', { name: 'Cancel picking on the map' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('the search box has a named clear button', () => {
    const onClear = jest.fn();
    const { getByRole } = renderWithTheme(
      <SearchCard
        value="her"
        onChangeText={jest.fn()}
        onClear={onClear}
        suggestions={[]}
        onSelectSuggestion={jest.fn()}
        onCancel={jest.fn()}
        isSearching={false}
      />,
    );

    fireEvent.press(getByRole('button', { name: 'Clear search' }));

    expect(onClear).toHaveBeenCalled();
  });

  it("the route summary's close icon is a named button", () => {
    const onClose = jest.fn();
    const { getByRole } = renderWithTheme(
      <RouteInfoCard route={makeRoute()} onClose={onClose} onStartWalk={jest.fn()} />,
    );

    fireEvent.press(getByRole('button', { name: 'Close route summary' }));

    expect(onClose).toHaveBeenCalled();
  });

  it("the walk's numbers read as one sentence", () => {
    const { getByLabelText } = renderWithTheme(
      <WalkStatsPanel distanceM={1234} plannedDistanceM={5200} elapsedSec={600} />,
    );

    expect(getByLabelText('Walked 1.23km of 5.20km in 10m 0s, pace 8:06 minutes per kilometre')).toBeTruthy();
  });
});
