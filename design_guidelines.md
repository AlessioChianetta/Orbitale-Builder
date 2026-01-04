# Design Guidelines per Sito Web Professionale Italiano

## Approccio di Design

**Riferimento**: Ispirato a HubSpot e Webflow per design professionale business-oriented con focus sulla conversione e sistema CMS completo.

**Principi Guida**: Design pulito e professionale, gerarchia visiva forte, ottimizzazione per conversioni, layout moderno basato su carte.

## Elementi di Design Fondamentali

### A. Palette Colori
- **Primario**: 213 59% 59% (blu professionale)
- **Secondario**: 215 25% 27% (grigio ardesia)
- **Accento**: 158 64% 52% (verde conversione)
- **Sfondo**: 210 40% 98% (grigio chiaro)
- **Testo**: 222 84% 5% (ardesia scuro)
- **CTA**: 0 84% 60% (rosso azione)

### B. Tipografia
- **Font Primario**: Inter per testi corpo e interfaccia
- **Font Secondario**: Poppins per titoli e headline
- **Gerarchia**: H1 (32-48px), H2 (24-32px), H3 (18-24px), Body (16px), Small (14px)

### C. Sistema Layout
- **Spaziatura Tailwind**: Unità principali 4, 8, 16 (p-4, m-8, gap-16)
- **Container**: Max-width responsive con padding laterale
- **Grid**: Sistema a 12 colonne per desktop, stack mobile

### D. Libreria Componenti

**Navigazione**:
- Header fisso con logo, menu principale e CTA
- Breadcrumb per navigazione interna
- Footer con sezioni organizzate e link utili

**Form e Input**:
- Form candidatura con validazione real-time
- Form contatti con campi strutturati
- Editor rich text per CMS admin

**Visualizzazione Dati**:
- Card servizi con hover effects sottili
- Card blog con anteprima e metadata
- Dashboard admin con tabelle e metriche

**Overlay e Modal**:
- Modal conferma per azioni admin
- Toast notifications per feedback
- Loading states per operazioni async

### E. Immagini

**Hero Homepage**: Grande immagine hero professionale con overlay gradiente e CTA con sfondo sfocato
**Sezioni Servizi**: Icone vettoriali e immagini di supporto
**Blog**: Immagini featured per articoli
**Chi Siamo**: Foto team e ufficio
**Landing Page**: Immagini specifiche per conversione con testimonial

## Implementazione Specifica

**Homepage**: Hero impattante, sezioni servizi, testimonial, CTA principale
**CMS Admin**: Dashboard pulita, editor WYSIWYG, gestione media centralizzata
**Blog**: Layout magazine con sidebar, categorie evidenti
**Landing Page**: Struttura a sezioni ottimizzata: pre-headline, headline, VSL, testimonianze, form candidatura
**SEO**: Meta description, title ottimizzati, structured data per articoli

**Responsive**: Mobile-first con breakpoint standard, touch-friendly su mobile
**Performance**: Lazy loading immagini, ottimizzazione bundle, CDN per asset statici