import React from 'react';
import Slider from '@react-native-community/slider';
import { act, fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import DistanceSelector from '../DistanceSelector';

describe('DistanceSelector', () => {
  it('shows the distance and about how long it takes', () => {
    const { getByText } = renderWithTheme(<DistanceSelector value={5} onChange={jest.fn()} />);

    expect(getByText('5.0 km')).toBeTruthy();
    // 11 minutes per km
    expect(getByText('~55 min')).toBeTruthy();
  });

  it('rounds slider values to 100 m', () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = renderWithTheme(<DistanceSelector value={5} onChange={onChange} />);

    act(() => UNSAFE_getByType(Slider).props.onValueChange(7.349));

    expect(onChange).toHaveBeenCalledWith(7.3);
  });

  it('takes a typed distance within the limits, and ignores others', () => {
    const onChange = jest.fn();
    const { getByLabelText } = renderWithTheme(<DistanceSelector value={5} onChange={onChange} />);

    fireEvent.changeText(getByLabelText('Distance (km)'), '12.5');
    fireEvent.changeText(getByLabelText('Distance (km)'), '99');
    fireEvent.changeText(getByLabelText('Distance (km)'), 'abc');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(12.5);
  });
});
