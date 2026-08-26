import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';

import { db } from '../firebase/config';

// ============================================================
// REGISTRAR MOVIMIENTO
// ============================================================

export async function registrarMovimiento({
  productoId,
  tipo,
  cantidad,
  loteId,
  costoUnitario,
  motivo,
  realizadoPor,
}) {
  return addDoc(collection(db, 'movimientosInventario'), {
    productoId,
    tipo,
    cantidad: Number(cantidad),
    loteId: loteId ?? null,
    costoUnitario:
      costoUnitario !== undefined && costoUnitario !== null
        ? Number(costoUnitario)
        : null,
    motivo: motivo ?? '',
    realizadoPor: realizadoPor ?? null,
    creadoEn: serverTimestamp(),
  });
}

// ============================================================
// REGISTRAR MOVIMIENTO DENTRO DE UNA TRANSACCIÓN
// ============================================================

export function registrarMovimientoEnTransaccion(
  transaction,
  {
    productoId,
    tipo,
    cantidad,
    loteId,
    costoUnitario,
    motivo,
    realizadoPor,
  }
) {
  const movimientoRef = doc(
    collection(db, 'movimientosInventario')
  );

  transaction.set(movimientoRef, {
    productoId,
    tipo,
    cantidad: Number(cantidad),
    loteId: loteId ?? null,
    costoUnitario:
      costoUnitario !== undefined && costoUnitario !== null
        ? Number(costoUnitario)
        : null,
    motivo: motivo ?? '',
    realizadoPor: realizadoPor ?? null,
    creadoEn: serverTimestamp(),
  });

  return movimientoRef.id;
}

// ============================================================
// HISTORIAL
// ============================================================

export function subscribeToHistorialProducto(
  productoId,
  callback
) {
  const q = query(
    collection(db, 'movimientosInventario'),
    where('productoId', '==', productoId),
    orderBy('creadoEn', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      }))
    );
  });
}

// ============================================================
// PLANIFICAR CONSUMO FIFO
// ============================================================

export async function planificarConsumoFIFO(
  transaction,
  productoId,
  cantidadRequerida
) {
  const cantidad = Number(cantidadRequerida);

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error(
      'La cantidad a consumir debe ser mayor que 0'
    );
  }

  const lotesQuery = query(
    collection(db, 'lotes'),
    where('productoId', '==', productoId),
    where('cantidadDisponible', '>', 0),
    orderBy('fechaIngreso', 'asc')
  );

  /*
   * transaction.get() no acepta una consulta.
   * Primero obtenemos los lotes candidatos.
   */
  const lotesSnapshot = await getDocs(lotesQuery);

  let restante = cantidad;
  let costoTotal = 0;

  const consumos = [];

  /*
   * Volvemos a leer cada documento mediante la transacción
   * para que las escrituras posteriores utilicen las referencias
   * correctas de Firestore.
   */
  for (const loteDocumento of lotesSnapshot.docs) {
    if (restante <= 0) {
      break;
    }

    const loteRef = loteDocumento.ref;

    if (!loteRef) {
      continue;
    }

    const loteSnapshot = await transaction.get(loteRef);

    if (!loteSnapshot.exists()) {
      continue;
    }

    const lote = loteSnapshot.data();

    const disponible = Number(
      lote.cantidadDisponible ?? 0
    );

    if (disponible <= 0) {
      continue;
    }

    const cantidadTomar = Math.min(
      disponible,
      restante
    );

    const costoUnitario = Number(
      lote.costoUnitario ?? 0
    );

    consumos.push({
      ref: loteRef,
      loteId: loteSnapshot.id,
      cantidad: cantidadTomar,
      disponibleActual: disponible,
      costoUnitario,
    });

    costoTotal +=
      cantidadTomar * costoUnitario;

    restante -= cantidadTomar;
  }

  if (restante > 0) {
    throw new Error(
      'Stock insuficiente en lotes para completar la operación'
    );
  }

  return {
    productoId,
    cantidadRequerida: cantidad,
    consumos,
    costoTotal,
    costoPromedio:
      costoTotal / cantidad,
  };
}

// ============================================================
// APLICAR CONSUMO FIFO
// ============================================================

export function aplicarConsumoFIFO(
  transaction,
  plan
) {
  for (const consumo of plan.consumos) {
    transaction.update(consumo.ref, {
      cantidadDisponible:
        consumo.disponibleActual -
        consumo.cantidad,
    });
  }
}