interface GeoPosition {
  lat: number;
  lng: number;
}

interface AddressResult {
  city: string;
  state: string;
}

export const geolocationService = {
  getCurrentPosition: (): Promise<GeoPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      );
    });
  },

  reverseGeocode: async (lat: number, lng: number): Promise<AddressResult> => {
    try {
      // Using OpenStreetMap Nominatim API (Free, requires User-Agent)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BarberFlow/1.0',
          },
        },
      );

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
      const address = data.address;

      // Extract City (City -> Town -> Village -> County)
      const city =
        address.city || address.town || address.village || address.municipality || address.county;

      // Extract State Code (ISO reference usually needs mapping, but Nominatim returns state name or code depending on region)
      // For Brazil, Nominatim often returns "São Paulo", "Rio de Janeiro".
      // We might need a helper to map State Name -> UF if strict match is needed.
      // For MVP, we will try to find the ISO code or use state name.
      // Actually, Nominatim addresses often contain "ISO3166-2-lvl4" key for reference but it's not guaranteed in the main object.
      // Let's rely on simple extraction for now and assume the user can correct it if needed.

      // Attempt to find UF from state name roughly if needed, or just return name.
      // Ideally, we'd have a map. For now, let's keep it robust by returning what we find.

      return {
        city: city || 'Desconhecida',
        state: address.state || '',
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  },
};
