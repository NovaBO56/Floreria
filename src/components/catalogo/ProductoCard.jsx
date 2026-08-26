import { useState } from 'react';
import { tieneStock } from '../../services/productoService';
import './ProductoCard.css';

export default function ProductoCard({ producto, categoriaNombre, onVerDetalle, onAgregarCarrito }) {
  const disponible = tieneStock(producto);
  const [agregando, setAgregando] = useState(false);

  function handleAgregar() {
    onAgregarCarrito(producto);
    // Microanimación breve de confirmación en el botón, sin bloquear
    // ninguna lógica del carrito.
    setAgregando(true);
    setTimeout(() => setAgregando(false), 900);
  }

  return (
    <div className="producto-card">
      <div className="producto-imagen-wrap">
        <img src={producto.imagenUrl} alt={producto.nombre} loading="lazy" />
        {!disponible && <span className="badge-agotado">Agotado</span>}
        {producto.promocion && disponible && <span className="badge-promo">Promoción</span>}
      </div>

      <div className="producto-info">
        <span className="producto-categoria">{categoriaNombre}</span>
        <h3>{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="producto-descripcion">{producto.descripcion}</p>
        )}
        <p className="producto-precio">Bs {producto.precio.toFixed(2)}</p>

        <div className="producto-acciones">
          <button type="button" onClick={() => onVerDetalle(producto)}>
            Ver detalles
          </button>
          <button
            type="button"
            className={agregando ? 'btn-agregado' : ''}
            disabled={!disponible}
            onClick={handleAgregar}
          >
            {!disponible ? 'Agotado' : agregando ? '✓ Agregado' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
