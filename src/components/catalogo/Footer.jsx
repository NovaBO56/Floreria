import { useAppearance } from '../../context/AppearanceContext';
import './Footer.css';

const NUMERO_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

function irASeccion(e, id) {
  e.preventDefault();

  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

export default function Footer() {
  const { nombreNegocio } = useAppearance();

  return (
    <footer className="footer-catalogo">
      <div className="footer-marca">
        <h3>{nombreNegocio}</h3>
        <p>Arreglos florales para cada ocasión especial.</p>
      </div>

      <div className="footer-contacto">
        <h4>Contacto</h4>

        {NUMERO_WHATSAPP ? (
          <a
            href={`https://wa.me/${NUMERO_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        ) : null}
      </div>

      <div className="footer-info">
        <h4>Enlaces</h4>

        <a
          href="#inicio"
          onClick={(e) => irASeccion(e, 'inicio')}
        >
          Inicio
        </a>

        <a
          href="#categorias"
          onClick={(e) => irASeccion(e, 'categorias')}
        >
          Categorías
        </a>

        <a
          href="#catalogo"
          onClick={(e) => irASeccion(e, 'catalogo')}
        >
          Catálogo
        </a>
      </div>

      <div className="footer-copy">
        © {new Date().getFullYear()} {nombreNegocio}. Todos los derechos reservados.
      </div>
    </footer>
  );
}