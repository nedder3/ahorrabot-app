// context/cart-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS, PRICES, getActivePromos, STORES } from '../services/supermarket-data';

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
}

export interface StoreCartTotal {
  storeId: string;
  storeName: string;
  distance: number;
  totalPrice: number;
  breakdown: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  calculateCartTotals: (day: string, userCards: string[]) => StoreCartTotal[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem('shopping_cart');
        if (storedCart) {
          setCart(JSON.parse(storedCart));
        }
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    };
    loadCart();
  }, []);

  // Save cart to AsyncStorage when it changes
  const saveCart = async (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      await AsyncStorage.setItem('shopping_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  };

  const addToCart = (productId: string, quantity = 1) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItemIndex = cart.findIndex(item => item.productId === productId);
    let newCart = [...cart];

    if (existingItemIndex > -1) {
      newCart[existingItemIndex].quantity += quantity;
    } else {
      newCart.push({
        productId,
        name: product.name,
        quantity
      });
    }

    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const existingItemIndex = cart.findIndex(item => item.productId === productId);
    if (existingItemIndex === -1) return;

    let newCart = [...cart];
    if (newCart[existingItemIndex].quantity > 1) {
      newCart[existingItemIndex].quantity -= 1;
    } else {
      newCart.splice(existingItemIndex, 1);
    }

    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Calculate cart totals for all supermarkets, applying today's active discounts
  const calculateCartTotals = (day: string, userCards: string[]): StoreCartTotal[] => {
    if (cart.length === 0) return [];

    return STORES.map(store => {
      let totalPrice = 0;
      const itemDetails: string[] = [];

      cart.forEach(item => {
        // Find price record for this product at this store
        const priceRecord = PRICES.find(p => p.productId === item.productId && p.storeId === store.id);
        const basePrice = priceRecord ? priceRecord.price : 0;
        
        // Find active promotions for this store, day, and user cards
        const activePromos = getActivePromos(store.id, day, userCards);
        
        // Calculate item discount
        let itemDiscount = 0;
        activePromos.forEach(p => {
          itemDiscount = Math.min(50, itemDiscount + p.discountPercent); // cap at 50%
        });

        const finalItemPrice = Math.round(basePrice * (1 - itemDiscount / 100));
        const itemTotal = finalItemPrice * item.quantity;
        totalPrice += itemTotal;

        itemDetails.push(`${item.quantity}x ${item.name.split(' ')[0]} ($${finalItemPrice} c/u)`);
      });

      const breakdown = `Detalle: ${itemDetails.join(', ')}`;

      return {
        storeId: store.id,
        storeName: store.name,
        distance: store.distance,
        totalPrice,
        breakdown
      };
    }).sort((a, b) => a.totalPrice - b.totalPrice); // Sort cheapest store first
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, calculateCartTotals }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
