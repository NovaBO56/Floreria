import { useEffect, useState } from 'react';
import {
  abrirCaja, subscribeToCajaAbierta, registrarMovimientoCaja,
  subscribeToMovimientosCaja, calcularTotalEsperado, cerrarCaja, subscribeToHistorialCierres,
} from '../../services/cajaService';
import { subscribeToVentasEfectivoDesde } from '../../services/ventaService';
import { useAuth } from '../../context/AuthContext';
import './AdminCaja.css';
export default function AdminCaja() {
  const { currentUser } = useAuth();
  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [ventasEfectivo, setVentasEfectivo] = useState([]);
  const [historialCierres, setHistorialCierres] = useState([]);
  const [montoInicial, setMontoInicial] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('ingreso');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [descripcionMovimiento, setDescripcionMovimiento] = useState('');
  const [montoContado, setMontoContado] = useState('');
  const [error, setError] = useState('');

  useEffect(() => subscribeToCajaAbierta(setCaja), []);
  useEffect(() => subscribeToHistorialCierres(setHistorialCierres), []);

  useEffect(() => {
    if (!caja) { setMovimientos([]); setVentasEfectivo([]); return; }
    const unsubMov = subscribeToMovimientosCaja(caja.id, setMovimientos);
    const unsubVentas = subscribeToVentasEfectivoDesde(caja.abiertoEn, setVentasEfectivo);
    return () => { unsubMov(); unsubVentas(); };
  }, [caja]);

  async function handleAbrirCaja(e) {
    e.preventDefault();
    setError('');
    try {
      await abrirCaja({ montoInicial: Number(montoInicial), realizadoPor: currentUser.uid });
      setMontoInicial('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegistrarMovimiento(e) {
    e.preventDefault();
    if (!caja) return;
    await registrarMovimientoCaja({
      cajaId: caja.id, tipo: tipoMovimiento, monto: montoMovimiento,
      descripcion: descripcionMovimiento, realizadoPor: currentUser.uid,
    });
    setMontoMovimiento(''); setDescripcionMovimiento('');
  }

  const totalEsperado = caja ? calcularTotalEsperado(caja, movimientos, ventasEfectivo) : 0;

  async function handleCerrarCaja(e) {
    e.preventDefault();
    if (!caja) return;
    const diferencia = await cerrarCaja({
      cajaId: caja.id, montoContado: Number(montoContado), totalEsperado, realizadoPor: currentUser.uid,
    });
    setMontoContado('');
    alert(`Caja cerrada. Diferencia: Bs ${diferencia.toFixed(2)}`);
  }

  if (!caja) {
    return (
      <div className="admin-caja">
        <h1>Caja</h1>
        <p>No hay una caja abierta actualmente.</p>
        <form onSubmit={handleAbrirCaja} className="caja-form">
          <label>Monto inicial<input type="number" step="0.01" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} required /></label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Abrir caja</button>
        </form>

        <h2>Historial de cierres</h2>
        <table className="admin-tabla">
          <thead><tr><th>Fecha cierre</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead>
          <tbody>
            {historialCierres.map((c) => (
              <tr key={c.id}>
                <td>{c.cerradoEn?.toDate?.().toLocaleString?.() ?? '—'}</td>
                <td>Bs {c.totalEsperado.toFixed(2)}</td>
                <td>Bs {c.montoContado.toFixed(2)}</td>
                <td>Bs {c.diferencia.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="admin-caja">
      <h1>Caja abierta</h1>
      <p>Monto inicial: Bs {caja.montoInicial.toFixed(2)}</p>

      <form onSubmit={handleRegistrarMovimiento} className="caja-movimiento-form">
        <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)}>
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
        </select>
        <input type="number" step="0.01" placeholder="Monto" value={montoMovimiento} onChange={(e) => setMontoMovimiento(e.target.value)} required />
        <input placeholder="Descripción" value={descripcionMovimiento} onChange={(e) => setDescripcionMovimiento(e.target.value)} />
        <button type="submit">Registrar</button>
      </form>

      <table className="admin-tabla">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Descripción</th></tr></thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id}>
              <td>{m.creadoEn?.toDate?.().toLocaleString?.() ?? '—'}</td>
              <td>{m.tipo}</td>
              <td>Bs {m.monto.toFixed(2)}</td>
              <td>{m.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p><strong>Total esperado en caja: Bs {totalEsperado.toFixed(2)}</strong></p>

      <form onSubmit={handleCerrarCaja} className="caja-cierre-form">
        <label>Monto contado físicamente<input type="number" step="0.01" value={montoContado} onChange={(e) => setMontoContado(e.target.value)} required /></label>
        <button type="submit">Cerrar caja</button>
      </form>
    </div>
  );
}