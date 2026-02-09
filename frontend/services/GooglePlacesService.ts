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

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

class GooglePlacesService {
  /**
   * Search for places using Google Places Autocomplete API
   */
  async searchPlaces(query: string, location?: Coordinates): Promise<PlaceSuggestion[]> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
      
      const params: any = {
        input: query,
        key: GOOGLE_PLACES_API_KEY,
        language: 'en',
      };

      // Add location bias if provided (searches near user's location)
      if (location) {
        params.location = `${location.latitude},${location.longitude}`;
        params.radius = 50000; // 50km radius
      }

      const response = await axios.get(url, { params });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text,
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a place using Place Details API
   */
  async getPlaceDetails(placeId: string): Promise<Location> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json`;
      
      const params = {
        place_id: placeId,
        fields: 'name,formatted_address,geometry',
        key: GOOGLE_PLACES_API_KEY,
      };

      const response = await axios.get(url, { params });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
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
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
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
        throw new Error(`Geocoding API error: ${response.data.status}`);
      }

      const result = response.data.results[0];

      // Extract name from address components
      const streetNumber = result.address_components.find((c: any) => 
        c.types.includes('street_number')
      )?.long_name || '';
      
      const street = result.address_components.find((c: any) => 
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
      console.error('Error reverse geocoding:', error);
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