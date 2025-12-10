export interface UF {
  id: number;
  sigla: string;
  nome: string;
}

export interface City {
  id: number;
  nome: string;
}

const BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

export const ibgeService = {
  getStates: async (): Promise<UF[]> => {
    try {
      const response = await fetch(`${BASE_URL}/estados?orderBy=nome`);
      if (!response.ok) throw new Error('Failed to fetch states');
      return await response.json();
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  },

  getCities: async (uf: string): Promise<City[]> => {
    try {
      const response = await fetch(`${BASE_URL}/estados/${uf}/municipios?orderBy=nome`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  },
};
