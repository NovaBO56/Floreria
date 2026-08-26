
// Acceso a Firestore para categorías.
// Los componentes no consultan Firestore directamente,
// siempre pasan por este servicio.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
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

// ============================================================
// CREAR
// ============================================================

export async function crearCategoria({ nombre, orden }) {
  const nombreLimpio = nombre.trim();

  const categoriasRef = collection(db, 'categorias');

  const q = query(
    categoriasRef,
    where('nombreNormalizado', '==', nombreLimpio.toLowerCase())
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const error = new Error(
      'Ya existe una categoría con ese nombre.'
    );

    error.code = 'CATEGORIA_DUPLICADA';

    throw error;
  }

  return addDoc(categoriasRef, {
    nombre: nombreLimpio,
    nombreNormalizado: nombreLimpio.toLowerCase(),
    orden: Number(orden) || 999,
    activo: true,
    visibleEnCatalogo: true,
  });
}

// ============================================================
// ACTUALIZAR
// ============================================================

export async function actualizarCategoria(id, datos) {
  const nombreLimpio = datos.nombre.trim();

  const categoriasRef = collection(db, 'categorias');

  const q = query(
    categoriasRef,
    where('nombreNormalizado', '==', nombreLimpio.toLowerCase())
  );

  const snapshot = await getDocs(q);

  const existeOtra = snapshot.docs.some(
    (categoria) => categoria.id !== id
  );

  if (existeOtra) {
    const error = new Error(
      'Ya existe una categoría con ese nombre.'
    );

    error.code = 'CATEGORIA_DUPLICADA';

    throw error;
  }

  return updateDoc(
    doc(db, 'categorias', id),
    {
      nombre: nombreLimpio,
      nombreNormalizado: nombreLimpio.toLowerCase(),
      orden: Number(datos.orden) || 999,
    }
  );
}

// ============================================================
// ACTIVAR / DESACTIVAR
// ============================================================

export async function cambiarEstadoCategoria(id, activo) {
  return updateDoc(
    doc(db, 'categorias', id),
    { activo }
  );
}

// ============================================================
// MOSTRAR / OCULTAR EN CATÁLOGO
// ============================================================

export async function cambiarVisibilidadCatalogo(
  id,
  visibleEnCatalogo
) {
  return updateDoc(
    doc(db, 'categorias', id),
    { visibleEnCatalogo }
  );
}

// ============================================================
// CAMBIAR ORDEN
// ============================================================

export async function actualizarOrden(id, orden) {
  return updateDoc(
    doc(db, 'categorias', id),
    {
      orden: Number(orden),
    }
  );
}

// ============================================================
// ELIMINAR
// ============================================================

export async function eliminarCategoria(id) {
  /*
   * Antes de eliminar la categoría comprobamos si existen
   * productos asociados a ella.
   */

  const productosRef = collection(db, 'productos');

  const q = query(
    productosRef,
    where('categoriaId', '==', id)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const error = new Error(
      'No se puede eliminar una categoría que tiene productos asociados.'
    );

    error.code = 'CATALOGO_CON_PRODUCTOS';

    throw error;
  }

  return deleteDoc(
    doc(db, 'categorias', id)
  );
}

