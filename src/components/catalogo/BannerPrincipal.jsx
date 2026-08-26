
import './BannerPrincipal.css';

const NUMERO_WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

// Con HashRouter, evitamos que href="#id" sea interpretado como una ruta.
// En su lugar, hacemos scroll suave a la sección correspondiente.
function irASeccion(e, id) {
  e.preventDefault();

  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export default function BannerPrincipal({
  imagenUrl,
  titulo,
  subtitulo,
}) {
  return (
    <section
      id="inicio"
      className="banner-principal"
      style={
        imagenUrl
          ? { backgroundImage: `url(${imagenUrl})` }
          : undefined
      }
    >
      <div className="banner-contenido">
        <h2>{titulo}</h2>

        <p>{subtitulo}</p>

        <div className="banner-cta">
          <a
            href="#catalogo"
            className="banner-cta-principal"
            onClick={(e) => irASeccion(e, 'catalogo')}
          >
            Ver catálogo
          </a>

          {NUMERO_WHATSAPP && (
            <a
              href={`https://wa.me/${NUMERO_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="banner-cta-secundaria"
            >
              💬 Hablar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
