import {
  collection, doc, query, where, orderBy, onSnapshot,
  runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { planificarConsumoFIFO, aplicarConsumoFIFO, registrarMovimiento } from './movimientoInventarioService';

export function subscribeToVentas(callback) {
  const q = query(collection(db, 'ventas'), orderBy('creadoEn', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

// Ventas en efectivo desde una fecha (usado por Caja para calcular el total esperado).
export function subscribeToVentasEfectivoDesde(fechaDesde, callback) {
  const q = query(
    collection(db, 'ventas'),
    where('metodoPago', '==', 'efectivo'),
    where('creadoEn', '>=', fechaDesde),
    orderBy('creadoEn', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

// Venta que no vino del catálogo web (tienda física, WhatsApp, Instagram,
// teléfono, otro). Usa el mismo historial que las ventas web (regla 10).
export async function registrarVentaManual({ cliente, items, descuento, metodoPago, observacion, origen, realizadoPor }) {
  const ventaRef = doc(collection(db, 'ventas'));
  let planesParaHistorial = [];

  await runTransaction(db, async (transaction) => {
    const productoRefs = items.map((item) => doc(db, 'productos', item.productoId));
    const productoSnaps = await Promise.all(productoRefs.map((ref) => transaction.get(ref)));

    productoSnaps.forEach((snap, i) => {
      const item = items[i];
      if (!snap.exists()) throw new Error(`El producto "${item.nombre}" no existe`);
      if ((snap.data().stock ?? 0) < item.cantidad) throw new Error(`Stock insuficiente para "${item.nombre}"`);
    });

    const planes = [];
    for (let i = 0; i < items.length; i++) {
      planes.push(await planificarConsumoFIFO(transaction, items[i].productoId, items[i].cantidad));
    }

    productoSnaps.forEach((snap, i) => {
      transaction.update(productoRefs[i], { stock: snap.data().stock - items[i].cantidad });
    });
    planes.forEach((plan) => aplicarConsumoFIFO(transaction, plan));

    const subtotal = items.reduce((s, item) => s + item.precio * item.cantidad, 0);
    const total = subtotal - Number(descuento ?? 0);
    const itemsConCosto = items.map((item, i) => ({ ...item, costoUnitario: planes[i].costoPromedio }));

    transaction.set(ventaRef, {
      pedidoId: null,
      items: itemsConCosto,
      subtotal,
      descuento: Number(descuento ?? 0),
      total,
      cliente: cliente ?? null,
      canal: origen,
      metodoPago,
      observacion: observacion ?? '',
      confirmadoPor: realizadoPor,
      creadoEn: serverTimestamp(),
    });

    planesParaHistorial = planes.map((plan, i) => ({ productoId: items[i].productoId, plan }));
  });

  await Promise.all(
    planesParaHistorial.map(({ productoId, plan }) =>
      registrarMovimiento({
        productoId, tipo: 'venta', cantidad: plan.cantidadRequerida, costoUnitario: plan.costoPromedio,
        motivo: `Venta manual — origen: ${origen}`, realizadoPor,
      })
    )
  );

  return ventaRef.id;
}