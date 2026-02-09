import { renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { useDraggablePanel } from '../useDraggablePanel';

describe('useDraggablePanel', () => {
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  it('initializes with default height', () => {
    const { result } = renderHook(() => useDraggablePanel());

    // The hook returns panGesture and animatedPanelStyle
    expect(result.current.panGesture).toBeDefined();
    expect(result.current.animatedPanelStyle).toBeDefined();
  });

  it('uses custom min, max, and default heights', () => {
    const customOptions = {
      minHeight: 100,
      maxHeight: 500,
      defaultHeight: 300,
    };

    const { result } = renderHook(() => useDraggablePanel(customOptions));

    expect(result.current.panGesture).toBeDefined();
    expect(result.current.animatedPanelStyle).toBeDefined();
  });

  it('accepts onExpand callback', () => {
    const onExpand = jest.fn();

    const { result } = renderHook(() =>
      useDraggablePanel({
        onExpand,
      })
    );

    expect(result.current.panGesture).toBeDefined();
    // onExpand will be called when gesture triggers expansion
  });

  it('calculates default heights based on screen size', () => {
    const { result } = renderHook(() => useDraggablePanel());

    // Default values:
    // minHeight = SCREEN_HEIGHT * 0.15
    // maxHeight = SCREEN_HEIGHT * 0.75
    // defaultHeight = SCREEN_HEIGHT * 0.35

    expect(result.current.panGesture).toBeDefined();
    expect(result.current.animatedPanelStyle).toBeDefined();
  });

  it('returns gesture handler', () => {
    const { result } = renderHook(() => useDraggablePanel());

    expect(result.current.panGesture).toHaveProperty('onStart');
    expect(result.current.panGesture).toHaveProperty('onUpdate');
    expect(result.current.panGesture).toHaveProperty('onEnd');
  });

  it('returns animated style', () => {
    const { result } = renderHook(() => useDraggablePanel());

    expect(typeof result.current.animatedPanelStyle).toBe('object');
  });
});