import { useState } from 'react';
import './AdminForms.css';
export default function AjusteStockForm({ onGuardar, onCancelar, modo }) {
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onGuardar({ cantidad, motivo });
  }

  return (
    <form className="ajuste-form" onSubmit={handleSubmit}>
      <h3>{modo === 'merma' ? 'Registrar merma' : 'Ajustar stock'}</h3>
      <label>
        {modo === 'merma' ? 'Cantidad perdida' : 'Cantidad (+/-)'}
        <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
      </label>
      <label>
        Motivo
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
      </label>
      <div className="form-acciones">
        <button type="submit">Guardar</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}