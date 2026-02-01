import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

const brandColors = {
  primary: '#9fc7aa',
  secondary: '#602e9e',
  beige: '#faf5f5',
  lightPurple:'#91a2dd',
  khaki: '#d8d355',
  error: '#fc741d',
  black: '#3a3a3a',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    error: brandColors.error,
    background: brandColors.beige,
    onBackground: brandColors.black,
    onSurface: brandColors.black,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  dark: true,
  mode: 'exact',
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    error: brandColors.error,
    background: brandColors.black,
    onBackground: brandColors.beige,
    onSurface: brandColors.beige,

  },
};
