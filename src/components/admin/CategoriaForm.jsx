
import { useEffect, useState } from 'react';
import './AdminForms.css';

export default function CategoriaForm({
  categoriaEditando,
  categorias = [],
  onGuardar,
  onCancelar,
}) {
  const [form, setForm] = useState({
    nombre: '',
    orden: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    setError('');

    if (categoriaEditando) {
      setForm({
        nombre: categoriaEditando.nombre ?? '',
        orden: categoriaEditando.orden ?? '',
      });
    } else {
      const ordenes = categorias
        .map((cat) => Number(cat.orden))
        .filter((orden) => Number.isFinite(orden));

      const siguienteOrden =
        ordenes.length > 0 ? Math.max(...ordenes) + 1 : 1;

      setForm({
        nombre: '',
        orden: siguienteOrden,
      });
    }
  }, [categoriaEditando, categorias]);

  function actualizarCampo(campo, valor) {
    setError('');
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const nombreLimpio = form.nombre.trim();

    if (!nombreLimpio) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    const nombreNormalizado = nombreLimpio.toLowerCase();

    const nombreRepetido = categorias.some((cat) => {
      if (categoriaEditando && cat.id === categoriaEditando.id) {
        return false;
      }

      return cat.nombre?.trim().toLowerCase() === nombreNormalizado;
    });

    if (nombreRepetido) {
      setError('Ya existe una categoría con ese nombre.');
      return;
    }

    const ordenNumero = Number(form.orden);

    if (!Number.isInteger(ordenNumero) || ordenNumero < 1) {
      setError('El orden debe ser un número entero mayor o igual a 1.');
      return;
    }

    try {
      await onGuardar({
        nombre: nombreLimpio,
        orden: ordenNumero,
      });

      if (!categoriaEditando) {
        setForm({
          nombre: '',
          orden: categorias.length + 2,
        });
      }
    } catch (error) {
      console.error(error);
      setError('No se pudo guardar la categoría.');
    }
  }

  return (
    <form className="categoria-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => actualizarCampo('nombre', e.target.value)}
          placeholder="Ej. Ramos"
          required
        />
      </label>

      <label>
        Orden
        <input
          type="number"
          min="1"
          step="1"
          value={form.orden}
          onChange={(e) => actualizarCampo('orden', e.target.value)}
          required
        />
      </label>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <div className="form-acciones">
        <button type="submit">
          {categoriaEditando ? 'Guardar cambios' : 'Crear categoría'}
        </button>

        {categoriaEditando && (
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}


