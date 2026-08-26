
import { useEffect, useState } from 'react';
import VentaForm from '../../components/admin/VentaForm';
import {
  subscribeToVentas,
  registrarVentaManual,
} from '../../services/ventaService';
import { useAuth } from '../../context/AuthContext';
import './AdminVentas.css';

export default function AdminVentas() {
  const [ventas, setVentas] = useState([]);
  const [ventaAbierta, setVentaAbierta] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    return subscribeToVentas(setVentas);
  }, []);

  async function handleGuardar(datos) {
    await registrarVentaManual({
      ...datos,
      realizadoPor: currentUser.uid,
    });
  }

  function numero(valor) {
    return Number(valor ?? 0);
  }

  function obtenerItems(venta) {
    return Array.isArray(venta.items) ? venta.items : [];
  }

  function calcularCostoTotal(venta) {
    return obtenerItems(venta).reduce((total, item) => {
      return total + numero(item.costoUnitario) * numero(item.cantidad);
    }, 0);
  }

  function cambiarDetalle(id) {
    setVentaAbierta((actual) => (actual === id ? null : id));
  }

  return (
    <div className="admin-ventas">
      <h1>Ventas</h1>

      <VentaForm onGuardar={handleGuardar} />

      <div className="ventas-lista">
        {ventas.map((venta) => {
          const items = obtenerItems(venta);
          const costoTotal = calcularCostoTotal(venta);
          const total = numero(venta.total);
          const ganancia = total - costoTotal;
          const abierta = ventaAbierta === venta.id;

          return (
            <div className="venta-card" key={venta.id}>

              <div className="venta-card-resumen">

                <div className="venta-info">
                  <span className="venta-label">Fecha</span>
                  <strong>
                    {venta.creadoEn?.toDate?.().toLocaleString?.() ?? '—'}
                  </strong>
                </div>

                <div className="venta-info">
                  <span className="venta-label">Cliente</span>
                  <strong>
                    {venta.cliente?.nombre ?? '—'}
                  </strong>
                </div>

                <div className="venta-info">
                  <span className="venta-label">Canal</span>
                  <strong>
                    {venta.canal ?? '—'}
                  </strong>
                </div>

                <div className="venta-info">
                  <span className="venta-label">Método</span>
                  <strong>
                    {venta.metodoPago ?? '—'}
                  </strong>
                </div>

                <div className="venta-info venta-total">
                  <span className="venta-label">Total</span>
                  <strong>
                    Bs {total.toFixed(2)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn-detalle-venta"
                  onClick={() => cambiarDetalle(venta.id)}
                >
                  {abierta ? 'Ocultar detalle' : 'Ver detalle'}
                </button>

              </div>

              {abierta && (
                <div className="venta-detalle">

                  <div className="venta-detalle-titulo">
                    <h3>Detalle de la venta</h3>
                  </div>

                  {items.length === 0 ? (
                    <div className="venta-sin-detalle">
                      Esta venta no tiene productos registrados.
                    </div>
                  ) : (
                    <>

                      <div className="venta-productos">

                        {items.map((item, index) => {
                          const cantidad = numero(item.cantidad);
                          const precio = numero(item.precio);
                          const costoUnitario = numero(
                            item.costoUnitario
                          );

                          const subtotal = precio * cantidad;
                          const costoItem =
                            costoUnitario * cantidad;
                          const gananciaItem =
                            subtotal - costoItem;

                          return (
                            <div
                              className="venta-producto"
                              key={
                                item.productoId ??
                                `${venta.id}-${index}`
                              }
                            >

                              <div className="venta-producto-nombre">
                                <span>Producto</span>
                                <strong>
                                  {item.nombre ?? 'Producto'}
                                </strong>
                              </div>

                              <div>
                                <span>Cantidad</span>
                                <strong>{cantidad}</strong>
                              </div>

                              <div>
                                <span>Precio</span>
                                <strong>
                                  Bs {precio.toFixed(2)}
                                </strong>
                              </div>

                              <div>
                                <span>Costo FIFO</span>
                                <strong>
                                  Bs {costoUnitario.toFixed(2)}
                                </strong>
                              </div>

                              <div>
                                <span>Subtotal</span>
                                <strong>
                                  Bs {subtotal.toFixed(2)}
                                </strong>
                              </div>

                              <div className="ganancia">
                                <span>Ganancia</span>
                                <strong>
                                  Bs {gananciaItem.toFixed(2)}
                                </strong>
                              </div>

                            </div>
                          );
                        })}

                      </div>

                      <div className="venta-resumen-final">

                        <div>
                          <span>Costo total</span>
                          <strong>
                            Bs {costoTotal.toFixed(2)}
                          </strong>
                        </div>

                        <div>
                          <span>Total venta</span>
                          <strong>
                            Bs {total.toFixed(2)}
                          </strong>
                        </div>

                        <div className="ganancia-total">
                          <span>Ganancia</span>
                          <strong>
                            Bs {ganancia.toFixed(2)}
                          </strong>
                        </div>

                      </div>

                    </>
                  )}

                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
