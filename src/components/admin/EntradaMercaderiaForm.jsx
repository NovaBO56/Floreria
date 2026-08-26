import { useMemo, useState } from 'react';
import './AdminForms.css';

function crearLinea() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    productoId: '',
    cantidad: '',
    costoUnitario: '',
    proveedor: '',
  };
}

export default function EntradaMercaderiaForm({ productos, onGuardar, onCancelar }) {
  const [lineas, setLineas] = useState([crearLinea()]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const productosOrdenados = useMemo(
    () => [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [productos]
  );

  function cambiarLinea(id, campo, valor) {
    setError('');
    setLineas((actuales) =>
      actuales.map((linea) =>
        linea.id === id ? { ...linea, [campo]: valor } : linea
      )
    );
  }

  function agregarLinea() {
    setError('');
    setLineas((actuales) => [...actuales, crearLinea()]);
  }

  function eliminarLinea(id) {
    setError('');
    setLineas((actuales) => {
      if (actuales.length === 1) return [crearLinea()];
      return actuales.filter((linea) => linea.id !== id);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (guardando) return;

    const entradas = lineas.map(({ id, ...linea }) => ({
      productoId: linea.productoId,
      cantidad: Number(linea.cantidad),
      costoUnitario: Number(linea.costoUnitario),
      proveedor: linea.proveedor.trim(),
    }));

    if (entradas.some((linea) => !linea.productoId)) {
      setError('Selecciona un producto en todas las líneas.');
      return;
    }

    if (entradas.some((linea) => !Number.isFinite(linea.cantidad) || linea.cantidad <= 0)) {
      setError('Todas las cantidades deben ser mayores que 0.');
      return;
    }

    if (entradas.some((linea) => !Number.isFinite(linea.costoUnitario) || linea.costoUnitario < 0)) {
      setError('Todos los costos unitarios deben ser válidos.');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      await onGuardar(entradas);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'No se pudo registrar la entrada.');
      setGuardando(false);
    }
  }

  return (
    <form className="entrada-mercaderia-form" onSubmit={handleSubmit}>
      <div className="entrada-mercaderia-cabecera">
        <div>
          <h3>Nueva entrada de mercadería</h3>
          <p>Registra varios productos en una sola operación.</p>
        </div>
      </div>

      <div className="entrada-lineas">
        {lineas.map((linea, index) => (
          <div className="entrada-linea" key={linea.id}>
            <span className="entrada-linea-numero">{index + 1}</span>

            <label>
              Producto
              <select
                value={linea.productoId}
                onChange={(e) => cambiarLinea(linea.id, 'productoId', e.target.value)}
                disabled={guardando}
                required
              >
                <option value="">Seleccionar producto</option>
                {productosOrdenados.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Cantidad
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={linea.cantidad}
                onChange={(e) => cambiarLinea(linea.id, 'cantidad', e.target.value)}
                disabled={guardando}
                required
              />
            </label>

            <label>
              Costo unitario (Bs)
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={linea.costoUnitario}
                onChange={(e) => cambiarLinea(linea.id, 'costoUnitario', e.target.value)}
                disabled={guardando}
                required
              />
            </label>

            <label>
              Proveedor <span>(opcional)</span>
              <input
                type="text"
                value={linea.proveedor}
                onChange={(e) => cambiarLinea(linea.id, 'proveedor', e.target.value)}
                disabled={guardando}
              />
            </label>

            <button
              type="button"
              className="entrada-linea-eliminar"
              onClick={() => eliminarLinea(linea.id)}
              disabled={guardando}
              aria-label={`Eliminar línea ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="entrada-agregar-linea"
        onClick={agregarLinea}
        disabled={guardando}
      >
        + Agregar producto
      </button>

      {error && <div className="form-error">{error}</div>}

      <div className="form-acciones">
        <button type="submit" disabled={guardando}>
          {guardando ? 'Registrando...' : 'Registrar entrada'}
        </button>
        <button type="button" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
