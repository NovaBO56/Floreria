import { useEffect, useState } from 'react';
import VentaForm from '../../components/admin/VentaForm';
import { subscribeToVentas, registrarVentaManual } from '../../services/ventaService';
import { useAuth } from '../../context/AuthContext';

export default function AdminVentas() {
  const [ventas, setVentas] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => subscribeToVentas(setVentas), []);

  async function handleGuardar(datos) {
    await registrarVentaManual({ ...datos, realizadoPor: currentUser.uid });
  }

  return (
    <div className="admin-ventas">
      <h1>Ventas</h1>
      <VentaForm onGuardar={handleGuardar} />
      <table className="admin-tabla">
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Canal</th><th>Método</th><th>Total</th></tr></thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id}>
              <td>{v.creadoEn?.toDate?.().toLocaleString?.() ?? '—'}</td>
              <td>{v.cliente?.nombre ?? '—'}</td>
              <td>{v.canal}</td>
              <td>{v.metodoPago ?? '—'}</td>
              <td>Bs {v.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}