import { useColorScheme } from 'react-native';
import { useThemePreference } from '@/context/ThemePreferenceProvider';
import { lightTheme, darkTheme } from '@/theme/paperTheme';

/** The Paper theme: the one chosen in Settings, or the phone's light/dark setting */
export function useAppTheme() {
  const scheme = useColorScheme();
  const { preference } = useThemePreference();
  const mode = preference === 'system' ? scheme : preference;
  return mode === 'dark' ? darkTheme : lightTheme;
}
