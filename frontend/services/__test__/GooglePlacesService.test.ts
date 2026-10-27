import GooglePlacesService from '../GooglePlacesService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Suppress console errors in tests
const originalConsoleError = console.error;

describe('GooglePlacesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress expected console.error calls
  });

  afterEach(() => {
    console.error = originalConsoleError; // Restore
  });

  describe('searchPlaces', () => {
    it('returns place suggestions successfully', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          predictions: [
            {
              place_id: '123',
              description: 'Heroes Square, Budapest, Hungary',
              structured_formatting: {
                main_text: 'Heroes Square',
                secondary_text: 'Budapest, Hungary',
              },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await GooglePlacesService.searchPlaces('Heroes Square');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        placeId: '123',
        description: 'Heroes Square, Budapest, Hungary',
        mainText: 'Heroes Square',
        secondaryText: 'Budapest, Hungary',
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        expect.objectContaining({
          params: expect.objectContaining({
            input: 'Heroes Square',
            language: 'en',
          }),
        })
      );
    });

    it('includes location bias when provided', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          predictions: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await GooglePlacesService.searchPlaces('cafe', {
        latitude: 47.4979,
        longitude: 19.0402,
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            location: '47.4979,19.0402',
            radius: 50000,
          }),
        })
      );
    });

    it('handles zero results', async () => {
      const mockResponse = {
        data: {
          status: 'ZERO_RESULTS',
          predictions: [],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const results = await GooglePlacesService.searchPlaces('nonexistent');
      expect(results).toEqual([]);
    });

    it('sends the session token, so Google bills the searches and the pick as one', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { status: 'ZERO_RESULTS', predictions: [] } });

      await GooglePlacesService.searchPlaces('Heroes', undefined, 'token-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        expect.objectContaining({ params: expect.objectContaining({ sessiontoken: 'token-1' }) }),
      );
    });

    it("includes Google's explanation in the error", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { status: 'REQUEST_DENIED', error_message: 'This API project is not authorized to use this API.' },
      });

      await expect(GooglePlacesService.searchPlaces('test')).rejects.toThrow(
        'Google Places API error: REQUEST_DENIED (This API project is not authorized to use this API.)',
      );
    });

    it('throws error on API failure', async () => {
      const mockResponse = {
        data: {
          status: 'REQUEST_DENIED',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(
        GooglePlacesService.searchPlaces('test')
      ).rejects.toThrow();
    });
  });

  describe('getPlaceDetails', () => {
    it('returns place details successfully', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          result: {
            name: 'Heroes Square',
            formatted_address: 'Budapest, Hősök tere, 1146 Hungary',
            geometry: {
              location: {
                lat: 47.5148,
                lng: 19.0782,
              },
            },
          },
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await GooglePlacesService.getPlaceDetails('123');

      expect(result).toEqual({
        coordinates: {
          latitude: 47.5148,
          longitude: 19.0782,
        },
        name: 'Heroes Square',
        address: 'Budapest, Hősök tere, 1146 Hungary',
      });
    });

    it('ends the search session with the same token', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          status: 'OK',
          result: { name: 'H', formatted_address: 'A', geometry: { location: { lat: 1, lng: 2 } } },
        },
      });

      await GooglePlacesService.getPlaceDetails('123', 'token-1');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/details/json',
        expect.objectContaining({ params: expect.objectContaining({ place_id: '123', sessiontoken: 'token-1' }) }),
      );
    });

    it('throws error on API failure', async () => {
      const mockResponse = {
        data: {
          status: 'NOT_FOUND',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(
        GooglePlacesService.getPlaceDetails('invalid')
      ).rejects.toThrow();
    });
  });

  describe('reverseGeocode', () => {
    it('returns location with address successfully', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          results: [
            {
              formatted_address: 'Budapest, Hősök tere, 1146 Hungary',
              address_components: [
                {
                  long_name: '14',
                  types: ['street_number'],
                },
                {
                  long_name: 'Hősök tere',
                  types: ['route'],
                },
              ],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await GooglePlacesService.reverseGeocode({
        latitude: 47.5148,
        longitude: 19.0782,
      });

      expect(result).toEqual({
        coordinates: {
          latitude: 47.5148,
          longitude: 19.0782,
        },
        name: '14 Hősök tere',
        address: 'Budapest, Hősök tere, 1146 Hungary',
      });
    });

    it('handles missing street components', async () => {
      const mockResponse = {
        data: {
          status: 'OK',
          results: [
            {
              formatted_address: 'Budapest, Hungary',
              address_components: [
                {
                  long_name: 'Budapest',
                  types: ['locality'],
                },
              ],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await GooglePlacesService.reverseGeocode({
        latitude: 47.4979,
        longitude: 19.0402,
      });

      expect(result.name).toBe('Budapest');
    });

    it('returns fallback location on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const coords = {
        latitude: 47.4979,
        longitude: 19.0402,
      };

      const result = await GooglePlacesService.reverseGeocode(coords);

      expect(result).toEqual({
        coordinates: coords,
        name: 'Selected Location',
        address: '47.4979, 19.0402',
      });
    });
  });
});