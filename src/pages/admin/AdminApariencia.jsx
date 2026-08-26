import './AdminApariencia.css';
import { useEffect, useState } from 'react';
import { subscribeToApariencia, guardarApariencia } from '../../services/configuracionService';

export default function AdminApariencia() {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => subscribeToApariencia((datos) => setForm(datos ?? {
    nombreNegocio: '', logoUrl: '', bannerUrl: '', animacionesActivas: true,
  })), []);

  if (!form) return <p>Cargando...</p>;

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardarApariencia(form);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="admin-apariencia" onSubmit={handleSubmit}>
      <h1>Apariencia</h1>

      <label>Nombre del negocio<input value={form.nombreNegocio} onChange={(e) => actualizarCampo('nombreNegocio', e.target.value)} /></label>
      <label>URL del logo<input value={form.logoUrl} onChange={(e) => actualizarCampo('logoUrl', e.target.value)} /></label>
      <label>URL del banner principal<input value={form.bannerUrl} onChange={(e) => actualizarCampo('bannerUrl', e.target.value)} /></label>

      <label className="checkbox-inline">
        <input type="checkbox" checked={form.animacionesActivas} onChange={(e) => actualizarCampo('animacionesActivas', e.target.checked)} />
        Animaciones activadas
      </label>

      <button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
    </form>
  );
}
