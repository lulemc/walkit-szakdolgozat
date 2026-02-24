import api  from './api';

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
  createdAt: string;
  updatedAt: string;
}

export interface GenerateRouteResponse {
  message: string;
  route: Route;
}

export interface GetUserRoutesResponse {
  message: string;
  count: number;
  routes: Route[];
}

class RouteService {
  /**
   * Generate a new walking route
   */
  async generateRoute(request: GenerateRouteRequest): Promise<Route> {
  const response = await api.post<any>(
    '/routes/generate',
    request
  );
  return response.data.data;  // ✅ CORRECT - backend returns 'data'
}

  /**
   * Get all routes for the current user
   */
  async getUserRoutes(userId: string): Promise<Route[]> {
    const response = await api.get<GetUserRoutesResponse>(
      `/routes/user/${userId}`
    );
    return response.data.routes;
  }

  /**
   * Get a single route by ID
   */
  async getRoute(routeId: string): Promise<Route> {
    const response = await api.get<{ message: string; route: Route }>(
      `/routes/${routeId}`
    );
    return response.data.route;
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
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  /**
   * Format elevation for display
   */
  formatElevation(meters: number | null): string {
    if (meters === null) {
      return 'N/A';
    }
    return `${Math.round(meters)}m`;
  }

  /**
   * Calculate pace (min/km)
   */
  calculatePace(distanceMeters: number, durationMinutes: number): string {
    if (distanceMeters === 0) return 'N/A';
    const distanceKm = distanceMeters / 1000;
    const pace = durationMinutes / distanceKm;
    return `${pace.toFixed(1)} min/km`;
  }
}

export const routeService = new RouteService();