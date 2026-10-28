import api from './api';
import type { ApiResponse } from '@/types/api';
import i18n from '@/i18n';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RoutePreferences {
  parks: boolean;
  waterfront: boolean;
  avoidHighways: boolean;
  scenic: boolean;
  uphill: boolean;
  mountain: boolean;
  quietStreets: boolean;
  beach: boolean;
}

export interface GenerateRouteRequest {
  startLocation: Coordinates;
  destinationLocation?: Coordinates;
  distance?: number;
  routeType: 'circular' | 'point-to-point';
  preferences: RoutePreferences;
}

export interface Route {
  _id: string;
  userId: string;
  name: string | null;
  type: 'circular' | 'point-to-point';
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  coordinates: Coordinates[];
  totalDistance: number;
  estimatedDuration: number;
  preferenceScore: number;
  preferences: RoutePreferences;
  elevationGain: number;
  elevationLoss: number;
  maxElevation: number | null;
  minElevation: number | null;
  isFavorite: boolean;
  favoritedAt: string | null;
  /** Generated routes are drafts, removed after 7 days unless kept (favourite, name, walk, group walk) */
  status?: 'draft' | 'saved';
  draftExpiresAt?: string | null;
  lastWalkedAt: string | null;
  walkCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A route in a list: lists leave out the coordinates (load the route for its map) */
export type RouteSummary = Omit<Route, 'coordinates'>;

/** Lists page backwards: `before` is the oldest date already loaded */
export interface RoutePage {
  before?: string;
  limit?: number;
}

// Kept as an export from here so existing imports keep working
export type { ApiResponse } from '@/types/api';

class RouteService {
  /**
   * Generate a new walking route
   */
  async generateRoute(request: GenerateRouteRequest): Promise<Route> {
    const response = await api.post<ApiResponse<Route>>('/routes/generate', request);
    return response.data.data;
  }

  /**
   * A page of the logged-in user's routes, newest first, without coordinates
   */
  async getUserRoutes(page: RoutePage = {}): Promise<RouteSummary[]> {
    const response = await api.get<ApiResponse<RouteSummary[]>>('/routes', { params: page });
    return response.data.data;
  }

  /**
   * Get the current user's favourite routes, most recently favourited first
   */
  async getFavoriteRoutes(page: RoutePage = {}): Promise<RouteSummary[]> {
    const response = await api.get<ApiResponse<RouteSummary[]>>('/routes/favorites/list', {
      params: page,
    });
    return response.data.data;
  }

  /**
   * Get a single route by ID
   */
  async getRoute(routeId: string): Promise<Route> {
    const response = await api.get<ApiResponse<Route>>(`/routes/${routeId}`);
    return response.data.data;
  }

  /**
   * Add a route to the user's favourites; unnamed routes get a name like "Circular 5.2km"
   */
  async addFavorite(routeId: string): Promise<Route> {
    const response = await api.post<ApiResponse<Route>>(`/routes/${routeId}/favorite`, {});
    return response.data.data;
  }

  /**
   * Take a route out of the user's favourites
   */
  async removeFavorite(routeId: string): Promise<Route> {
    const response = await api.delete<ApiResponse<Route>>(`/routes/${routeId}/favorite`);
    return response.data.data;
  }

  /**
   * Give a route a new name
   */
  async renameRoute(routeId: string, name: string): Promise<Route> {
    const response = await api.patch<ApiResponse<Route>>(`/routes/${routeId}/name`, { name });
    return response.data.data;
  }

  /**
   * Delete a route
   */
  async deleteRoute(routeId: string): Promise<void> {
    await api.delete(`/routes/${routeId}`);
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return i18n.t('planner:units.minutes', { minutes: Math.round(minutes) });
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return i18n.t('planner:units.hoursMinutesShort', { hours, minutes: mins });
  }

  /**
   * Format elevation for display
   */
  formatElevation(meters: number | null): string {
    if (meters === null) {
      return i18n.t('planner:units.notAvailable');
    }
    return `${Math.round(meters)}m`;
  }

  /**
   * Calculate pace (min/km)
   */
  calculatePace(distanceMeters: number, durationMinutes: number): string {
    if (distanceMeters === 0) return i18n.t('planner:units.notAvailable');
    const distanceKm = distanceMeters / 1000;
    const pace = durationMinutes / distanceKm;
    return i18n.t('planner:units.pace', { pace: pace.toFixed(1) });
  }
}

export const routeService = new RouteService();