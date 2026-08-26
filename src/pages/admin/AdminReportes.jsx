import { useState } from 'react';
import {
  rangoFecha, obtenerVentasEnRango, obtenerCierresCajaEnRango,
  obtenerMovimientosInventarioEnRango, calcularResumenVentas,
} from '../../services/reporteService';
import './AdminReportes.css';
const FILTROS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'ayer', label: 'Ayer' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' },
  { id: 'personalizado', label: 'Rango personalizado' },
];

export default function AdminReportes() {
  const [filtro, setFiltro] = useState('hoy');
  const [desdeCustom, setDesdeCustom] = useState('');
  const [hastaCustom, setHastaCustom] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [cierres, setCierres] = useState([]);
  const [movimientosInv, setMovimientosInv] = useState([]);

  async function generarReporte() {
    setCargando(true);
    try {
      const { desde, hasta } = rangoFecha(filtro, desdeCustom, hastaCustom);
      const [ventas, cierresCaja, movInventario] = await Promise.all([
        obtenerVentasEnRango(desde, hasta),
        obtenerCierresCajaEnRango(desde, hasta),
        obtenerMovimientosInventarioEnRango(desde, hasta),
      ]);
      setResumen(calcularResumenVentas(ventas));
      setCierres(cierresCaja);
      setMovimientosInv(movInventario);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="admin-reportes">
      <h1>Reportes</h1>

      <div className="reportes-filtros">
        {FILTROS.map((f) => (
          <button key={f.id} className={filtro === f.id ? 'activo' : ''} onClick={() => setFiltro(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {filtro === 'personalizado' && (
        <div className="reportes-rango-custom">
          <label>Desde <input type="date" value={desdeCustom} onChange={(e) => setDesdeCustom(e.target.value)} /></label>
          <label>Hasta <input type="date" value={hastaCustom} onChange={(e) => setHastaCustom(e.target.value)} /></label>
        </div>
      )}

      <button onClick={generarReporte} disabled={cargando}>
        {cargando ? 'Generando...' : 'Generar reporte'}
      </button>

      {resumen && (
        <>
          <section className="reportes-resumen">
            <div className="reporte-card"><span>Ventas</span><strong>{resumen.cantidadVentas}</strong></div>
            <div className="reporte-card"><span>Ingresos</span><strong>Bs {resumen.ingresos.toFixed(2)}</strong></div>
            <div className="reporte-card"><span>Costos</span><strong>Bs {resumen.costos.toFixed(2)}</strong></div>
            <div className="reporte-card"><span>Ganancia bruta</span><strong>Bs {resumen.gananciaBruta.toFixed(2)}</strong></div>
          </section>

          <section>
            <h2>Productos más vendidos</h2>
            <ul>
              {resumen.productosMasVendidos.map(([nombre, cantidad]) => (
                <li key={nombre}>{nombre} — {cantidad} unidades</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Ventas por método de pago</h2>
            <ul>
              {Object.entries(resumen.porMetodoPago).map(([metodo, total]) => (
                <li key={metodo}>{metodo}: Bs {total.toFixed(2)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Ventas por canal</h2>
            <ul>
              {Object.entries(resumen.porCanal).map(([canal, total]) => (
                <li key={canal}>{canal}: Bs {total.toFixed(2)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Cierres de caja en el período</h2>
            {cierres.length === 0 ? <p>Sin cierres registrados.</p> : (
              <table className="admin-tabla">
                <thead><tr><th>Fecha</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr></thead>
                <tbody>
                  {cierres.map((c) => (
                    <tr key={c.id}>
                      <td>{c.cerradoEn?.toDate?.().toLocaleString?.() ?? '—'}</td>
                      <td>Bs {c.totalEsperado.toFixed(2)}</td>
                      <td>Bs {c.montoContado.toFixed(2)}</td>
                      <td>Bs {c.diferencia.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Movimientos de inventario en el período</h2>
            {movimientosInv.length === 0 ? <p>Sin movimientos.</p> : (
              <table className="admin-tabla">
                <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th></tr></thead>
                <tbody>
                  {movimientosInv.map((m) => (
                    <tr key={m.id}>
                      <td>{m.creadoEn?.toDate?.().toLocaleString?.() ?? '—'}</td>
                      <td>{m.tipo}</td>
                      <td>{m.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}