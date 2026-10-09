import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedStorage?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string, selectedStorage?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string, selectedStorage?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'zy_gadget_store_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1, selectedColor?: string, selectedStorage?: string) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedStorage === selectedStorage
      );

      if (existingIndex > -1) {
        const next = [...prevItems];
        const nextQty = next[existingIndex].quantity + quantity;
        // Do not exceed available product stock
        const maxStock = product.stock > 0 ? product.stock : 99;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Math.min(nextQty, maxStock),
        };
        return next;
      } else {
        const initialQty = Math.min(quantity, product.stock > 0 ? product.stock : 1);
        return [...prevItems, { product, quantity: initialQty, selectedColor, selectedStorage }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number, selectedColor?: string, selectedStorage?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedStorage);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedColor === selectedColor &&
          item.selectedStorage === selectedStorage
        ) {
          const maxStock = item.product.stock > 0 ? item.product.stock : 99;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, selectedColor?: string, selectedStorage?: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === selectedColor &&
            item.selectedStorage === selectedStorage
          )
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        isCartOpen,
        setIsCartOpen,
      }}
    >
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
