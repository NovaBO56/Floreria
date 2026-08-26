import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { registrarMovimiento, planificarConsumoFIFO, aplicarConsumoFIFO } from './movimientoInventarioService';

// Un nuevo lote = una entrada de inventario. Aumenta el stock del producto.
// Nunca sobrescribe el costo de lotes anteriores (regla 12) — cada lote
// guarda su propio costoUnitario para siempre.
export async function registrarEntradaLote({ productoId, cantidad, costoUnitario, proveedor, realizadoPor }) {
  const loteRef = doc(collection(db, 'lotes'));
  const productoRef = doc(db, 'productos', productoId);

  await runTransaction(db, async (transaction) => {
    const productoSnap = await transaction.get(productoRef);
    if (!productoSnap.exists()) throw new Error('Producto no encontrado');
    const stockActual = productoSnap.data().stock ?? 0;

    transaction.set(loteRef, {
      productoId,
      cantidadInicial: Number(cantidad),
      cantidadDisponible: Number(cantidad),
      costoUnitario: Number(costoUnitario),
      proveedor: proveedor ?? '',
      fechaIngreso: serverTimestamp(),
      registradoPor: realizadoPor,
    });

    transaction.update(productoRef, { stock: stockActual + Number(cantidad) });
  });

  await registrarMovimiento({
    productoId,
    tipo: 'entrada',
    cantidad: Number(cantidad),
    loteId: loteRef.id,
    costoUnitario: Number(costoUnitario),
    motivo: `Entrada de lote${proveedor ? ` — proveedor: ${proveedor}` : ''}`,
    realizadoPor,
  });

  return loteRef.id;
}

// Ajuste manual de stock (conteo físico, corrección). No mueve lotes,
// solo corrige el total. Positivo o negativo.
export async function registrarAjusteStock({ productoId, cantidad, motivo, realizadoPor }) {
  const productoRef = doc(db, 'productos', productoId);

  await runTransaction(db, async (transaction) => {
    const productoSnap = await transaction.get(productoRef);
    if (!productoSnap.exists()) throw new Error('Producto no encontrado');
    const stockActual = productoSnap.data().stock ?? 0;
    const nuevoStock = stockActual + Number(cantidad);
    if (nuevoStock < 0) throw new Error('El ajuste dejaría el stock en negativo');
    transaction.update(productoRef, { stock: nuevoStock });
  });

  await registrarMovimiento({ productoId, tipo: 'ajuste', cantidad: Number(cantidad), motivo, realizadoPor });
}

// Merma: pérdida de producto. Resta stock consumiendo de lotes vía FIFO,
// para no perder trazabilidad de qué lote se perdió.
export async function registrarMerma({ productoId, cantidad, motivo, realizadoPor }) {
  const productoRef = doc(db, 'productos', productoId);

  await runTransaction(db, async (transaction) => {
    const productoSnap = await transaction.get(productoRef);
    if (!productoSnap.exists()) throw new Error('Producto no encontrado');
    const stockActual = productoSnap.data().stock ?? 0;
    if (stockActual < cantidad) throw new Error('No hay suficiente stock para esa merma');

    const plan = await planificarConsumoFIFO(transaction, productoId, Number(cantidad));
    transaction.update(productoRef, { stock: stockActual - Number(cantidad) });
    aplicarConsumoFIFO(transaction, plan);
  });

  await registrarMovimiento({ productoId, tipo: 'merma', cantidad: Number(cantidad), motivo, realizadoPor });
}