import { useState, useEffect } from 'react';
import './AdminForms.css';
export default function CategoriaForm({ categoriaEditando, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [orden, setOrden] = useState(0);

  useEffect(() => {
    if (categoriaEditando) {
      setNombre(categoriaEditando.nombre);
      setOrden(categoriaEditando.orden);
    } else {
      setNombre('');
      setOrden(0);
    }
  }, [categoriaEditando]);

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar({ nombre, orden: Number(orden) });
  }

  return (
    <form className="categoria-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </label>
      <label>
        Orden
        <input type="number" value={orden} onChange={(e) => setOrden(e.target.value)} />
      </label>
      <div className="form-acciones">
        <button type="submit">{categoriaEditando ? 'Guardar cambios' : 'Crear categoría'}</button>
        {categoriaEditando && <button type="button" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  );
}