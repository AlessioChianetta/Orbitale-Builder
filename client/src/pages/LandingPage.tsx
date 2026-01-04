
import React from 'react';
import { DirectResponseLanding } from '@/components/DirectResponseLanding';

// Questa pagina usa il template DirectResponseLanding con contenuto di esempio
// Puoi facilmente modificare questi valori per creare nuove landing page

export default function LandingPage() {
  return (
    <DirectResponseLanding
      preHeadline="ATTENZIONE: Solo per imprenditori seri che vogliono risultati reali"
      headline="Scopri Come Ho Aumentato le Vendite del 340% in 90 Giorni"
      subHeadline="Il sistema esatto che uso per trasformare visitatori in clienti paganti (anche se parti da zero)"
      
      // Video (opzionale)
      videoUrl="/videos/presentazione.mp4" // Sostituisci con il tuo video
      videoThumbnail="/images/video-thumb.jpg"
      
      // Informazioni personali
      authorName="Marco Rossi"
      authorImage="/images/marco-foto.jpg"
      authorStory="Dopo 15 anni nel marketing digitale e oltre 500 progetti completati, ho sviluppato un sistema che garantisce risultati concreti anche ai principianti. La mia missione è aiutare imprenditori ambiziosi a raggiungere il loro pieno potenziale online."
      
      // Risultati concreti
      results={[
        "€2.4M di fatturato generato per i clienti negli ultimi 12 mesi",
        "Tasso di conversione medio del 8.7% (3x superiore alla media)",
        "ROI medio di 4:1 sui progetti realizzati",
        "Oltre 50 aziende portate da zero a 6 cifre",
        "Sistema testato su 15+ settori diversi"
      ]}
      
      // Testimonianze
      testimonials={[
        {
          name: "Laura Bianchi",
          role: "CEO",
          company: "Fashion Hub",
          content: "In soli 3 mesi le nostre vendite sono triplicate. Il sistema di Marco funziona davvero! Abbiamo passato da €50k a €180k di fatturato mensile.",
          image: "/images/testimonial-laura.jpg"
        },
        {
          name: "Andrea Verdi",
          role: "Founder", 
          company: "GreenTech Solutions",
          content: "ROI del 500% nel primo mese. Non credevo fosse possibile. Marco ci ha fatto risparmiare anni di tentativi fallimentari.",
          image: "/images/testimonial-andrea.jpg"
        },
        {
          name: "Giulia Romano",
          role: "Marketing Director",
          company: "Wellness Pro",
          content: "Le conversioni sono aumentate dell'850%. Ora generiamo lead qualificati ogni giorno in automatico.",
          image: "/images/testimonial-giulia.jpg"
        }
      ]}
      
      // Loghi clienti
      clientLogos={[
        "/images/client-logo-1.png",
        "/images/client-logo-2.png", 
        "/images/client-logo-3.png",
        "/images/client-logo-4.png"
      ]}
      
      // Requisiti per candidarsi
      requirements={[
        "Fatturato annuo minimo di €100k (o forte potenziale di crescita)",
        "Disponibilità a investire almeno €5k/mese in marketing",
        "Commitment serio verso la crescita del business per almeno 6 mesi",
        "Apertura mentale verso nuove strategie innovative"
      ]}
      
      // Processo di candidatura
      processSteps={[
        "Compila il form di candidatura dettagliato",
        "Ricevi conferma e valutazione entro 24 ore",
        "Call strategica gratuita di 45 minuti con me",
        "Proposta personalizzata e piano d'azione"
      ]}
      
      // CTA
      ctaText="CANDIDATI ORA - GRATIS"
      ctaSubtext="⚠️ ATTENZIONE: Solo 10 aziende al mese - Posti quasi esauriti"
      
      // Form
      formTitle="Candidatura Strategia Crescita Accelerata"
      customFields={[
        "Fatturato annuo attuale",
        "Budget marketing mensile", 
        "Principale sfida del business"
      ]}
    />
  );
}
