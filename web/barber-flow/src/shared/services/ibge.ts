export interface UF {
  id: number;
  sigla: string;
  nome: string;
}

export interface City {
  id: number;
  nome: string;
}

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
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

  getAddressByCEP: async (cep: string): Promise<ViaCEPResponse | null> => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) return null;

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) throw new Error('Failed to fetch address');

      const data = await response.json();
      if (data.erro) return null;

      return data;
    } catch (error) {
      console.error('Error fetching address by CEP:', error);
      return null;
    }
  },
};
