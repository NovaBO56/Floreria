import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToApariencia } from '../services/configuracionService';

// El color ya no es configurable desde el admin — la paleta vive fija
// en src/styles/variables.css. Apariencia solo controla identidad
// (nombre, logo, banner) y el interruptor de animaciones.
const DEFAULTS = {
  nombreNegocio: 'Florería',
  logoUrl: '',
  bannerUrl: '',
  animacionesActivas: true,
};

const AppearanceContext = createContext(DEFAULTS);

export function AppearanceProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    return subscribeToApariencia((datos) => {
      const merged = { ...DEFAULTS, ...(datos ?? {}) };
      setConfig(merged);
      document.body.classList.toggle('sin-animaciones', !merged.animacionesActivas);
    });
  }, []);

  return <AppearanceContext.Provider value={config}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  return useContext(AppearanceContext);
}
