import axios from 'axios';

// You'll need to get a Google Places API key from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Location {
  coordinates: Coordinates;
  name: string;
  address: string;
}

/* The parts of Google's answers that are used here */
interface GooglePrediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

interface GoogleAddressComponent {
  long_name: string;
  types: string[];
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/** Google's status, plus its explanation when it sends one */
const googleError = (api: string, data: { status: string; error_message?: string }) =>
  new Error(`${api} error: ${data.status}${data.error_message ? ` (${data.error_message})` : ''}`);

class GooglePlacesService {
  /**
   * Search for places using Google Places Autocomplete API. Pass the same
   * sessionToken for every search until a place is picked (see getPlaceDetails).
   */
  async searchPlaces(
    query: string,
    location?: Coordinates,
    sessionToken?: string,
  ): Promise<PlaceSuggestion[]> {
    // Errors are passed on; the caller tells the user (the search box)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
    
    const params: Record<string, string | number | undefined> = {
      input: query,
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
      ...(sessionToken && { sessiontoken: sessionToken }),
    };

    // Add location bias if provided (searches near user's location)
    if (location) {
      params.location = `${location.latitude},${location.longitude}`;
      params.radius = 50000; // 50km radius
    }

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw googleError('Google Places API', response.data);
    }

    return (response.data.predictions as GooglePrediction[]).map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
    }));
  }

  /**
   * Get detailed information about a place using Place Details API. With the
   * search's sessionToken, this ends the session (one billed search).
   */
  async getPlaceDetails(placeId: string, sessionToken?: string): Promise<Location> {
    // Errors are passed on; the caller tells the user (the planner)
    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    
    const params = {
      place_id: placeId,
      fields: 'name,formatted_address,geometry',
      key: GOOGLE_PLACES_API_KEY,
      ...(sessionToken && { sessiontoken: sessionToken }),
    };

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK') {
      throw googleError('Google Places API', response.data);
    }

    const result = response.data.result;

    return {
      coordinates: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      name: result.name,
      address: result.formatted_address,
    };
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<Location> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json`;
      
      const params = {
        latlng: `${coordinates.latitude},${coordinates.longitude}`,
        key: GOOGLE_PLACES_API_KEY,
      };

      const response = await axios.get(url, { params });

      if (response.data.status !== 'OK') {
        throw googleError('Geocoding API', response.data);
      }

      const result = response.data.results[0];

      // Extract name from address components
      const streetNumber = (result.address_components as GoogleAddressComponent[]).find((c) =>
        c.types.includes('street_number')
      )?.long_name || '';
      
      const street = (result.address_components as GoogleAddressComponent[]).find((c) =>
        c.types.includes('route')
      )?.long_name || '';

      const name = streetNumber && street 
        ? `${streetNumber} ${street}`
        : result.address_components[0]?.long_name || 'Selected Location';

      return {
        coordinates,
        name,
        address: result.formatted_address,
      };
    } catch (error) {
      // Return a basic location if geocoding fails
      return {
        coordinates,
        name: 'Selected Location',
        address: `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`,
      };
    }
  }
}

export default new GooglePlacesService();
export type { Coordinates, Location, PlaceSuggestion };