import { useEffect, useState } from 'react';
import EntradaMercaderiaForm from '../../components/admin/EntradaMercaderiaForm';
import AjusteStockForm from '../../components/admin/AjusteStockForm';
import HistorialInventario from '../../components/admin/HistorialInventario';
import { subscribeToInventario, filtrarPorDisponibilidad } from '../../services/inventarioService';
import { registrarEntradaMercaderia, registrarAjusteStock, registrarMerma } from '../../services/loteService';
import { useAuth } from '../../context/AuthContext';
import './AdminInventario.css';

export default function AdminInventario() {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [accion, setAccion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => subscribeToInventario(setProductos), []);

  const productosFiltrados = filtrarPorDisponibilidad(productos, filtro);

  async function handleGuardarEntrada(entradas) {
    if (guardando) return;
    setGuardando(true);
    setError('');

    try {
      await registrarEntradaMercaderia({
        entradas,
        realizadoPor: currentUser.uid,
      });
      setAccion(null);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo registrar la entrada de mercadería.');
      throw err;
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarAjuste(datos) {
    if (guardando) return;
    setGuardando(true);
    try {
      await registrarAjusteStock({
        ...datos,
        productoId: accion.productoId,
        realizadoPor: currentUser.uid,
      });
      setAccion(null);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo realizar el ajuste.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarMerma(datos) {
    if (guardando) return;
    setGuardando(true);
    try {
      await registrarMerma({
        productoId: accion.productoId,
        cantidad: Math.abs(Number(datos.cantidad)),
        motivo: datos.motivo,
        realizadoPor: currentUser.uid,
      });
      setAccion(null);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo registrar la merma.');
    } finally {
      setGuardando(false);
    }
  }

  function cerrarAccion() {
    if (!guardando) {
      setAccion(null);
      setError('');
    }
  }

  return (
    <div className="admin-inventario">
      <h1>Inventario</h1>

      <div className="inventario-filtros">
        <button className={filtro === 'todos' ? 'activo' : ''} onClick={() => setFiltro('todos')}>Todos</button>
        <button className={filtro === 'disponibles' ? 'activo' : ''} onClick={() => setFiltro('disponibles')}>Disponibles</button>
        <button className={filtro === 'agotados' ? 'activo' : ''} onClick={() => setFiltro('agotados')}>Agotados</button>
      </div>

      <button
        className="btn-nueva-entrada"
        onClick={() => {
          setError('');
          setAccion({ tipo: 'entrada' });
        }}
      >
        + Nueva entrada de mercadería
      </button>

      {error && accion?.tipo !== 'entrada' && <div className="form-error">{error}</div>}

      <table className="admin-tabla">
        <thead>
          <tr><th>Producto</th><th>Stock</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.stock ?? 0}</td>
              <td className="inventario-acciones">
                <button onClick={() => { setError(''); setAccion({ tipo: 'ajuste', productoId: p.id }); }}>Ajustar</button>
                <button onClick={() => { setError(''); setAccion({ tipo: 'merma', productoId: p.id }); }}>Merma</button>
                <button onClick={() => { setError(''); setAccion({ tipo: 'historial', productoId: p.id }); }}>Historial</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {accion?.tipo === 'entrada' && (
        <EntradaMercaderiaForm
          productos={productos}
          onGuardar={handleGuardarEntrada}
          onCancelar={cerrarAccion}
        />
      )}

      {accion?.tipo === 'ajuste' && (
        <AjusteStockForm
          modo="ajuste"
          onGuardar={handleGuardarAjuste}
          onCancelar={cerrarAccion}
        />
      )}

      {accion?.tipo === 'merma' && (
        <AjusteStockForm
          modo="merma"
          onGuardar={handleGuardarMerma}
          onCancelar={cerrarAccion}
        />
      )}

      {accion?.tipo === 'historial' && (
        <HistorialInventario
          productoId={accion.productoId}
          onCerrar={cerrarAccion}
        />
      )}
    </div>
  );
}
