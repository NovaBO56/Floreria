import {
  collection, doc, addDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Registra un movimiento en el historial. Nunca se borra ni se sobrescribe (regla 11).
export async function registrarMovimiento({ productoId, tipo, cantidad, loteId, costoUnitario, motivo, realizadoPor }) {
  return addDoc(collection(db, 'movimientosInventario'), {
    productoId,
    tipo, // 'entrada' | 'venta' | 'ajuste' | 'merma'
    cantidad,
    loteId: loteId ?? null,
    costoUnitario: costoUnitario ?? null,
    motivo: motivo ?? '',
    realizadoPor,
    creadoEn: serverTimestamp(),
  });
}

export function subscribeToHistorialProducto(productoId, callback) {
  const q = query(
    collection(db, 'movimientosInventario'),
    where('productoId', '==', productoId),
    orderBy('creadoEn', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

// --- Consumo FIFO de lotes ---
// Firestore exige que TODAS las lecturas de una transacción ocurran antes
// que cualquier escritura. Por eso esto se divide en dos pasos:
// 1) planificarConsumoFIFO: solo lee, calcula qué lotes usar (más antiguos primero).
// 2) aplicarConsumoFIFO: solo escribe, usando el plan ya calculado.
// El que llama a esto (venta manual o confirmación de pedido) debe
// planificar TODOS los productos primero, y recién después aplicar todo.

export async function planificarConsumoFIFO(transaction, productoId, cantidadRequerida) {
  const lotesQuery = query(
    collection(db, 'lotes'),
    where('productoId', '==', productoId),
    where('cantidadDisponible', '>', 0),
    orderBy('fechaIngreso', 'asc')
  );
  const lotesSnap = await getDocs(lotesQuery);
  const lotesRefs = lotesSnap.docs.map((d) => doc(db, 'lotes', d.id));
  const lotesFrescos = await Promise.all(lotesRefs.map((ref) => transaction.get(ref)));

  let restante = cantidadRequerida;
  let costoTotal = 0;
  const consumos = [];

  for (let i = 0; i < lotesFrescos.length; i++) {
    if (restante <= 0) break;
    const snap = lotesFrescos[i];
    if (!snap.exists()) continue;
    const disponible = snap.data().cantidadDisponible;
    if (disponible <= 0) continue;

    const tomar = Math.min(disponible, restante);
    const costoUnitario = snap.data().costoUnitario;

    consumos.push({ ref: lotesRefs[i], loteId: snap.id, cantidad: tomar, disponibleActual: disponible, costoUnitario });
    costoTotal += tomar * costoUnitario;
    restante -= tomar;
  }

  if (restante > 0) {
    throw new Error('Stock insuficiente en lotes para completar la operación');
  }

  return { productoId, cantidadRequerida, consumos, costoTotal, costoPromedio: costoTotal / cantidadRequerida };
}

export function aplicarConsumoFIFO(transaction, plan) {
  plan.consumos.forEach((c) => {
    transaction.update(c.ref, { cantidadDisponible: c.disponibleActual - c.cantidad });
  });
}