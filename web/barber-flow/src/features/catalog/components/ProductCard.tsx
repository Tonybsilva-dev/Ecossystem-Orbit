import { ShoppingCart } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  onAddToCart: (id: string) => void;
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  onAddToCart,
}: ProductCardProps) {
  return (
    <div className="group bg-shop-800/30 border border-leather-800/30 rounded-sm overflow-hidden hover:border-leather-500/50 transition-all hover:shadow-lg hover:shadow-leather-900/20 flex flex-col h-full">
      <div className="relative aspect-square overflow-hidden bg-shop-900">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-chrome-600 bg-shop-900">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2 bg-shop-900/90 backdrop-blur px-2 py-1 text-xs text-leather-400 font-medium rounded-sm border border-leather-800/30 uppercase tracking-wide">
          {category}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-serif text-lg text-chrome-100 mb-1 group-hover:text-leather-400 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-chrome-400 mb-4 line-clamp-2 flex-1">{description}</p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-leather-800/10 gap-3">
          <span className="font-bold text-xl text-chrome-50 font-serif">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
          </span>
          <Button
            variant="chrome"
            size="sm"
            onClick={() => onAddToCart(id)}
            className="flex items-center gap-2"
          >
            <ShoppingCart size={16} />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
