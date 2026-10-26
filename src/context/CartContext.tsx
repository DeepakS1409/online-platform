import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { db } from '../services/db';
import { calculateDelivery } from '../utils/formatters';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotalPaise: number;
  deliveryChargePaise: number;
  grandTotalPaise: number;
  totalItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'v2_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({
    default_delivery_charge_paise: 6000,
    free_delivery_threshold_paise: 99900
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    db.getBusinessSettings().then(s => {
      setDeliverySettings({
        default_delivery_charge_paise: s.default_delivery_charge_paise,
        free_delivery_threshold_paise: s.free_delivery_threshold_paise
      });
    });
  }, []);

  const addToCart = (product: Product, quantity = 1): boolean => {
    if (quantity <= 0) return false;
    const available = product.available_stock;
    if (available <= 0) {
      alert(`Sorry, "${product.name}" is currently out of stock.`);
      return false;
    }

    let success = true;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > available) {
          alert(`Cannot add more. Maximum available stock is ${available}.`);
          success = false;
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        if (quantity > available) {
          alert(`Cannot add ${quantity}. Only ${available} available.`);
          success = false;
          return prev;
        }
        return [...prev, { product, quantity }];
      }
    });

    if (success) {
      setIsCartOpen(true);
    }
    return success;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const maxAvailable = item.product.available_stock;
          const clamped = Math.min(quantity, maxAvailable);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotalPaise = cart.reduce(
    (sum, item) => sum + item.product.selling_price_paise * item.quantity,
    0
  );

  const deliveryChargePaise = cart.length > 0 
    ? calculateDelivery(subtotalPaise, deliverySettings)
    : 0;

  const grandTotalPaise = subtotalPaise + deliveryChargePaise;

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotalPaise,
        deliveryChargePaise,
        grandTotalPaise,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
