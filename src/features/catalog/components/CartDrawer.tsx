import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../cart.store';
import { Button } from '@/shared/ui/Button';
import { useNavigate } from 'react-router';

// We'll need to fetch product details for items in cart
// For now, let's assume we pass the full product map or fetch it
// To keep it simple for this MVP, we might need a way to look up product details.
// A common pattern is to keep a map of products in a store or context,
// OR fetch details for cart items.
// For now, let's accept a 'products' prop to look up details.

interface ProductLookup {
  id: string;
  name: string;
  price: number;
  image: string | null;
}

interface CartDrawerProps {
  products: ProductLookup[]; // Pass available products to look up details
}

export function CartDrawer({ products }: CartDrawerProps) {
  const { isOpen, closeCart, items, removeItem, updateQuantity, cartCount } = useCartStore();
  const navigate = useNavigate();

  const total = items.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + (product ? product.price * item.quantity : 0);
  }, 0);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout'); // We'll implement this later or just verify
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-shop-900 border-l border-leather-800/30 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-leather-800/30 flex justify-between items-center bg-shop-900/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-leather-600" />
                <h2 className="font-serif text-xl text-chrome-100">Seu Carrinho ({cartCount()})</h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-white/5 rounded-full text-chrome-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="text-center text-chrome-500 py-10">
                  <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Seu carrinho está vazio.</p>
                  <Button variant="outline" className="mt-4" onClick={closeCart}>
                    Continuar Comprando
                  </Button>
                </div>
              ) : (
                items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;

                  return (
                    <div key={item.productId} className="flex gap-4 items-start">
                      <div className="w-20 h-20 bg-shop-800 rounded-sm overflow-hidden flex-shrink-0 border border-leather-800/30">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-chrome-200 font-medium line-clamp-1">{product.name}</h4>
                        <p className="text-leather-500 font-bold mt-1">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(product.price)}
                        </p>

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-leather-800/30 rounded-sm bg-shop-800">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="px-2 py-1 text-chrome-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 text-sm text-chrome-200 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="px-2 py-1 text-chrome-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-red-500 hover:text-red-400 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-leather-800/30 bg-shop-900/95 backdrop-blur space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-chrome-400">Total</span>
                  <span className="text-chrome-100 font-serif">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      total,
                    )}
                  </span>
                </div>
                <Button className="w-full py-4 text-base" onClick={handleCheckout}>
                  Finalizar Compra
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
