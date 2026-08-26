import './Header.css';
import { useState } from 'react';
import { useAppearance } from '../../context/AppearanceContext';

// La app usa HashRouter (necesario para GitHub Pages). Un <a href="#id">
// normal haría que React Router intente navegar a esa "ruta" y muestre
// una página en blanco. Por eso interceptamos el click y hacemos scroll
// manual, sin tocar el historial/hash de la URL.
function irASeccion(e, id) {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Header({ busqueda, onBuscar, cantidadCarrito, onAbrirCarrito }) {
  const { nombreNegocio, logoUrl } = useAppearance();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  function handleNavClick(e, id) {
    irASeccion(e, id);
    cerrarMenu();
  }

  return (
    <header className="header-catalogo">
      <div className="header-fila-principal">
        <a href="#inicio" className="header-marca" onClick={(e) => handleNavClick(e, 'inicio')}>
          {logoUrl && <img src={logoUrl} alt={nombreNegocio} className="header-logo" />}
          <h1>{nombreNegocio}</h1>
        </a>

        <nav className="header-nav" aria-label="Navegación principal">
          <a href="#inicio" onClick={(e) => irASeccion(e, 'inicio')}>Inicio</a>
          <a href="#categorias" onClick={(e) => irASeccion(e, 'categorias')}>Categorías</a>
        </nav>

        <div className="header-buscador">
          <input
            type="text"
            placeholder="Buscar arreglos..."
            value={busqueda}
            onChange={(e) => onBuscar(e.target.value)}
            aria-label="Buscar productos"
          />
          {busqueda && (
            <button
              type="button"
              className="buscador-limpiar"
              onClick={() => onBuscar('')}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        <div className="header-acciones">
          <button
            className="header-carrito"
            onClick={onAbrirCarrito}
            aria-label="Abrir carrito"
          >
            🛒
            {cantidadCarrito > 0 && <span className="carrito-badge">{cantidadCarrito}</span>}
          </button>

          <button
            className="header-menu-toggle"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Segunda fila del buscador en móvil/tablet — mismo estado, sin duplicar */}
      <div className="header-buscador header-buscador-movil">
        <input
          type="text"
          placeholder="Buscar arreglos..."
          value={busqueda}
          onChange={(e) => onBuscar(e.target.value)}
          aria-label="Buscar productos"
        />
        {busqueda && (
          <button
            type="button"
            className="buscador-limpiar"
            onClick={() => onBuscar('')}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {menuAbierto && (
        <nav className="header-nav-movil" aria-label="Navegación móvil">
          <a href="#inicio" onClick={(e) => handleNavClick(e, 'inicio')}>Inicio</a>
          <a href="#categorias" onClick={(e) => handleNavClick(e, 'categorias')}>Categorías</a>
        </nav>
      )}
    </header>
  );
}