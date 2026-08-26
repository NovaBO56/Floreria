import { useState } from 'react';
import './AdminForms.css';
export default function LoteForm({ onGuardar, onCancelar }) {
  const [cantidad, setCantidad] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [proveedor, setProveedor] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar({ cantidad, costoUnitario, proveedor });
  }

  return (
    <form className="lote-form" onSubmit={handleSubmit}>
      <h3>Registrar entrada de lote</h3>
      <label>
        Cantidad
        <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
      </label>
      <label>
        Costo unitario (Bs)
        <input type="number" step="0.01" value={costoUnitario} onChange={(e) => setCostoUnitario(e.target.value)} required />
      </label>
      <label>
        Proveedor (opcional)
        <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} />
      </label>
      <div className="form-acciones">
        <button type="submit">Registrar entrada</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}