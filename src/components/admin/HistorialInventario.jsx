import { useEffect, useState } from 'react';
import { subscribeToHistorialProducto } from '../../services/movimientoInventarioService';
import './HistorialInventario.css';
const ETIQUETAS = { entrada: 'Entrada', venta: 'Venta', ajuste: 'Ajuste', merma: 'Merma' };

export default function HistorialInventario({ productoId, onCerrar }) {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => subscribeToHistorialProducto(productoId, setMovimientos), [productoId]);

  return (
    <div className="historial-inventario">
      <header>
        <h3>Historial de movimientos</h3>
        <button onClick={onCerrar}>✕</button>
      </header>
      <table className="admin-tabla">
        <thead>
          <tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Costo unit.</th><th>Motivo</th></tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id}>
              <td>{m.creadoEn?.toDate?.().toLocaleString?.() ?? '—'}</td>
              <td>{ETIQUETAS[m.tipo] ?? m.tipo}</td>
              <td>{m.cantidad}</td>
              <td>{m.costoUnitario ? `Bs ${m.costoUnitario.toFixed(2)}` : '—'}</td>
              <td>{m.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}