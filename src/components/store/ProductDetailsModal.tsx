import React, { useState } from 'react';
import { X, ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, Check } from 'lucide-react';
import { Product } from '../../types';
import { formatINR } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderNow: (product: Product, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onOrderNow,
}) => {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [{ id: 'default', image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', storage_path: '', display_order: 1, is_thumbnail: true }];

  const currentImage = images[selectedImageIndex]?.image_url || images[0].image_url;
  const isOutOfStock = product.available_stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const ok = addToCart(product, quantity);
    if (ok) {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
        onClose();
      }, 1000);
    }
  };

  const handleOrderNow = () => {
    if (isOutOfStock) return;
    onOrderNow(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-all shadow-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery Column */}
          <div className="bg-stone-50 p-6 flex flex-col justify-between">
            <div className="aspect-4/5 w-full rounded-2xl overflow-hidden bg-white shadow-inner mb-4">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImageIndex === idx ? 'border-rose-600 ring-2 ring-rose-200' : 'border-stone-200 hover:border-stone-400 opacity-70'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              {product.category && (
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                  {product.category.name}
                </span>
              )}

              <h2 className="font-serif text-2xl font-bold text-stone-900 mt-2.5 leading-snug">
                {product.name}
              </h2>

              <div className="flex items-center gap-4 mt-2 text-xs font-mono text-stone-400">
                <span>SKU: {product.sku}</span>
                <span>•</span>
                <span className={isOutOfStock ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                  {isOutOfStock ? 'Out of Stock' : `${product.available_stock} Available`}
                </span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-950 font-sans">
                  {formatINR(product.selling_price_paise)}
                </span>
                <span className="text-xs text-stone-400">Taxes included</span>
              </div>

              {/* Description */}
              <div className="mt-4 text-xs text-stone-600 leading-relaxed border-t border-b border-stone-100 py-3">
                {product.description}
              </div>

              {/* Value propositions */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Combed Cotton</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-rose-600" />
                  <span>Dispatched in 24 Hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span>Assisted WhatsApp Orders</span>
                </div>
              </div>
            </div>

            {/* Actions & Quantity */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700">Quantity</span>
                  <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-sm font-semibold font-mono text-stone-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.available_stock, quantity + 1))}
                      className="px-3 py-1 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    isOutOfStock
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-95'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Bag
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleOrderNow}
                  className={`py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    isOutOfStock
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-rose-700 text-white hover:bg-rose-800 active:scale-95 shadow-lg shadow-rose-900/20'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current" /> Order Now
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
