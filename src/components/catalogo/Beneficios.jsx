import './Beneficios.css';

const ITEMS = [
  { icono: '🌸', texto: 'Arreglos personalizados' },
  { icono: '🚚', texto: 'Entrega a domicilio' },
  { icono: '🏪', texto: 'Recojo en tienda' },
  { icono: '💬', texto: 'Pedidos por WhatsApp' },
];

export default function Beneficios() {
  return (
    <section className="beneficios">
      {ITEMS.map((item) => (
        <div className="beneficio-item" key={item.texto}>
          <span className="beneficio-icono">{item.icono}</span>
          <p>{item.texto}</p>
        </div>
      ))}
    </section>
  );
}
