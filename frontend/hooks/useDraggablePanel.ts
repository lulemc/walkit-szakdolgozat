import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UseDraggablePanelOptions {
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
  onExpand?: () => void;
}

export const useDraggablePanel = ({
  minHeight = SCREEN_HEIGHT * 0.15,
  maxHeight = SCREEN_HEIGHT * 0.75,
  defaultHeight = SCREEN_HEIGHT * 0.35,
  onExpand,
}: UseDraggablePanelOptions = {}) => {
  const panelHeight = useSharedValue(defaultHeight);
  const context = useSharedValue({ y: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: panelHeight.value };
    })
    .onUpdate((event) => {
      const newHeight = context.value.y - event.translationY;
      panelHeight.value = Math.max(minHeight, Math.min(maxHeight, newHeight));
    })
    .onEnd((event) => {
      const velocity = -event.velocityY;

      if (velocity > 500) {
        panelHeight.value = withSpring(maxHeight, {
          damping: 20,
          stiffness: 90,
        });
        if (onExpand) {
          runOnJS(onExpand)();
        }
      } else if (velocity < -500) {
        panelHeight.value = withSpring(minHeight, {
          damping: 20,
          stiffness: 90,
        });
      } else {
        const currentHeight = panelHeight.value;
        const midPoint = (minHeight + maxHeight) / 2;

        if (currentHeight > midPoint) {
          panelHeight.value = withSpring(maxHeight, {
            damping: 20,
            stiffness: 90,
          });
          if (onExpand) {
            runOnJS(onExpand)();
          }
        } else {
          panelHeight.value = withSpring(minHeight, {
            damping: 20,
            stiffness: 90,
          });
        }
      }
    });

  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: panelHeight.value,
  }));

 const collapsePanel = () => {
    panelHeight.value = withSpring(minHeight, {
      damping: 20,
      stiffness: 90,
    });
  };
  
  const expandPanel = () => {
    panelHeight.value = withSpring(maxHeight, {
      damping: 20,
      stiffness: 90,
    });
  };
  
  return {
    panGesture,
    animatedPanelStyle,
    collapsePanel,
    expandPanel
  };
};