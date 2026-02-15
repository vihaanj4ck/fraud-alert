"use client";

import { createContext, useContext, useReducer, useCallback } from "react";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      const now = Date.now();
      const firstItemAddedAt = state.items.length === 0 ? now : state.firstItemAddedAt;
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product.id === action.product.id ? { ...i, quantity: i.quantity + (action.quantity || 1) } : i
          ),
        };
      }
      return {
        items: [...state.items, { product: action.product, quantity: action.quantity || 1 }],
        firstItemAddedAt,
      };
    }
    case "UPDATE_QUANTITY": {
      if (action.quantity < 1) {
        const nextItems = state.items.filter((i) => i.product.id !== action.productId);
        return {
          items: nextItems,
          firstItemAddedAt: nextItems.length === 0 ? null : state.firstItemAddedAt,
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    }
    case "REMOVE": {
      const nextItems = state.items.filter((i) => i.product.id !== action.productId);
      return {
        items: nextItems,
        firstItemAddedAt: nextItems.length === 0 ? null : state.firstItemAddedAt,
      };
    }
    case "CLEAR":
      return { items: [], firstItemAddedAt: null };
    default:
      return state;
  }
}

const initialState = { items: [], firstItemAddedAt: null };

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = useCallback((product, quantity = 1) => {
    dispatch({ type: "ADD", product, quantity });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
  }, []);

  const removeFromCart = useCallback((productId) => {
    dispatch({ type: "REMOVE", productId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        firstItemAddedAt: state.firstItemAddedAt ?? null,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
