import { useCart } from '../../context/CartContext';
import './CarritoDrawer.css';
export default function CarritoDrawer({ onProcederPedido }) {
  const { items, updateQuantity, removeItem, subtotal, carritoAbierto, cerrarCarrito } = useCart();

  if (!carritoAbierto) return null;

  return (
    <div className="carrito-overlay" onClick={cerrarCarrito}>
      <div className="carrito-drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Tu carrito</h2>
          <button onClick={cerrarCarrito}>✕</button>
        </header>

        {items.length === 0 ? (
          <p className="carrito-vacio">Tu carrito está vacío.</p>
        ) : (
          <>
            <ul className="carrito-items">
              {items.map((item) => (
                <li key={item.productoId} className="carrito-item">
                  <img src={item.imagenUrl} alt={item.nombre} />
                  <div className="carrito-item-info">
                    <h4>{item.nombre}</h4>
                    <p>Bs {item.precio.toFixed(2)}</p>
                    <div className="carrito-item-cantidad">
                      <button onClick={() => updateQuantity(item.productoId, item.cantidad - 1)}>-</button>
                      <span>{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.productoId, item.cantidad + 1)}>+</button>
                    </div>
                  </div>
                  <button className="carrito-item-quitar" onClick={() => removeItem(item.productoId)}>
                    🗑
                  </button>
                </li>
              ))}
            </ul>

            <footer className="carrito-footer">
              <div className="carrito-subtotal">
                <span>Subtotal</span>
                <strong>Bs {subtotal.toFixed(2)}</strong>
              </div>
              <button className="btn-seguir-comprando" onClick={cerrarCarrito}>
                Seguir comprando
              </button>
              <button className="btn-proceder-pedido" onClick={onProcederPedido}>
                Continuar con el pedido
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}