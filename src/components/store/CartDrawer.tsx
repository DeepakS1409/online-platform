import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/formatters';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotalPaise,
    deliveryChargePaise,
    grandTotalPaise,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  const freeDeliveryThresholdPaise = 99900;
  const remainingForFreeDelivery = freeDeliveryThresholdPaise - subtotalPaise;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-700" />
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Your Shopping Bag ({cart.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          {cart.length > 0 && (
            <div className="bg-rose-50/70 px-4 py-2.5 border-b border-rose-100 text-xs">
              {remainingForFreeDelivery > 0 ? (
                <div className="text-stone-700">
                  Add <strong className="text-rose-700 font-bold">{formatINR(remainingForFreeDelivery)}</strong> more to unlock <strong className="text-emerald-700">FREE Delivery</strong>!
                </div>
              ) : (
                <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>You've unlocked FREE Delivery across India!</span>
                </div>
              )}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">Your bag is empty</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs">
                    Explore our pure cotton Nighties, Panties, Banians, and Nightdresses to begin shopping.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-rose-700 text-white rounded-full text-xs font-semibold hover:bg-rose-800 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const img = item.product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80';
                return (
                  <div
                    key={item.product.id}
                    className="flex gap-4 p-3 bg-stone-50/60 rounded-2xl border border-stone-200/60 hover:border-stone-300 transition-all"
                  >
                    <img
                      src={img}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover rounded-xl bg-stone-200 flex-shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-stone-400 mt-0.5">
                          SKU: {item.product.sku}
                        </div>
                        <div className="text-xs font-bold text-stone-950 mt-1">
                          {formatINR(item.product.selling_price_paise)}
                        </div>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-200/50 mt-2">
                        <div className="flex items-center border border-stone-200 bg-white rounded-md overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold font-mono text-stone-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-bold text-stone-900">
                          {formatINR(item.product.selling_price_paise * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Price Breakdown */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">{formatINR(subtotalPaise)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-900">
                    {deliveryChargePaise === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      formatINR(deliveryChargePaise)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Grand Total</span>
                  <span className="text-rose-800">{formatINR(grandTotalPaise)}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedToCheckout();
                  }}
                  className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-98 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={clearCart}
                  className="w-full text-center text-[11px] text-stone-400 hover:text-stone-600 mt-2"
                >
                  Empty Bag
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
