import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '@/components/Statistics/__test__/renderWithTheme';
import RouteTypeSelector from '../RouteTypeSelector';

describe('RouteTypeSelector', () => {
  it('marks the chosen route type', () => {
    const { getByRole } = renderWithTheme(<RouteTypeSelector value="circular" onChange={jest.fn()} />);

    expect(getByRole('radio', { name: /Circular Loop/ })).toBeChecked();
    expect(getByRole('radio', { name: /Point-to-Point/ })).not.toBeChecked();
  });

  it('switches between circular and point-to-point', () => {
    const onChange = jest.fn();
    const { getByText } = renderWithTheme(<RouteTypeSelector value="circular" onChange={onChange} />);

    fireEvent.press(getByText('Point-to-Point'));
    fireEvent.press(getByText('Circular Loop'));

    expect(onChange.mock.calls).toEqual([['point-to-point'], ['circular']]);
  });
});
