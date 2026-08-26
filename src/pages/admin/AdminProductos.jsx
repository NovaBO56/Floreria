import { useEffect, useState } from 'react';
import ProductoForm from '../../components/admin/ProductoForm';
import { subscribeToTodasCategorias } from '../../services/categoriaService';
import {
  subscribeToTodosProductos,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
} from '../../services/productoService';

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    const unsubProductos = subscribeToTodosProductos(setProductos);
    const unsubCategorias = subscribeToTodasCategorias(setCategorias);
    return () => {
      unsubProductos();
      unsubCategorias();
    };
  }, []);

  function nombreCategoria(id) {
    return categorias.find((c) => c.id === id)?.nombre ?? '—';
  }

  async function handleGuardar(datos) {
    if (editando) {
      await actualizarProducto(editando.id, datos);
      setEditando(null);
    } else {
      await crearProducto(datos);
    }
  }

  return (
    <div className="admin-productos">
      <h1>Productos</h1>

      <ProductoForm
        productoEditando={editando}
        categorias={categorias}
        onGuardar={handleGuardar}
        onCancelar={() => setEditando(null)}
      />

      <table className="admin-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{nombreCategoria(p.categoriaId)}</td>
              <td>Bs {p.precio.toFixed(2)}</td>
              <td>{p.stock}</td>
              <td>
                <input
                  type="checkbox"
                  checked={p.activo}
                  onChange={(e) => cambiarEstadoProducto(p.id, e.target.checked)}
                />
              </td>
              <td>
                <button onClick={() => setEditando(p)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}