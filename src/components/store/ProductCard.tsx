import React from 'react';
import { ShoppingBag, Zap, Eye, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatINR } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onOrderNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onOrderNow,
}) => {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = React.useState(false);

  const mainImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';
  const isLowStock = product.available_stock > 0 && product.available_stock <= product.low_stock_threshold;
  const isOutOfStock = product.available_stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    const ok = addToCart(product, 1);
    if (ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    }
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onOrderNow(product);
  };

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative bg-white rounded-2xl border border-stone-200/80 hover:border-rose-300 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-stone-100">
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.category && (
            <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-stone-800 rounded-md shadow-xs">
              {product.category.name}
            </span>
          )}
          {isLowStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white rounded-md shadow-xs animate-pulse">
              Only {product.available_stock} Left!
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white rounded-md shadow-xs">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute inset-0 bg-stone-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-stone-900 text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="text-[11px] text-stone-400 font-mono tracking-wider mb-1">
            SKU: {product.sku}
          </div>
          <h3 className="font-serif text-base font-semibold text-stone-900 line-clamp-2 leading-snug group-hover:text-rose-700 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-stone-500 line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        {/* Pricing and Action Buttons */}
        <div className="pt-2 border-t border-stone-100 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-stone-900 font-sans tracking-tight">
              {formatINR(product.selling_price_paise)}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              In Stock: {product.available_stock}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                isOutOfStock
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-stone-800 hover:bg-stone-200 active:scale-95'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleOrderNow}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                isOutOfStock
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-rose-700 text-white hover:bg-rose-800 active:scale-95 shadow-sm shadow-rose-900/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
