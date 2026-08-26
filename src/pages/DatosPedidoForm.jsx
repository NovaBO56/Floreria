import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { validarDisponibilidad, crearPedido } from '../services/pedidoService';
import { abrirWhatsApp } from '../services/whatsappService';
import './Checkout.css';

// Acepta números de WhatsApp con espacios, guiones o "+" y valida que,
// una vez limpio, tenga una cantidad de dígitos razonable.
function whatsappValido(valor) {
  const soloDigitos = valor.replace(/[^0-9]/g, '');
  return soloDigitos.length >= 7 && soloDigitos.length <= 15;
}

export default function DatosPedidoForm({ onPedidoEnviado }) {
  const { items, subtotal, clearCart } = useCart();

  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [modalidad, setModalidad] = useState('recojo');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referencia, setReferencia] = useState('');
  const [zona, setZona] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [camposInvalidos, setCamposInvalidos] = useState({});

  // Valida los datos escritos por el cliente antes de tocar Firebase.
  // Devuelve un mapa de campos inválidos (para resaltarlos) y un mensaje.
  function validarFormulario() {
    const invalidos = {};

    if (!nombre.trim()) invalidos.nombre = true;
    if (!whatsappValido(whatsapp)) invalidos.whatsapp = true;

    if (modalidad === 'recojo') {
      if (!fecha) invalidos.fecha = true;
      if (!hora) invalidos.hora = true;

      // No permitir agendar el recojo en una fecha ya pasada.
      if (fecha) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaSeleccionada = new Date(`${fecha}T00:00:00`);
        if (fechaSeleccionada < hoy) invalidos.fecha = true;
      }
    } else {
      if (!direccion.trim()) invalidos.direccion = true;
      if (!zona.trim()) invalidos.zona = true;
    }

    setCamposInvalidos(invalidos);

    if (Object.keys(invalidos).length > 0) {
      return 'Revisa los datos marcados: hay campos vacíos o con un formato inválido.';
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (enviando) return; // evita doble clic
    setError('');

    const mensajeValidacion = validarFormulario();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    setEnviando(true);

    try {
      const problemas = await validarDisponibilidad(items);
      if (problemas.length > 0) {
        setError(
          'Algunos productos ya no están disponibles con la cantidad solicitada. Por favor revisa tu carrito.'
        );
        setEnviando(false);
        return;
      }

      const total = subtotal; // + costo de envío si aplica, se ajusta en Fase de entrega avanzada
      // Se combina en un solo texto para mantener compatibilidad con el
      // campo "fechaHora" que ya usan el pedido, el mensaje de WhatsApp
      // y la tarjeta de pedido en el panel admin.
      const fechaHora = modalidad === 'recojo' && fecha && hora ? `${fecha} ${hora}` : '';

      const { numero } = await crearPedido({
        items,
        subtotal,
        total,
        cliente: { nombre: nombre.trim(), whatsapp: whatsapp.trim() },
        modalidad,
        fechaHora: modalidad === 'recojo' ? fechaHora : null,
        entrega: modalidad === 'entrega' ? { direccion, referencia, zona } : null,
        dedicatoria,
      });

      abrirWhatsApp({
        numero,
        cliente: { nombre: nombre.trim() },
        items,
        total,
        modalidad,
        fechaHora,
        entrega: { direccion, referencia, zona },
        dedicatoria,
      });

      clearCart();
      onPedidoEnviado(numero);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al enviar tu pedido. Intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="datos-pedido-form" onSubmit={handleSubmit} noValidate>
      <h2>Completa tus datos</h2>

      <div className="checkout-columnas">
        <div className="checkout-col-formulario">
          <section className="checkout-seccion">
            <h3>Tus datos</h3>

            <label>
              Nombre
              <input
                className={camposInvalidos.nombre ? 'campo-invalido' : ''}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>

            <label>
              WhatsApp
              <input
                className={camposInvalidos.whatsapp ? 'campo-invalido' : ''}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 71234567"
              />
            </label>
          </section>

          <section className="checkout-seccion">
            <h3>Entrega</h3>

            <fieldset className="modalidad-fieldset">
              <label>
                <input
                  type="radio"
                  checked={modalidad === 'recojo'}
                  onChange={() => setModalidad('recojo')}
                />
                🏪 Recojo en tienda
              </label>
              <label>
                <input
                  type="radio"
                  checked={modalidad === 'entrega'}
                  onChange={() => setModalidad('entrega')}
                />
                🚚 Entrega
              </label>
            </fieldset>

            {modalidad === 'recojo' ? (
              <div className="checkout-fecha-hora">
                <label>
                  Fecha
                  <input
                    type="date"
                    className={camposInvalidos.fecha ? 'campo-invalido' : ''}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </label>
                <label>
                  Hora aproximada
                  <input
                    type="time"
                    className={camposInvalidos.hora ? 'campo-invalido' : ''}
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </label>
              </div>
            ) : (
              <>
                <label>
                  Dirección
                  <input
                    className={camposInvalidos.direccion ? 'campo-invalido' : ''}
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </label>
                <label>
                  Referencia
                  <input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                </label>
                <label>
                  Zona
                  <input
                    className={camposInvalidos.zona ? 'campo-invalido' : ''}
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                  />
                </label>
              </>
            )}
          </section>

          <section className="checkout-seccion">
            <h3>Observaciones</h3>
            <label>
              Dedicatoria / nota (opcional)
              <textarea value={dedicatoria} onChange={(e) => setDedicatoria(e.target.value)} />
            </label>
          </section>
        </div>

        <div className="checkout-col-resumen">
          <section className="resumen-pedido">
            <h3>Resumen del pedido</h3>
            <ul>
              {items.map((item) => (
                <li key={item.productoId}>
                  <span>{item.cantidad}x {item.nombre}</span>
                  <span>Bs {(item.precio * item.cantidad).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="resumen-subtotal">
              <span>Subtotal</span>
              <strong>Bs {subtotal.toFixed(2)}</strong>
            </div>
          </section>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
          </button>
        </div>
      </div>
    </form>
  );
}
