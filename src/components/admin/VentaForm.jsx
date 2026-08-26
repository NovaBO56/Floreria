import { useState, useEffect } from 'react';
import { subscribeToTodosProductos } from '../../services/productoService';
import './VentaForm.css';
const ORIGENES = ['TIENDA_FISICA', 'WHATSAPP', 'INSTAGRAM', 'TELEFONO', 'OTRO'];
const METODOS_PAGO = ['efectivo', 'qr', 'transferencia', 'otro'];

export default function VentaForm({ onGuardar }) {
  const [productos, setProductos] = useState([]);
  const [itemsVenta, setItemsVenta] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteContacto, setClienteContacto] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [origen, setOrigen] = useState('TIENDA_FISICA');
  const [observacion, setObservacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => subscribeToTodosProductos(setProductos), []);

  function agregarItem() {
    const producto = productos.find((p) => p.id === productoSeleccionado);
    if (!producto || cantidad <= 0) return;
    setItemsVenta((prev) => {
      const existente = prev.find((i) => i.productoId === producto.id);
      if (existente) {
        return prev.map((i) => i.productoId === producto.id ? { ...i, cantidad: i.cantidad + Number(cantidad) } : i);
      }
      return [...prev, { productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: Number(cantidad) }];
    });
    setCantidad(1);
  }

  function quitarItem(productoId) {
    setItemsVenta((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  const subtotal = itemsVenta.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const total = subtotal - Number(descuento || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (enviando || itemsVenta.length === 0) return;
    setEnviando(true);
    setError('');
    try {
      await onGuardar({
        cliente: clienteNombre ? { nombre: clienteNombre, contacto: clienteContacto } : null,
        items: itemsVenta, descuento: Number(descuento || 0), metodoPago, observacion, origen,
      });
      setItemsVenta([]); setClienteNombre(''); setClienteContacto(''); setDescuento(0); setObservacion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="venta-form" onSubmit={handleSubmit}>
      <h2>Nueva venta manual</h2>

      <div className="venta-selector-producto">
        <select value={productoSeleccionado} onChange={(e) => setProductoSeleccionado(e.target.value)}>
          <option value="">Selecciona un producto</option>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} — Bs {p.precio.toFixed(2)}</option>)}
        </select>
        <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <button type="button" onClick={agregarItem}>Agregar</button>
      </div>

      <ul className="venta-items">
        {itemsVenta.map((item) => (
          <li key={item.productoId}>
            {item.cantidad}x {item.nombre} — Bs {(item.precio * item.cantidad).toFixed(2)}
            <button type="button" onClick={() => quitarItem(item.productoId)}>✕</button>
          </li>
        ))}
      </ul>

      <label>Cliente (opcional)<input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} /></label>
      <label>WhatsApp/teléfono (opcional)<input value={clienteContacto} onChange={(e) => setClienteContacto(e.target.value)} /></label>
      <label>Descuento (Bs)<input type="number" step="0.01" value={descuento} onChange={(e) => setDescuento(e.target.value)} /></label>
      <label>Método de pago
        <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <label>Origen
        <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
          {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
      <label>Observación<textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} /></label>

      <p className="venta-total"><strong>Total: Bs {total.toFixed(2)}</strong></p>
      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={enviando || itemsVenta.length === 0}>
        {enviando ? 'Guardando...' : 'Registrar venta'}
      </button>
    </form>
  );
}