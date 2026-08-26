
import { useEffect, useState } from 'react';
import CategoriaForm from '../../components/admin/CategoriaForm';

import {
  subscribeToTodasCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  cambiarVisibilidadCatalogo,
  eliminarCategoria,
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

  async function handleEliminar(categoria) {
    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      await eliminarCategoria(categoria.id);
    } catch (error) {
      console.error(error);

      if (error.code === 'CATALOGO_CON_PRODUCTOS') {
        alert(
          `No se puede eliminar "${categoria.nombre}" porque tiene productos asociados.`
        );
        return;
      }

      alert('No se pudo eliminar la categoría.');
    }
  }

  return (
    <div className="admin-categorias">
      <h1>Categorías</h1>

      <CategoriaForm
        categoriaEditando={editando}
        categorias={categorias}
        onGuardar={handleGuardar}
        onCancelar={() => setEditando(null)}
      />

      <div className="admin-tabla-contenedor">
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
                    onChange={(e) =>
                      cambiarEstadoCategoria(
                        cat.id,
                        e.target.checked
                      )
                    }
                  />
                </td>

                <td>
                  <input
                    type="checkbox"
                    checked={cat.visibleEnCatalogo}
                    onChange={(e) =>
                      cambiarVisibilidadCatalogo(
                        cat.id,
                        e.target.checked
                      )
                    }
                  />
                </td>

                <td>
                  <div className="tabla-acciones">
                    <button
                      type="button"
                      onClick={() => setEditando(cat)}
                    >
                      ✏️ Editar
                    </button>

                    <button
                      type="button"
                      className="btn-eliminar"
                      onClick={() => handleEliminar(cat)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {categorias.length === 0 && (
              <tr>
                <td colSpan="5">
                  No hay categorías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

