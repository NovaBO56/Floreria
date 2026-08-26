import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';
export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Panel admin</h2>

        <nav>
          <NavLink to="/admin/pedidos">📋 Pedidos</NavLink>
          <NavLink to="/admin/productos">🌸 Productos</NavLink>
          <NavLink to="/admin/categorias">🗂 Categorías</NavLink>
          <NavLink to="/admin/inventario">📦 Inventario</NavLink>
          <NavLink to="/admin/ventas">💰 Ventas</NavLink>
          <NavLink to="/admin/caja">💵 Caja</NavLink>
          <NavLink to="/admin/reportes">📊 Reportes</NavLink>
          <NavLink to="/admin/apariencia">⚙️ Apariencia</NavLink>
        </nav>

        <button onClick={logout} className="btn-logout">
          Cerrar sesión
        </button>
      </aside>

      <main className="admin-contenido">
        <Outlet />
      </main>
    </div>
  );
}