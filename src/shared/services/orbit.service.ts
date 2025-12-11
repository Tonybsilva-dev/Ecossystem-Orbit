export interface Plan {
  id: string;
  name: string;
  price: string; // or number, handled as string from API usually
  interval: 'MONTHLY' | 'YEARLY';
  features: string[];
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  plans: Plan[];
}

const ORBIT_API_URL = import.meta.env.VITE_ORBIT_API_URL || 'http://localhost:5173'; // Default to Orbit dev port

export const OrbitService = {
  getPlans: async (slug: string): Promise<Product | null> => {
    try {
      const response = await fetch(`${ORBIT_API_URL}/api/products/${slug}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch plans');
      }
      return await response.json();
    } catch (error) {
      console.error('OrbitService Error:', error);
      return null;
    }
  },
};
