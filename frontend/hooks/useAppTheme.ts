import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/theme/paperTheme';

export function useAppTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
