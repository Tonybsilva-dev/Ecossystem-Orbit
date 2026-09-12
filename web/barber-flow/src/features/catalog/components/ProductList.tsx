import { useState } from 'react';
import { ProductCard } from './ProductCard';
import { cn } from '@/shared/utils/cn';

// Mock types for now, will replace with Prisma types
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
}

interface ProductListProps {
  products: Product[];
  onAddToCart: (id: string) => void;
}

const CATEGORIES = ['Todos', 'Cabelo', 'Barba', 'Acessórios'];

export function ProductList({ products, onAddToCart }: ProductListProps) {
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredProducts =
    selectedCategory === 'Todos'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all border',
              selectedCategory === cat
                ? 'bg-leather-700 text-white border-leather-700 shadow-md shadow-leather-900/30'
                : 'bg-shop-900 text-chrome-400 border-leather-800/30 hover:border-leather-500 hover:text-chrome-200',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} {...product} onAddToCart={onAddToCart} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 text-chrome-500">
          <p>Nenhum produto encontrado nesta categoria.</p>
        </div>
      )}
    </div>
  );
}
