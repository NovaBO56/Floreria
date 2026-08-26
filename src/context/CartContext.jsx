import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'floreria_carrito';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Evita duplicar líneas por doble clic: si el producto ya está,
  // solo incrementa la cantidad.
  function addItem(producto, cantidad = 1) {
    setItems((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.productoId === producto.id
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        );
      }
      return [
        ...prev,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagenUrl: producto.imagenUrl,
          cantidad,
        },
      ];
    });
  }

  function updateQuantity(productoId, cantidad) {
    if (cantidad <= 0) {
      removeItem(productoId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i))
    );
  }

  function removeItem(productoId) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((suma, i) => suma + i.precio * i.cantidad, 0),
    [items]
  );

  const cantidadTotal = useMemo(
    () => items.reduce((suma, i) => suma + i.cantidad, 0),
    [items]
  );

  const value = {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    cantidadTotal,
    carritoAbierto,
    abrirCarrito: () => setCarritoAbierto(true),
    cerrarCarrito: () => setCarritoAbierto(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de un CartProvider');
  return context;
}