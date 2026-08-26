// Acceso a Firestore para productos.
// Los componentes no consultan Firestore directamente,
// siempre pasan por este servicio.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/config';

// ============================================================
// CATÁLOGO PÚBLICO
// ============================================================

// Escucha en tiempo real todos los productos activos del catálogo.
export function subscribeToProductosActivos(callback) {
  const q = query(
    collection(db, 'productos'),
    where('activo', '==', true),
    orderBy('nombre')
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
}

// Un producto tiene stock disponible si stock > 0.
export function tieneStock(producto) {
  return (
    typeof producto.stock === 'number' &&
    producto.stock > 0
  );
}

// ============================================================
// ADMINISTRACIÓN
// ============================================================

// Trae TODOS los productos, activos e inactivos.
export function subscribeToTodosProductos(callback) {
  const q = query(
    collection(db, 'productos'),
    orderBy('nombre')
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
}

// Crear producto
export async function crearProducto(datos) {
  return addDoc(collection(db, 'productos'), {
    nombre: datos.nombre,
    descripcion: datos.descripcion ?? '',
    precio: Number(datos.precio),
    categoriaId: datos.categoriaId,
    imagenUrl: datos.imagenUrl ?? '',
    destacado: !!datos.destacado,
    promocion: !!datos.promocion,
    activo: true,
    stock: Number(datos.stock ?? 0),
  });
}

// Actualizar producto
export async function actualizarProducto(id, datos) {
  const payload = { ...datos };

  if (payload.precio !== undefined) {
    payload.precio = Number(payload.precio);
  }

  if (payload.stock !== undefined) {
    payload.stock = Number(payload.stock);
  }

  return updateDoc(
    doc(db, 'productos', id),
    payload
  );
}

// Activar / desactivar producto
export async function cambiarEstadoProducto(id, activo) {
  return updateDoc(
    doc(db, 'productos', id),
    { activo }
  );
}