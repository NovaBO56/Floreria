import { useState } from 'react';
import './PedidoCard.css';
export default function PedidoCard({ pedido, onConfirmar, onRechazar }) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirmar() {
    if (procesando) return; // evita doble clic
    setProcesando(true);
    setError('');
    try {
      await onConfirmar(pedido.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  async function handleRechazar() {
    if (procesando) return;
    setProcesando(true);
    setError('');
    try {
      await onRechazar(pedido.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="pedido-card">
      <header>
        <h3>Pedido #{pedido.numero}</h3>
        <span className="pedido-fecha">
          {pedido.creadoEn?.toDate?.().toLocaleString?.() ?? ''}
        </span>
      </header>

      <p><strong>Cliente:</strong> {pedido.cliente.nombre}</p>
      <p><strong>WhatsApp:</strong> {pedido.cliente.whatsapp}</p>
      <p><strong>Modalidad:</strong> {pedido.modalidad === 'recojo' ? 'Recojo en tienda' : 'Entrega'}</p>

      {pedido.modalidad === 'recojo' ? (
        <p><strong>Fecha/hora:</strong> {pedido.fechaHora}</p>
      ) : (
        <p><strong>Dirección:</strong> {pedido.entrega?.direccion} — {pedido.entrega?.zona}</p>
      )}

      <ul className="pedido-items">
        {pedido.items.map((item) => (
          <li key={item.productoId}>
            {item.cantidad}x {item.nombre} — Bs {(item.precio * item.cantidad).toFixed(2)}
          </li>
        ))}
      </ul>

      <p className="pedido-total"><strong>Total:</strong> Bs {pedido.total.toFixed(2)}</p>

      {pedido.dedicatoria && <p><strong>Dedicatoria:</strong> {pedido.dedicatoria}</p>}

      {error && <p className="form-error">{error}</p>}

      <div className="pedido-acciones">
        <button className="btn-confirmar" disabled={procesando} onClick={handleConfirmar}>
          ✅ Confirmar
        </button>
        <button className="btn-rechazar" disabled={procesando} onClick={handleRechazar}>
          ❌ Rechazar
        </button>
      </div>
    </div>
  );
}