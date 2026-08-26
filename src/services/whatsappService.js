// Construye el mensaje y el link de WhatsApp. No envía nada automáticamente,
// solo abre WhatsApp con el mensaje ya redactado (según el flujo definido).

const NUMERO_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

export function construirMensajePedido(pedido) {
  const lineas = [];
  lineas.push(`Pedido #${pedido.numero}`);
  lineas.push(`Cliente: ${pedido.cliente.nombre}`);
  lineas.push('');
  lineas.push('Productos:');
  pedido.items.forEach((item) => {
    lineas.push(`- ${item.cantidad}x ${item.nombre} (Bs ${item.precio.toFixed(2)} c/u)`);
  });
  lineas.push('');
  lineas.push(`Total: Bs ${pedido.total.toFixed(2)}`);
  lineas.push('');
  lineas.push(`Modalidad: ${pedido.modalidad === 'recojo' ? 'Recojo en tienda' : 'Entrega'}`);

  if (pedido.modalidad === 'recojo') {
    lineas.push(`Fecha/hora aproximada: ${pedido.fechaHora}`);
  } else {
    lineas.push(`Dirección: ${pedido.entrega.direccion}`);
    lineas.push(`Referencia: ${pedido.entrega.referencia}`);
    lineas.push(`Zona: ${pedido.entrega.zona}`);
  }

  if (pedido.dedicatoria) {
    lineas.push('');
    lineas.push(`Dedicatoria: ${pedido.dedicatoria}`);
  }

  return lineas.join('\n');
}

export function abrirWhatsApp(pedido) {
  const mensaje = construirMensajePedido(pedido);
  const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}