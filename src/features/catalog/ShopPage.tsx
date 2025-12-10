import { useEffect, useState } from 'react';
import { ProductList } from './components/ProductList';
import { CartDrawer } from './components/CartDrawer';
import { useCartStore } from './cart.store';
import { useSession } from '@/features/auth/client';
import { ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  sku: string;
  stockQty: number;
}

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, toggleCart, cartCount } = useCartStore();
  const { data: session } = useSession();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.map((p: any) => ({ ...p, price: Number(p.price) }))); // Prisma decimals needed number conversion for UI
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-shop-900 bg-noise pb-20">
      {/* Header/Hero for Shop */}
      <div className="relative py-20 px-8 border-b border-leather-800/30 bg-shop-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-serif text-4xl text-chrome-100 mb-2">Barber Shop</h1>
            <p className="text-chrome-400 max-w-lg">
              Produtos premium para manutenção do seu estilo em casa. Qualidade aprovada pelos
              nossos mestres barbeiros.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Cart Button (Mobile/Desktop) */}
      <button
        onClick={toggleCart}
        className="fixed bottom-8 right-8 z-40 bg-leather-700 text-white p-4 rounded-full shadow-2xl hover:bg-leather-600 transition-transform hover:scale-105 flex items-center gap-2"
      >
        <ShoppingBag />
        <span className="font-bold">{cartCount()}</span>
      </button>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {loading ? (
          <div className="text-center text-chrome-500">Carregando produtos...</div>
        ) : (
          <ProductList products={products} onAddToCart={addItem} />
        )}
      </div>

      {/* Drawers */}
      <CartDrawer products={products} />
    </div>
  );
}
