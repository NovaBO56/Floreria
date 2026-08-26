// Servicio del lado del CLIENTE (catálogo público).
// Crea el pedido como "pendiente" y valida disponibilidad antes de enviarlo.
// IMPORTANTE: este servicio nunca descuenta stock ni crea una venta.
// Eso solo ocurre en pedidoAdminService.js cuando el admin confirma el pedido.

import {
  collection,
  addDoc,
  doc,
  runTransaction,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Genera un número de pedido correlativo usando un contador transaccional,
// para evitar colisiones si dos clientes piden al mismo tiempo.
async function generarNumeroPedido() {
  const contadorRef = doc(db, 'contadores', 'pedidos');

  return runTransaction(db, async (transaction) => {
    const contadorDoc = await transaction.get(contadorRef);
    const siguiente = contadorDoc.exists() ? contadorDoc.data().valor + 1 : 1001;
    transaction.set(contadorRef, { valor: siguiente });
    return siguiente;
  });
}

// Antes de crear el pedido, vuelve a verificar en Firestore que los
// productos sigan activos y con stock suficiente.
export async function validarDisponibilidad(items) {
  const problemas = [];

  for (const item of items) {
    const productoSnap = await getDoc(doc(db, 'productos', item.productoId));

    if (!productoSnap.exists() || !productoSnap.data().activo) {
      problemas.push({ productoId: item.productoId, motivo: 'ya no disponible' });
      continue;
    }

    const stockActual = productoSnap.data().stock ?? 0;
    if (stockActual < item.cantidad) {
      problemas.push({ productoId: item.productoId, motivo: 'stock insuficiente' });
    }
  }

  return problemas;
}

export async function crearPedido({ items, subtotal, total, cliente, modalidad, fechaHora, entrega, dedicatoria }) {
  const numero = await generarNumeroPedido();

  const pedido = {
    numero,
    estado: 'pendiente',
    items,
    subtotal,
    total,
    cliente,
    modalidad,
    fechaHora: fechaHora ?? null,
    entrega: modalidad === 'entrega' ? entrega : null,
    dedicatoria: dedicatoria ?? '',
    creadoEn: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'pedidos'), pedido);

  return { id: docRef.id, numero };
}