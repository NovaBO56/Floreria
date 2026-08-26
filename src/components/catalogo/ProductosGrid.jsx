import ProductoCard from './ProductoCard';
import './ProductosGrid.css';
export default function ProductosGrid({ productos, categorias, onVerDetalle, onAgregarCarrito }) {
  function nombreCategoria(categoriaId) {
    return categorias.find((c) => c.id === categoriaId)?.nombre ?? '';
  }

  if (productos.length === 0) {
    return <p className="sin-resultados">No se encontraron arreglos.</p>;
  }

  return (
    <div className="productos-grid">
      {productos.map((producto) => (
        <ProductoCard
          key={producto.id}
          producto={producto}
          categoriaNombre={nombreCategoria(producto.categoriaId)}
          onVerDetalle={onVerDetalle}
          onAgregarCarrito={onAgregarCarrito}
        />
      ))}
    </div>
  );
}