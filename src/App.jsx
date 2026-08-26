import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppearanceProvider } from './context/AppearanceContext';

import CatalogoPublico from './pages/CatalogoPublico';
import AdminLogin from './pages/AdminLogin';

import AdminLayout from './components/admin/AdminLayout';
import AdminPedidos from './pages/admin/AdminPedidos';
import AdminProductos from './pages/admin/AdminProductos';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminInventario from './pages/admin/AdminInventario';
import AdminVentas from './pages/admin/AdminVentas';
import AdminCaja from './pages/admin/AdminCaja';
import AdminReportes from './pages/admin/AdminReportes';
import AdminApariencia from './pages/admin/AdminApariencia';

function RutaProtegida({ children }) {
  const { currentUser, isAdmin } = useAuth();
  const location = useLocation();

  if (!currentUser || !isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>

      {/* CATÁLOGO PÚBLICO */}
      <Route
        path="/"
        element={<CatalogoPublico />}
      />

      {/* LOGIN ADMIN */}
      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      {/* PANEL ADMINISTRATIVO PROTEGIDO */}
      <Route
        path="/admin"
        element={
          <RutaProtegida>
            <AdminLayout />
          </RutaProtegida>
        }
      >
        <Route
          index
          element={<Navigate to="pedidos" replace />}
        />

        <Route
          path="pedidos"
          element={<AdminPedidos />}
        />

        <Route
          path="productos"
          element={<AdminProductos />}
        />

        <Route
          path="categorias"
          element={<AdminCategorias />}
        />

        <Route
          path="inventario"
          element={<AdminInventario />}
        />

        <Route
          path="ventas"
          element={<AdminVentas />}
        />

        <Route
          path="caja"
          element={<AdminCaja />}
        />

        <Route
          path="reportes"
          element={<AdminReportes />}
        />

        <Route
          path="apariencia"
          element={<AdminApariencia />}
        />
      </Route>

    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppearanceProvider>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </AppearanceProvider>
    </HashRouter>
  );
}