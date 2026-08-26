import {
  collection, doc, addDoc, updateDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// No permite abrir una segunda caja si ya hay una abierta.
export async function abrirCaja({ montoInicial, realizadoPor }) {
  const abiertaSnap = await getDocs(query(collection(db, 'caja'), where('estado', '==', 'abierta')));
  if (!abiertaSnap.empty) throw new Error('Ya existe una caja abierta. Ciérrala antes de abrir una nueva.');

  const docRef = await addDoc(collection(db, 'caja'), {
    montoInicial: Number(montoInicial), estado: 'abierta', abiertoPor: realizadoPor, abiertoEn: serverTimestamp(),
  });
  return docRef.id;
}

export function subscribeToCajaAbierta(callback) {
  const q = query(collection(db, 'caja'), where('estado', '==', 'abierta'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
  });
}

export async function registrarMovimientoCaja({ cajaId, tipo, monto, metodoPago, descripcion, realizadoPor }) {
  return addDoc(collection(db, 'movimientosCaja'), {
    cajaId, tipo, monto: Number(monto), metodoPago: metodoPago ?? 'efectivo',
    descripcion: descripcion ?? '', realizadoPor, creadoEn: serverTimestamp(),
  });
}

export function subscribeToMovimientosCaja(cajaId, callback) {
  const q = query(collection(db, 'movimientosCaja'), where('cajaId', '==', cajaId), orderBy('creadoEn', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

export function calcularTotalEsperado(caja, movimientos, ventasEfectivo) {
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const gastos = movimientos.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  const totalVentas = ventasEfectivo.reduce((s, v) => s + v.total, 0);
  return caja.montoInicial + ingresos - gastos + totalVentas;
}

// El cierre queda guardado para siempre — no se modifica después (regla 14).
export async function cerrarCaja({ cajaId, montoContado, totalEsperado, realizadoPor }) {
  const diferencia = Number(montoContado) - totalEsperado;
  await updateDoc(doc(db, 'caja', cajaId), {
    estado: 'cerrada', totalEsperado, montoContado: Number(montoContado),
    diferencia, cerradoPor: realizadoPor, cerradoEn: serverTimestamp(),
  });
  return diferencia;
}

export function subscribeToHistorialCierres(callback) {
  const q = query(collection(db, 'caja'), where('estado', '==', 'cerrada'), orderBy('cerradoEn', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}