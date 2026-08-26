import { useEffect, useState } from 'react';
import LoteForm from '../../components/admin/LoteForm';
import AjusteStockForm from '../../components/admin/AjusteStockForm';
import HistorialInventario from '../../components/admin/HistorialInventario';
import { subscribeToInventario, filtrarPorDisponibilidad } from '../../services/inventarioService';
import { registrarEntradaLote, registrarAjusteStock, registrarMerma } from '../../services/loteService';
import { useAuth } from '../../context/AuthContext';
import './AdminInventario.css';
export default function AdminInventario() {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [productoActivo, setProductoActivo] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => subscribeToInventario(setProductos), []);

  const productosFiltrados = filtrarPorDisponibilidad(productos, filtro);

  async function handleGuardarLote(datos) {
    await registrarEntradaLote({ ...datos, productoId: productoActivo.id, realizadoPor: currentUser.uid });
    setProductoActivo(null);
  }

  async function handleGuardarAjuste(datos) {
    await registrarAjusteStock({ ...datos, productoId: productoActivo.id, realizadoPor: currentUser.uid });
    setProductoActivo(null);
  }

  async function handleGuardarMerma(datos) {
    await registrarMerma({
      productoId: productoActivo.id,
      cantidad: Math.abs(Number(datos.cantidad)),
      motivo: datos.motivo,
      realizadoPor: currentUser.uid,
    });
    setProductoActivo(null);
  }

  return (
    <div className="admin-inventario">
      <h1>Inventario</h1>

      <div className="inventario-filtros">
        <button className={filtro === 'todos' ? 'activo' : ''} onClick={() => setFiltro('todos')}>Todos</button>
        <button className={filtro === 'disponibles' ? 'activo' : ''} onClick={() => setFiltro('disponibles')}>Disponibles</button>
        <button className={filtro === 'agotados' ? 'activo' : ''} onClick={() => setFiltro('agotados')}>Agotados</button>
      </div>

      <table className="admin-tabla">
        <thead><tr><th>Producto</th><th>Stock</th><th>Acciones</th></tr></thead>
        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.stock ?? 0}</td>
              <td className="inventario-acciones">
                <button onClick={() => setProductoActivo({ id: p.id, accion: 'lote' })}>+ Lote</button>
                <button onClick={() => setProductoActivo({ id: p.id, accion: 'ajuste' })}>Ajustar</button>
                <button onClick={() => setProductoActivo({ id: p.id, accion: 'merma' })}>Merma</button>
                <button onClick={() => setProductoActivo({ id: p.id, accion: 'historial' })}>Historial</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {productoActivo?.accion === 'lote' && <LoteForm onGuardar={handleGuardarLote} onCancelar={() => setProductoActivo(null)} />}
      {productoActivo?.accion === 'ajuste' && <AjusteStockForm modo="ajuste" onGuardar={handleGuardarAjuste} onCancelar={() => setProductoActivo(null)} />}
      {productoActivo?.accion === 'merma' && <AjusteStockForm modo="merma" onGuardar={handleGuardarMerma} onCancelar={() => setProductoActivo(null)} />}
      {productoActivo?.accion === 'historial' && <HistorialInventario productoId={productoActivo.id} onCerrar={() => setProductoActivo(null)} />}
    </div>
  );
}