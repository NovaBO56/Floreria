import './CategoriasNav.css';

// Paleta suave para las tarjetas de categoría cuando no hay imagen propia
// (el modelo de datos actual de categorías no guarda imagenUrl).
const DEGRADADOS = [
  'linear-gradient(135deg, #f8d7e3, #f6a8c4)',
  'linear-gradient(135deg, #fde2e4, #f5b5bd)',
  'linear-gradient(135deg, #ffe5ec, #ffb3c6)',
  'linear-gradient(135deg, #f3d9e8, #e8a7c9)',
];

export default function CategoriasNav({ categorias, categoriaActiva, onSeleccionar }) {
  return (
    <section id="categorias" className="categorias-seccion">
      <h2>Categorías</h2>

      <div className="categorias-nav">
        <button
          className={`categoria-card ${categoriaActiva === null ? 'activa' : ''}`}
          style={{ background: 'linear-gradient(135deg, #f1f3f5, #dee2e6)' }}
          onClick={() => onSeleccionar(null)}
        >
          <span className="categoria-icono">🌷</span>
          <span>Todos</span>
        </button>

        {categorias.map((cat, i) => (
          <button
            key={cat.id}
            className={`categoria-card ${categoriaActiva === cat.id ? 'activa' : ''}`}
            style={{ background: DEGRADADOS[i % DEGRADADOS.length] }}
            onClick={() => onSeleccionar(cat.id)}
          >
            <span className="categoria-icono">🌸</span>
            <span>{cat.nombre}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
