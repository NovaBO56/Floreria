// Acceso a Firestore para categorías.
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

export function subscribeToCategoriasActivas(callback) {
  const q = query(
    collection(db, 'categorias'),
    where('activo', '==', true),
    where('visibleEnCatalogo', '==', true),
    orderBy('orden')
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

// ============================================================
// ADMINISTRACIÓN
// ============================================================

// Todas las categorías, activas e inactivas
export function subscribeToTodasCategorias(callback) {
  const q = query(
    collection(db, 'categorias'),
    orderBy('orden')
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

// Crear categoría
export async function crearCategoria({ nombre, orden }) {
  return addDoc(collection(db, 'categorias'), {
    nombre,
    orden: orden ?? 999,
    activo: true,
    visibleEnCatalogo: true,
  });
}

// Actualizar categoría
export async function actualizarCategoria(id, datos) {
  return updateDoc(
    doc(db, 'categorias', id),
    datos
  );
}

// Activar / desactivar categoría
export async function cambiarEstadoCategoria(id, activo) {
  return updateDoc(
    doc(db, 'categorias', id),
    { activo }
  );
}

// Mostrar / ocultar categoría en el catálogo
export async function cambiarVisibilidadCatalogo(
  id,
  visibleEnCatalogo
) {
  return updateDoc(
    doc(db, 'categorias', id),
    { visibleEnCatalogo }
  );
}

// Cambiar orden
export async function actualizarOrden(id, orden) {
  return updateDoc(
    doc(db, 'categorias', id),
    { orden }
  );
}