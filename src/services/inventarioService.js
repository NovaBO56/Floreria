import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Vista de inventario para el panel admin: TODOS los productos con su stock,
// sin importar si están activos en el catálogo público.
export function subscribeToInventario(callback) {
  const q = query(collection(db, 'productos'), orderBy('nombre'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

// Filtro exclusivo del panel admin — no confundir con filtro de
// categorías/buscador del catálogo público (punto 11 del documento).
export function filtrarPorDisponibilidad(productos, filtro) {
  if (filtro === 'disponibles') return productos.filter((p) => (p.stock ?? 0) > 0);
  if (filtro === 'agotados') return productos.filter((p) => (p.stock ?? 0) <= 0);
  return productos;
}