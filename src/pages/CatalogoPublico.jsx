import { useEffect, useMemo, useState } from 'react';
import Header from '../components/catalogo/Header';
import BannerPrincipal from '../components/catalogo/BannerPrincipal';
import CategoriasNav from '../components/catalogo/CategoriasNav';
import ProductosGrid from '../components/catalogo/ProductosGrid';
import Beneficios from '../components/catalogo/Beneficios';
import Personalizacion from '../components/catalogo/Personalizacion';
import Footer from '../components/catalogo/Footer';
import CarritoDrawer from '../components/carrito/CarritoDrawer';
import DatosPedidoForm from './DatosPedidoForm';
import { subscribeToCategoriasActivas } from '../services/categoriaService';
import { subscribeToProductosActivos } from '../services/productoService';
import { useCart } from '../context/CartContext';
import { useAppearance } from '../context/AppearanceContext';
import './CatalogoPublico.css';
import './Checkout.css';

export default function CatalogoPublico() {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // Controla el paso del flujo de compra: catálogo -> datos del pedido -> confirmación.
  const [pasoCompra, setPasoCompra] = useState('catalogo');
  const [numeroPedidoConfirmado, setNumeroPedidoConfirmado] = useState(null);

  const { addItem, cantidadTotal, abrirCarrito, cerrarCarrito } = useCart();
  const { bannerUrl } = useAppearance();

  useEffect(() => {
    const unsubCategorias = subscribeToCategoriasActivas(setCategorias);
    const unsubProductos = subscribeToProductosActivos(setProductos);

    return () => {
      unsubCategorias();
      unsubProductos();
    };
  }, []);

  const productosDestacados = useMemo(
    () => productos.filter((p) => p.destacado),
    [productos]
  );

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return productos.filter((p) => {
      const coincideCategoria =
        !categoriaActiva || p.categoriaId === categoriaActiva;

      const coincideBusqueda =
        !termino ||
        p.nombre.toLowerCase().includes(termino) ||
        (p.descripcion ?? '').toLowerCase().includes(termino);

      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoriaActiva, busqueda]);

  function limpiarFiltros() {
    setBusqueda('');
    setCategoriaActiva(null);
  }

  function handleVerDetalle(producto) {
    // Modal de detalle pendiente de una fase posterior.
    console.log('Ver detalle', producto.id);
  }

  function handleProcederPedido() {
    cerrarCarrito();
    setPasoCompra('datos');
  }

  function handlePedidoEnviado(numero) {
    setNumeroPedidoConfirmado(numero);
    setPasoCompra('confirmacion');
  }

  function handleVolverAlCatalogo() {
    setPasoCompra('catalogo');
    setNumeroPedidoConfirmado(null);
  }

  // Paso 2: datos del pedido (después de "Continuar con el pedido" en el carrito)
  if (pasoCompra === 'datos') {
    return (
      <div className="catalogo-publico checkout-wrap">
        <Header
          cantidadCarrito={cantidadTotal}
          busqueda={busqueda}
          onBuscar={setBusqueda}
          onAbrirCarrito={abrirCarrito}
        />
        <div className="checkout-contenedor">
          <button className="btn-volver-catalogo" onClick={handleVolverAlCatalogo}>
            ← Volver al catálogo
          </button>
          <DatosPedidoForm onPedidoEnviado={handlePedidoEnviado} />
        </div>
        <CarritoDrawer onProcederPedido={handleProcederPedido} />
      </div>
    );
  }

  // Paso 3: confirmación después de enviar el pedido por WhatsApp
  if (pasoCompra === 'confirmacion') {
    return (
      <div className="catalogo-publico checkout-wrap">
        <Header
          cantidadCarrito={cantidadTotal}
          busqueda={busqueda}
          onBuscar={setBusqueda}
          onAbrirCarrito={abrirCarrito}
        />
        <div className="pedido-confirmado">
          <div className="pedido-confirmado-icono">✓</div>
          <h2>¡Pedido recibido!</h2>
          <p>Tu pedido <strong>#{numeroPedidoConfirmado}</strong> fue registrado correctamente.</p>
          <p>Nos pondremos en contacto contigo por WhatsApp para coordinar los detalles.</p>
          <button onClick={handleVolverAlCatalogo}>Seguir comprando</button>
        </div>
        <CarritoDrawer onProcederPedido={handleProcederPedido} />
      </div>
    );
  }

  // Paso 1: catálogo normal
  return (
    <div className="catalogo-publico">
      <Header
        cantidadCarrito={cantidadTotal}
        busqueda={busqueda}
        onBuscar={setBusqueda}
        onAbrirCarrito={abrirCarrito}
      />

      <BannerPrincipal
        imagenUrl={bannerUrl}
        titulo="Flores que hablan por ti"
        subtitulo="Arreglos florales para momentos especiales"
      />

      <Beneficios />

      <CategoriasNav
        categorias={categorias}
        categoriaActiva={categoriaActiva}
        onSeleccionar={setCategoriaActiva}
      />

      {productosDestacados.length > 0 && !categoriaActiva && !busqueda && (
        <section className="seccion-destacados">
          <h2>Nuestras favoritas</h2>

          <ProductosGrid
            productos={productosDestacados}
            categorias={categorias}
            onVerDetalle={handleVerDetalle}
            onAgregarCarrito={addItem}
          />
        </section>
      )}

      <section id="catalogo" className="seccion-catalogo">
        <h2>Nuestros arreglos</h2>

        {productosFiltrados.length === 0 && (busqueda || categoriaActiva) ? (
          <div className="catalogo-sin-resultados">
            <p className="catalogo-sin-resultados-titulo">No encontramos productos</p>
            <p>Prueba con otro nombre o categoría.</p>
            <button type="button" onClick={limpiarFiltros}>Ver todos</button>
          </div>
        ) : (
          <ProductosGrid
            productos={productosFiltrados}
            categorias={categorias}
            onVerDetalle={handleVerDetalle}
            onAgregarCarrito={addItem}
          />
        )}
      </section>

      <Personalizacion />

      <CarritoDrawer onProcederPedido={handleProcederPedido} />

      <Footer />
    </div>
  );
}