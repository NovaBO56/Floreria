// Confirmar/rechazar pedidos desde el panel admin. Este es el ÚNICO lugar
// del sistema donde se descuenta stock y se crea una venta a partir de un
// pedido web. Consume lotes por FIFO para conservar el costo histórico
// real de cada venta (regla 12/13). Todo dentro de una transacción para
// evitar doble confirmación o inconsistencias entre pedido/venta/stock.

import {
  collection, doc, query, where, orderBy, onSnapshot,
  runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { planificarConsumoFIFO, aplicarConsumoFIFO, registrarMovimiento } from './movimientoInventarioService';

export function subscribeToPedidosPendientes(callback) {
  const q = query(
    collection(db, 'pedidos'),
    where('estado', '==', 'pendiente'),
    orderBy('creadoEn', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

export async function confirmarPedido(pedidoId, adminUid) {
  const ventaRef = doc(collection(db, 'ventas'));
  let planesParaHistorial = [];

  await runTransaction(db, async (transaction) => {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) throw new Error('Pedido no encontrado');
    const pedido = pedidoSnap.data();

    // Evita que el mismo pedido genere dos ventas por doble clic
    // o confirmaciones simultáneas.
    if (pedido.estado !== 'pendiente') {
      throw new Error('Este pedido ya fue procesado anteriormente');
    }

    const productoRefs = pedido.items.map((item) => doc(db, 'productos', item.productoId));
    const productoSnaps = await Promise.all(productoRefs.map((ref) => transaction.get(ref)));

    productoSnaps.forEach((snap, i) => {
      const item = pedido.items[i];
      if (!snap.exists()) throw new Error(`El producto "${item.nombre}" ya no existe`);
      if ((snap.data().stock ?? 0) < item.cantidad) throw new Error(`Stock insuficiente para "${item.nombre}"`);
    });

    // Planifica el consumo FIFO de TODOS los items antes de escribir nada
    // (Firestore exige leer antes de escribir dentro de una transacción).
    const planes = [];
    for (let i = 0; i < pedido.items.length; i++) {
      planes.push(await planificarConsumoFIFO(transaction, pedido.items[i].productoId, pedido.items[i].cantidad));
    }

    productoSnaps.forEach((snap, i) => {
      transaction.update(productoRefs[i], { stock: snap.data().stock - pedido.items[i].cantidad });
    });
    planes.forEach((plan) => aplicarConsumoFIFO(transaction, plan));

    const itemsConCosto = pedido.items.map((item, i) => ({ ...item, costoUnitario: planes[i].costoPromedio }));

    transaction.set(ventaRef, {
      pedidoId,
      items: itemsConCosto,
      subtotal: pedido.subtotal,
      total: pedido.total,
      cliente: pedido.cliente,
      canal: 'WEB',
      metodoPago: null,
      confirmadoPor: adminUid,
      creadoEn: serverTimestamp(),
    });

    transaction.update(pedidoRef, {
      estado: 'confirmado',
      ventaId: ventaRef.id,
      confirmadoPor: adminUid,
      confirmadoEn: serverTimestamp(),
    });

    planesParaHistorial = planes.map((plan, i) => ({ productoId: pedido.items[i].productoId, plan }));
  });

  await Promise.all(
    planesParaHistorial.map(({ productoId, plan }) =>
      registrarMovimiento({
        productoId,
        tipo: 'venta',
        cantidad: plan.cantidadRequerida,
        costoUnitario: plan.costoPromedio,
        motivo: 'Venta por pedido web',
        realizadoPor: adminUid,
      })
    )
  );

  return ventaRef.id;
}

export async function rechazarPedido(pedidoId, adminUid, motivo = '') {
  const pedidoRef = doc(db, 'pedidos', pedidoId);

  await runTransaction(db, async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists()) throw new Error('Pedido no encontrado');
    if (pedidoSnap.data().estado !== 'pendiente') {
      throw new Error('Este pedido ya fue procesado anteriormente');
    }
    transaction.update(pedidoRef, {
      estado: 'rechazado', rechazadoPor: adminUid, rechazadoEn: serverTimestamp(), motivoRechazo: motivo,
    });
  });
}