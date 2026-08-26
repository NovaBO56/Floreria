import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';

import { db } from '../firebase/config';

import {
  registrarMovimiento,
  registrarMovimientoEnTransaccion,
  planificarConsumoFIFO,
  aplicarConsumoFIFO,
} from './movimientoInventarioService';

// ============================================================
// NUEVA ENTRADA DE MERCADERÍA
// ============================================================

export async function registrarEntradaMercaderia({
  entradas,
  realizadoPor,
}) {
  if (!Array.isArray(entradas) || entradas.length === 0) {
    throw new Error('Debes registrar al menos una entrada');
  }

  const normalizadas = entradas.map((entrada) => ({
    productoId: entrada.productoId,
    cantidad: Number(entrada.cantidad),
    costoUnitario: Number(entrada.costoUnitario),
    proveedor: entrada.proveedor?.trim() ?? '',
  }));

  if (normalizadas.some((e) => !e.productoId)) {
    throw new Error(
      'Todas las entradas deben tener un producto'
    );
  }

  if (
    normalizadas.some(
      (e) =>
        !Number.isFinite(e.cantidad) ||
        e.cantidad <= 0
    )
  ) {
    throw new Error(
      'Todas las cantidades deben ser mayores que 0'
    );
  }

  if (
    normalizadas.some(
      (e) =>
        !Number.isFinite(e.costoUnitario) ||
        e.costoUnitario < 0
    )
  ) {
    throw new Error(
      'Todos los costos unitarios deben ser válidos'
    );
  }

  const productoIds = [
    ...new Set(
      normalizadas.map((entrada) => entrada.productoId)
    ),
  ];

  // Referencias preparadas antes de la transacción.
  const loteRefsPorEntrada = normalizadas.map(() =>
    doc(collection(db, 'lotes'))
  );

  const movimientoIds = [];

  /*
   * Primero obtenemos los lotes actuales.
   *
   * No usamos transaction.get(query), porque Firestore
   * no permite pasar una Query directamente a transaction.get().
   */
  const lotesActualesPorProducto = new Map();

  for (const productoId of productoIds) {
    const lotesQuery = query(
      collection(db, 'lotes'),
      where('productoId', '==', productoId),
      where('cantidadDisponible', '>', 0),
      orderBy('fechaIngreso', 'asc')
    );

    const snapshot = await getDocs(lotesQuery);

    lotesActualesPorProducto.set(
      productoId,
      snapshot.docs
    );
  }

  /*
   * Ahora hacemos la escritura dentro de una única transacción.
   */
  await runTransaction(db, async (transaction) => {
    // --------------------------------------------------------
    // LEER PRODUCTOS
    // --------------------------------------------------------

    const productoRefs = productoIds.map((id) =>
      doc(db, 'productos', id)
    );

    const productoSnaps = await Promise.all(
      productoRefs.map((ref) =>
        transaction.get(ref)
      )
    );

    const productosMap = new Map();

    productoSnaps.forEach((snap, index) => {
      if (!snap.exists()) {
        throw new Error(
          `Producto no encontrado: ${productoIds[index]}`
        );
      }

      productosMap.set(
        productoIds[index],
        {
          ref: productoRefs[index],
          snap,
        }
      );
    });

    // --------------------------------------------------------
    // CALCULAR ENTRADAS POR PRODUCTO
    // --------------------------------------------------------

    const entradasPorProducto = new Map();

    for (const entrada of normalizadas) {
      const anterior =
        entradasPorProducto.get(
          entrada.productoId
        ) ?? 0;

      entradasPorProducto.set(
        entrada.productoId,
        anterior + entrada.cantidad
      );
    }

    // --------------------------------------------------------
    // ACTUALIZAR STOCK
    // --------------------------------------------------------

    for (const productoId of productoIds) {
      const producto =
        productosMap.get(productoId);

      const stockActual = Number(
        producto.snap.data().stock ?? 0
      );

      const lotesActuales =
        lotesActualesPorProducto.get(
          productoId
        ) ?? [];

      let baseStock = stockActual;

      /*
       * Si ya existen lotes, la fuente real del inventario
       * son sus cantidades disponibles.
       */
      if (lotesActuales.length > 0) {
        baseStock = lotesActuales.reduce(
          (total, loteDoc) =>
            total +
            Number(
              loteDoc.data()
                .cantidadDisponible ?? 0
            ),
          0
        );
      }

      const cantidadEntrada =
        entradasPorProducto.get(
          productoId
        ) ?? 0;

      transaction.update(producto.ref, {
        stock:
          baseStock + cantidadEntrada,
      });
    }

    // --------------------------------------------------------
    // CREAR LOTES Y MOVIMIENTOS
    // --------------------------------------------------------

    normalizadas.forEach(
      (entrada, index) => {
        const loteRef =
          loteRefsPorEntrada[index];

        // Crear lote
        transaction.set(loteRef, {
          productoId:
            entrada.productoId,

          cantidadInicial:
            entrada.cantidad,

          cantidadDisponible:
            entrada.cantidad,

          costoUnitario:
            entrada.costoUnitario,

          proveedor:
            entrada.proveedor,

          fechaIngreso:
            serverTimestamp(),

          registradoPor:
            realizadoPor ?? null,
        });

        // Crear movimiento dentro de
        // la misma transacción.
        const movimientoId =
          registrarMovimientoEnTransaccion(
            transaction,
            {
              productoId:
                entrada.productoId,

              tipo: 'entrada',

              cantidad:
                entrada.cantidad,

              loteId:
                loteRef.id,

              costoUnitario:
                entrada.costoUnitario,

              motivo:
                `Entrada de mercadería${
                  entrada.proveedor
                    ? ` — proveedor: ${entrada.proveedor}`
                    : ''
                }`,

              realizadoPor:
                realizadoPor ?? null,
            }
          );

        movimientoIds.push(
          movimientoId
        );
      }
    );
  });

  return {
    loteIds:
      loteRefsPorEntrada.map(
        (ref) => ref.id
      ),

    movimientoIds,
  };
}

// ============================================================
// COMPATIBILIDAD CON EL FLUJO ANTERIOR
// ============================================================

export async function registrarEntradaLote({
  productoId,
  cantidad,
  costoUnitario,
  proveedor,
  realizadoPor,
}) {
  const resultado =
    await registrarEntradaMercaderia({
      entradas: [
        {
          productoId,
          cantidad,
          costoUnitario,
          proveedor,
        },
      ],
      realizadoPor,
    });

  return resultado.loteIds[0];
}

// ============================================================
// AJUSTE MANUAL DE STOCK
// ============================================================

export async function registrarAjusteStock({
  productoId,
  cantidad,
  motivo,
  realizadoPor,
}) {
  const cantidadAjuste =
    Number(cantidad);

  if (
    !Number.isFinite(cantidadAjuste) ||
    cantidadAjuste === 0
  ) {
    throw new Error(
      'El ajuste debe ser diferente de 0'
    );
  }

  const productoRef =
    doc(db, 'productos', productoId);

  await runTransaction(
    db,
    async (transaction) => {
      const productoSnap =
        await transaction.get(
          productoRef
        );

      if (!productoSnap.exists()) {
        throw new Error(
          'Producto no encontrado'
        );
      }

      const stockActual =
        Number(
          productoSnap.data().stock ?? 0
        );

      const nuevoStock =
        stockActual +
        cantidadAjuste;

      if (nuevoStock < 0) {
        throw new Error(
          'El ajuste dejaría el stock en negativo'
        );
      }

      transaction.update(
        productoRef,
        {
          stock: nuevoStock,
        }
      );
    }
  );

  await registrarMovimiento({
    productoId,
    tipo: 'ajuste',
    cantidad: cantidadAjuste,
    motivo,
    realizadoPor,
  });
}

// ============================================================
// MERMA
// ============================================================

export async function registrarMerma({
  productoId,
  cantidad,
  motivo,
  realizadoPor,
}) {
  const cantidadMerma =
    Number(cantidad);

  if (
    !Number.isFinite(cantidadMerma) ||
    cantidadMerma <= 0
  ) {
    throw new Error(
      'La cantidad de merma debe ser mayor que 0'
    );
  }

  const productoRef =
    doc(db, 'productos', productoId);

  /*
   * Para la merma necesitamos conservar FIFO.
   *
   * La función planificarConsumoFIFO obtiene
   * los lotes candidatos y luego lee sus referencias
   * mediante la transacción.
   */
  await runTransaction(
    db,
    async (transaction) => {
      const productoSnap =
        await transaction.get(
          productoRef
        );

      if (!productoSnap.exists()) {
        throw new Error(
          'Producto no encontrado'
        );
      }

      const stockActual =
        Number(
          productoSnap.data().stock ?? 0
        );

      if (
        stockActual < cantidadMerma
      ) {
        throw new Error(
          'No hay suficiente stock para esa merma'
        );
      }

      const plan =
        await planificarConsumoFIFO(
          transaction,
          productoId,
          cantidadMerma
        );

      aplicarConsumoFIFO(
        transaction,
        plan
      );

      transaction.update(
        productoRef,
        {
          stock:
            stockActual -
            cantidadMerma,
        }
      );

      /*
       * El movimiento queda dentro de la misma
       * transacción para evitar inconsistencias.
       */
      registrarMovimientoEnTransaccion(
        transaction,
        {
          productoId,
          tipo: 'merma',
          cantidad: cantidadMerma,
          loteId: null,
          costoUnitario:
            plan.costoPromedio,
          motivo:
            motivo ?? 'Merma de inventario',
          realizadoPor:
            realizadoPor ?? null,
        }
      );
    }
  );
}