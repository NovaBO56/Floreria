import { useState, useEffect } from 'react';
import './AdminForms.css';
export default function ProductoForm({ productoEditando, categorias, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', precio: '', categoriaId: '',
    imagenUrl: '', destacado: false, promocion: false, stock: '',
  });

  useEffect(() => {
    if (productoEditando) {
      setForm({
        nombre: productoEditando.nombre,
        descripcion: productoEditando.descripcion,
        precio: productoEditando.precio,
        categoriaId: productoEditando.categoriaId,
        imagenUrl: productoEditando.imagenUrl,
        destacado: productoEditando.destacado,
        promocion: productoEditando.promocion,
        stock: productoEditando.stock,
      });
    } else {
      setForm({
        nombre: '', descripcion: '', precio: '', categoriaId: categorias[0]?.id ?? '',
        imagenUrl: '', destacado: false, promocion: false, stock: '',
      });
    }
  }, [productoEditando, categorias]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar(form);
  }

  return (
    <form className="producto-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input value={form.nombre} onChange={(e) => actualizarCampo('nombre', e.target.value)} required />
      </label>

      <label>
        Descripción
        <textarea value={form.descripcion} onChange={(e) => actualizarCampo('descripcion', e.target.value)} />
      </label>

      <label>
        Precio (Bs)
        <input type="number" step="0.01" value={form.precio} onChange={(e) => actualizarCampo('precio', e.target.value)} required />
      </label>

      <label>
        Categoría
        <select value={form.categoriaId} onChange={(e) => actualizarCampo('categoriaId', e.target.value)} required>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>
      </label>

      <label>
        URL de imagen
        <input value={form.imagenUrl} onChange={(e) => actualizarCampo('imagenUrl', e.target.value)} />
      </label>

      <label>
        Stock
        <input type="number" value={form.stock} onChange={(e) => actualizarCampo('stock', e.target.value)} required />
      </label>

      <label className="checkbox-inline">
        <input type="checkbox" checked={form.destacado} onChange={(e) => actualizarCampo('destacado', e.target.checked)} />
        Destacado
      </label>

      <label className="checkbox-inline">
        <input type="checkbox" checked={form.promocion} onChange={(e) => actualizarCampo('promocion', e.target.checked)} />
        Promoción
      </label>

      <div className="form-acciones">
        <button type="submit">{productoEditando ? 'Guardar cambios' : 'Crear producto'}</button>
        {productoEditando && <button type="button" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  );
}