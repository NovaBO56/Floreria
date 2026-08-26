import { useEffect, useState } from 'react';
import CategoriaForm from '../../components/admin/CategoriaForm';
import {
  subscribeToTodasCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  cambiarVisibilidadCatalogo,
} from '../../services/categoriaService';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    return subscribeToTodasCategorias(setCategorias);
  }, []);

  async function handleGuardar(datos) {
    if (editando) {
      await actualizarCategoria(editando.id, datos);
      setEditando(null);
    } else {
      await crearCategoria(datos);
    }
  }

  return (
    <div className="admin-categorias">
      <h1>Categorías</h1>

      <CategoriaForm
        categoriaEditando={editando}
        onGuardar={handleGuardar}
        onCancelar={() => setEditando(null)}
      />

      <table className="admin-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Orden</th>
            <th>Activa</th>
            <th>Visible en catálogo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.nombre}</td>
              <td>{cat.orden}</td>
              <td>
                <input
                  type="checkbox"
                  checked={cat.activo}
                  onChange={(e) => cambiarEstadoCategoria(cat.id, e.target.checked)}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={cat.visibleEnCatalogo}
                  onChange={(e) => cambiarVisibilidadCatalogo(cat.id, e.target.checked)}
                />
              </td>
              <td>
                <button onClick={() => setEditando(cat)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}