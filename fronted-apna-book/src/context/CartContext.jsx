import { createContext, useMemo, useState } from 'react';

export const CartContext = createContext({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateItemQuantity: () => {},
  clearCart: () => {}
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      const nextQuantity = item.quantity ?? 1;

      if (!existing) {
        return [...prev, { ...item, quantity: nextQuantity }];
      }

      return prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, quantity: (entry.quantity ?? 1) + nextQuantity }
          : entry
      );
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemQuantity = (id, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateItemQuantity, clearCart }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
