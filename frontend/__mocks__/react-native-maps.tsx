import React from 'react';
import { View } from 'react-native';

// The native map module isn't available in Jest; the map renders as a plain view
const MapView = (props: object) => <View {...props} />;

export const Polyline = () => null;
export const Marker = () => null;
export const PROVIDER_GOOGLE = 'google';
export default MapView;
