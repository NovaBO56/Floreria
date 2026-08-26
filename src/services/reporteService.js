import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export function rangoFecha(filtro, desdeCustom, hastaCustom) {
  const ahora = new Date();
  let desde, hasta;

  if (filtro === 'hoy') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    hasta = new Date(desde); hasta.setDate(hasta.getDate() + 1);
  } else if (filtro === 'ayer') {
    hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    desde = new Date(hasta); desde.setDate(desde.getDate() - 1);
  } else if (filtro === 'semana') {
    hasta = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
    desde = new Date(hasta); desde.setDate(desde.getDate() - 7);
  } else if (filtro === 'mes') {
    desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
  } else {
    desde = new Date(desdeCustom);
    hasta = new Date(hastaCustom);
    hasta.setDate(hasta.getDate() + 1);
  }

  return { desde, hasta };
}

export async function obtenerVentasEnRango(desde, hasta) {
  const q = query(collection(db, 'ventas'), where('creadoEn', '>=', desde), where('creadoEn', '<', hasta));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function obtenerCierresCajaEnRango(desde, hasta) {
  const q = query(collection(db, 'caja'), where('cerradoEn', '>=', desde), where('cerradoEn', '<', hasta));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function obtenerMovimientosInventarioEnRango(desde, hasta) {
  const q = query(collection(db, 'movimientosInventario'), where('creadoEn', '>=', desde), where('creadoEn', '<', hasta));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Agregaciones calculadas del lado del cliente sobre las ventas del rango.
// Las ventas guardan el costoUnitario histórico de cada item (Fase 6),
// por eso la ganancia calculada aquí no cambia si luego entra un lote
// con un costo distinto (regla 13).
export function calcularResumenVentas(ventas) {
  let ingresos = 0;
  let costos = 0;
  const porProducto = {};
  const porMetodoPago = {};
  const porCanal = {};

  ventas.forEach((venta) => {
    ingresos += venta.total;
    porMetodoPago[venta.metodoPago ?? 'sin especificar'] =
      (porMetodoPago[venta.metodoPago ?? 'sin especificar'] ?? 0) + venta.total;
    porCanal[venta.canal ?? 'sin especificar'] =
      (porCanal[venta.canal ?? 'sin especificar'] ?? 0) + venta.total;

    venta.items.forEach((item) => {
      costos += (item.costoUnitario ?? 0) * item.cantidad;
      porProducto[item.nombre] = (porProducto[item.nombre] ?? 0) + item.cantidad;
    });
  });

  const productosMasVendidos = Object.entries(porProducto).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return {
    cantidadVentas: ventas.length,
    ingresos,
    costos,
    gananciaBruta: ingresos - costos,
    productosMasVendidos,
    porMetodoPago,
    porCanal,
  };
}