import './Personalizacion.css';

const NUMERO_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function Personalizacion() {
  return (
    <section className="personalizacion">
      <div className="personalizacion-texto">
        <h2>¿Buscas algo especial?</h2>
        <p>Cuéntanos qué tienes en mente y preparamos un arreglo para ti.</p>
      </div>

      {NUMERO_WHATSAPP && (
        <a
          href={`https://wa.me/${NUMERO_WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="personalizacion-boton"
        >
          💬 Personalizar por WhatsApp
        </a>
      )}
    </section>
  );
}
