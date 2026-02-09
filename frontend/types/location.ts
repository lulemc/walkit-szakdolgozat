export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  coordinates: Coordinates;
  name: string;       
  address: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export type RouteType = 'circular' | 'point-to-point';

export type MapSelectionMode = 'none' | 'start' | 'destination';