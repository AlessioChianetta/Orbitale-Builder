// File: src/components/use-is-mobile.ts

import { useState, useEffect } from 'react';

// Definiamo il breakpoint per considerare un dispositivo "mobile"
const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Funzione per controllare la larghezza e aggiornare lo stato
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // La eseguiamo subito per impostare il valore corretto al caricamento
    checkDevice();

    // Aggiungiamo un listener per gestire i cambi di dimensione della finestra
    window.addEventListener('resize', checkDevice);

    // Funzione di pulizia: rimuoviamo il listener quando il componente non è più usato
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []); // L'array vuoto assicura che l'effetto venga eseguito solo una volta

  return isMobile;
}