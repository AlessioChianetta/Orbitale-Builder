import { useState, useMemo, useEffect } from "react";
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  X, GripVertical, Type, Image as ImageIcon, Layout,
  Square, Sparkles, Users, CheckCircle, ArrowRight, Save, ChevronDown, Trash2, PlusCircle, Layers,
  AlertTriangle, Target, Shield, DollarSign, Star, Plus,
  Calendar, Briefcase, Grid, Quote, BarChart, Filter, Heart, MessageSquare, List, Award,
  BookOpen, Mail, Phone, HelpCircle, Headphones, Trophy, Zap, CalendarDays
} from "lucide-react";
import { BuilderPageRenderer } from "./BuilderPageRenderer";

// Empty drop zone for when no components exist
function EmptyDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div ref={setNodeRef} className="w-full max-w-2xl mx-auto">
      <Card className={`border-dashed border-2 ${isOver ? 'border-primary bg-primary/10 scale-105' : 'border-muted-foreground/20'} transition-all duration-200`}>
        <CardContent className="p-16 text-center">
          <div className={`p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4 ${isOver ? 'scale-110' : ''} transition-transform`}>
            <Layout className="h-16 w-16 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Inizia a Costruire</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Trascina i componenti dalla libreria a sinistra per iniziare a creare la tua pagina
          </p>
          {isOver && (
            <p className="text-primary font-medium mt-4 animate-pulse">
              Rilascia qui per aggiungere
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Tipi
interface ComponentData {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentData[];
}

interface BuilderPageFormData {
  title: string;
  slug: string;
  description: string;
  components: ComponentData[];
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
}

interface DragDropPageBuilderProps {
  pageToEdit?: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    components: ComponentData[];
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: string | null;
    isActive: boolean;
  };
  onClose: () => void;
}

// Tipi di componenti disponibili organizzati per categorie
const COMPONENT_TYPES = [
  // COMPONENTI DI LAYOUT
  {
    type: 'section',
    label: 'Sezione',
    icon: Layout,
    description: 'Contenitore principale per un\'area della pagina.',
    category: 'Layout'
  },
  {
    type: 'column',
    label: 'Colonna',
    icon: Square,
    description: 'Divide lo spazio orizzontale.',
    category: 'Layout'
  },
  {
    type: 'container',
    label: 'Contenitore',
    icon: Square,
    description: 'Un contenitore generico per contenuti.',
    category: 'Layout'
  },

  // WIDGET DI TESTO
  {
    type: 'heading',
    label: 'Intestazione',
    icon: Type,
    description: 'Titolo H1-H6.',
    category: 'Testo'
  },
  {
    type: 'text',
    label: 'Editor di Testo',
    icon: Type,
    description: 'Un blocco di testo formattato.',
    category: 'Testo'
  },

  // WIDGET MEDIA
  {
    type: 'image',
    label: 'Immagine',
    icon: ImageIcon,
    description: 'Un blocco immagine.',
    category: 'Media'
  },
  {
    type: 'video',
    label: 'Video',
    icon: ImageIcon,
    description: 'Incorpora video da YouTube/Vimeo.',
    category: 'Media'
  },

  // WIDGET INTERATTIVI
  {
    type: 'button',
    label: 'Pulsante',
    icon: ArrowRight,
    description: 'Un pulsante cliccabile.',
    category: 'Interattivo'
  },
  {
    type: 'form',
    label: 'Modulo',
    icon: CheckCircle,
    description: 'Un modulo di contatto.',
    category: 'Interattivo'
  },
  {
    type: 'map',
    label: 'Mappa',
    icon: Layout,
    description: 'Incorpora una mappa di Google.',
    category: 'Interattivo'
  },

  // WIDGET ELENCHI
  {
    type: 'icon-list',
    label: 'Elenco Icone',
    icon: CheckCircle,
    description: 'Un elenco con icone.',
    category: 'Elenchi'
  },
  {
    type: 'checklist',
    label: 'Lista di Controllo',
    icon: CheckCircle,
    description: 'Un elenco con segni di spunta.',
    category: 'Elenchi'
  },

  // WIDGET DI LAYOUT
  {
    type: 'spacer',
    label: 'Spaziatore',
    icon: Square,
    description: 'Spazio verticale vuoto.',
    category: 'Layout'
  },
  {
    type: 'divider',
    label: 'Divisore',
    icon: Square,
    description: 'Una linea di separazione orizzontale.',
    category: 'Layout'
  },

  // WIDGET DI NAVIGAZIONE
  {
    type: 'nav-menu',
    label: 'Menu di Navigazione',
    icon: Layout,
    description: 'Un menu di navigazione del sito.',
    category: 'Navigazione'
  },

  // WIDGET DI CONTENUTO
  {
    type: 'features',
    label: 'Caratteristiche',
    icon: Sparkles,
    description: 'Una griglia di caratteristiche.',
    category: 'Contenuto'
  },
  {
    type: 'testimonials',
    label: 'Testimonianze',
    icon: Users,
    description: 'Una sezione di testimonianze.',
    category: 'Contenuto'
  },
  {
    type: 'posts-grid',
    label: 'Griglia Articoli',
    icon: Layout,
    description: 'Una griglia di articoli del blog.',
    category: 'Contenuto'
  },




  // LEGACY (per compatibilità all'indietro)
  {
    type: 'hero',
    label: 'Sezione Hero',
    icon: Layout,
    description: 'Hero con titolo e CTA.',
    category: 'Modelli'
  },
  {
    type: 'cta',
    label: 'Call to Action',
    icon: ArrowRight,
    description: 'Una sezione CTA completa.',
    category: 'Modelli'
  },

  // COMPONENTI AVANZATI PATRIMONIO
  {
    type: 'value-stack',
    label: 'Value Stack',
    icon: Star,
    description: 'Componenti del pacchetto con valori.',
    category: 'Avanzati'
  },
  {
    type: 'method-phases',
    label: 'Metodo a 4 Fasi',
    icon: Target,
    description: 'Sistema strutturato con 4 fasi colorate.',
    category: 'Avanzati'
  },
  {
    type: 'problems-list',
    label: 'Lista Problemi',
    icon: AlertTriangle,
    description: 'Identifica i problemi comuni del target.',
    category: 'Avanzati'
  },
  {
    type: 'transparency-filter',
    label: 'Sezione Trasparenza',
    icon: Shield,
    description: 'Cosa facciamo vs cosa NON facciamo.',
    category: 'Avanzati'
  },

  // COMPONENTI RENDITA DIPENDENTE
  {
    type: 'vsl-hero-block',
    label: 'Hero VSL Video',
    icon: Layout,
    description: 'Hero con video VSL (Wistia/YouTube/Vimeo) e CTA.',
    category: 'Rendita Dipendente'
  },
  {
    type: 'problems-grid-rdp',
    label: 'Griglia Problemi RDP',
    icon: AlertTriangle,
    description: 'Griglia di problemi comuni con icone.',
    category: 'Rendita Dipendente'
  },
  {
    type: 'method-timeline-rdp',
    label: 'Timeline Metodo RDP',
    icon: Target,
    description: 'Timeline step-by-step del metodo.',
    category: 'Rendita Dipendente'
  },
  {
    type: 'offer-ecosystem',
    label: 'Ecosistema Offerta',
    icon: Star,
    description: 'Grid offerta con features e benefits.',
    category: 'Rendita Dipendente'
  },
  {
    type: 'requirements-compare',
    label: 'Confronto Requisiti',
    icon: Users,
    description: 'Confronto Chi Siamo vs Chi Non Siamo.',
    category: 'Rendita Dipendente'
  },
  {
    type: 'guarantee-cta-section',
    label: 'Garanzia + CTA',
    icon: Shield,
    description: 'Sezione garanzia con CTA finale.',
    category: 'Rendita Dipendente'
  },
  {
    type: 'lead-form-dialog',
    label: 'Form Cattura Lead',
    icon: Mail,
    description: 'Form per catturare lead con campi personalizzabili.',
    category: 'Rendita Dipendente'
  },
];

// Props predefinite per ogni tipo di componente
const DEFAULT_PROPS: Record<string, any> = {
  // COMPONENTI DI LAYOUT
  section: {
    backgroundColor: '',
    backgroundImage: '',
    paddingY: '64',
    paddingX: '16',
    minHeight: 'auto',
    maxWidth: '100%',
    borderRadius: 'none',
    border: 'none',
  },
  column: {
    width: '100%',
    backgroundColor: '',
    paddingY: '16',
    paddingX: '16',
    textAlign: 'left',
    verticalAlign: 'top',
    border: 'none',
    borderRadius: '0',
  },
  container: {
    padding: 'medium',
    backgroundColor: '',
    maxWidth: '1200px',
    margin: 'auto',
    containerId: '',
  },

  // WIDGET DI TESTO
  heading: {
    text: 'La Tua Intestazione Qui',
    tag: 'h2',
    size: '3xl',
    weight: 'bold',
    color: '#111827',
    textAlign: 'left',
    paddingY: '16',
    lineHeight: 'tight',
  },
  text: {
    content: 'Inserisci qui il tuo testo. Puoi formattarlo con grassetto, corsivo e altro.',
    fontSize: 'base',
    fontWeight: 'normal',
    color: '#4b5563',
    textAlign: 'left',
    paddingY: '16',
    backgroundColor: '',
  },

  // WIDGET MEDIA
  image: {
    src: '',
    alt: 'Immagine',
    width: '100%',
    borderRadius: 'lg',
    paddingY: '16',
  },
  video: {
    url: '',
    provider: 'youtube',
    aspectRatio: '16:9',
    autoplay: false,
    muted: true,
    controls: true,
    paddingY: '16',
  },

  // WIDGET INTERATTIVI
  button: {
    text: 'Clicca Qui',
    link: '#',
    variant: 'default',
    size: 'lg',
    width: 'auto',
    alignment: 'left',
    paddingY: '16',
    backgroundColor: '',
    textColor: '',
    borderRadius: 'md',
  },
  form: {
    title: 'Contattaci',
    fields: [
      { type: 'text', name: 'name', label: 'Nome', required: true },
      { type: 'email', name: 'email', label: 'Email', required: true },
      { type: 'textarea', name: 'message', label: 'Messaggio', required: true },
    ],
    submitText: 'Invia',
    paddingY: '32',
  },
  map: {
    address: 'Milano, Italia',
    height: '400px',
    paddingY: '16',
  },

  // WIDGET ELENCHI
  'icon-list': {
    items: [
      { icon: 'CheckCircle', text: 'Elemento 1', color: 'primary' },
      { icon: 'CheckCircle', text: 'Elemento 2', color: 'primary' },
      { icon: 'CheckCircle', text: 'Elemento 3', color: 'primary' },
    ],
    layout: 'vertical',
    spacing: 'medium',
    paddingY: '16',
  },
  checklist: {
    title: 'Cosa Ottieni',
    titleSize: '2xl',
    titleColor: '',
    items: ['Punto 1', 'Punto 2', 'Punto 3'],
    paddingY: '32',
    backgroundColor: '',
  },

  // WIDGET DI LAYOUT
  spacer: {
    height: '40',
    backgroundColor: 'transparent',
  },
  divider: {
    style: 'solid',
    width: '100%',
    thickness: '1',
    color: '#e5e7eb',
    spacing: '32',
  },

  // WIDGET DI NAVIGAZIONE
  'nav-menu': {
    items: [
      { label: 'Home', link: '/' },
      { label: 'Servizi', link: '/servizi' },
      { label: 'Chi Siamo', link: '/chi-siamo' },
      { label: 'Contatti', link: '/contatti' },
    ],
    layout: 'horizontal',
    alignment: 'left',
    backgroundColor: '',
    textColor: '',
    paddingY: '16',
  },

  // WIDGET DI CONTENUTO
  features: {
    title: 'Le Nostre Caratteristiche',
    titleSize: '3xl',
    titleColor: '',
    items: [
      { icon: 'CheckCircle', title: 'Caratteristica 1', description: 'Descrizione per la caratteristica 1' },
      { icon: 'CheckCircle', title: 'Caratteristica 2', description: 'Descrizione per la caratteristica 2' },
      { icon: 'CheckCircle', title: 'Caratteristica 3', description: 'Descrizione per la caratteristica 3' },
    ],
    backgroundColor: '',
    paddingY: '64',
  },
  testimonials: {
    title: 'Cosa Dicono i Nostri Clienti',
    items: [
      { name: 'Mario Rossi', role: 'CEO', text: 'Servizio eccellente!', image: '' },
    ],
    backgroundColor: 'muted/50',
    paddingY: '64',
  },
  'posts-grid': {
    title: 'Ultimi Articoli',
    titleSize: '3xl',
    postsToShow: 6,
    columns: 3,
    showExcerpt: true,
    showDate: false,
    showAuthor: false,
    paddingY: '64',
  },

  // COMPONENTI LEGACY
  hero: {
    title: 'Titolo Hero',
    titleSize: '4xl',
    titleColor: '',
    titleWeight: 'bold',
    subtitle: 'Sottotitolo per la sezione hero',
    subtitleSize: 'xl',
    subtitleColor: '',
    ctaText: 'Inizia Ora',
    ctaLink: '#',
    backgroundImage: '',
    backgroundColor: '',
    textAlign: 'center',
    paddingY: '80',
  },
  cta: {
    text: 'Call to Action',
    link: '#',
    variant: 'default',
    size: 'lg',
    textAlign: 'center',
    paddingY: '32',
  },

  // COMPONENTI AVANZATI PATRIMONIO
  'value-stack': {
    title: 'Non compri un corso.',
    highlightedTitle: 'Acquisisci un intero arsenale.',
    items: [
      {
        icon: '🖥️',
        title: 'La Piattaforma Software ORBITALE',
        value: '1.200€/anno',
        description: 'Il tuo centro di controllo. Un software proprietario per tracciare il Net Worth in tempo reale, gestire i 6 conti, monitorare gli investimenti.'
      },
      {
        icon: '📚',
        title: 'La Master Library Formativa Definitiva',
        value: '2.997€',
        description: 'La nostra enciclopedia della ricchezza personale. Oltre 17 categorie e decine di lezioni che coprono ogni aspetto.'
      },
      {
        icon: '👥',
        title: 'Coaching Esecutivo 1-a-1',
        value: '7.200€',
        description: 'Il nostro tempo dedicato a te. Sessioni strategiche dove non parliamo di teoria, ma agiamo nel tuo home banking, sul tuo broker.'
      },
      {
        icon: '🎯',
        title: 'Il Sistema di Accountability',
        value: 'Inestimabile',
        description: 'La vera arma segreta. Esercizi settimanali, revisioni personalizzate e una struttura che ti impedisce di procrastinare.'
      }
    ],
    totalValue: '12.894€',
    investment: 'VEDI I PIANI',
    backgroundColor: '#f1f5f9',
    paddingY: '64',
  },
  'method-phases': {
    title: 'Il Metodo ORBITALE: Sistema a 4 fasi',
    phases: [
      {
        phase: 'Fase 1',
        icon: '🛡️',
        gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
        borderColor: 'linear-gradient(to bottom, #ef4444, #f97316)',
        title: 'LIBERAZIONE: Uscita dai Debiti',
        description: 'Attraverso il nostro metodo "Effetto Valanga", creiamo un piano d\'attacco chirurgico per eliminare i debiti che soffocano il tuo cash flow.',
        transformation: 'Da indebitato a liquido'
      },
      {
        phase: 'Fase 2',
        icon: '🐷',
        gradient: 'linear-gradient(135deg, #f97316, #eab308)',
        borderColor: 'linear-gradient(to bottom, #f97316, #eab308)',
        title: 'ACCUMULO: Sistema di Risparmio',
        description: 'Installiamo il nostro sistema proprietario dei "6 Conti Intelligenti". Automatizziamo il processo di risparmio, costringendoti a "pagare prima te stesso".',
        transformation: 'Da disorganizzato a macchina da risparmio'
      },
      {
        phase: 'Fase 3',
        icon: '📈',
        gradient: 'linear-gradient(135deg, #eab308, #22c55e)',
        borderColor: 'linear-gradient(to bottom, #eab308, #22c55e)',
        title: 'MOLTIPLICAZIONE: Investimenti Sicuri',
        description: 'Ti guidiamo a implementare una strategia basata su strumenti semplici, a basso costo e storicamente solidi (ETF, Oro, etc.). Solo crescita costante e prevedibile.',
        transformation: 'Da risparmiatore a investitore strategico'
      },
      {
        phase: 'Fase 4',
        icon: '🚀',
        gradient: 'linear-gradient(135deg, #22c55e, #3b82f6)',
        borderColor: 'linear-gradient(to bottom, #22c55e, #3b82f6)',
        title: 'STABILITÀ: Patrimonio che Genera Rendita',
        description: 'Il tuo capitale genera un flusso di reddito passivo che può coprire le tue spese. Non sei più dipendente dal tuo lavoro per vivere.',
        transformation: 'Da dipendente del lavoro a padrone del patrimonio'
      }
    ],
    backgroundColor: 'white',
    paddingY: '80',
  },
  'problems-list': {
    title: 'Se lavori sodo ma il tuo patrimonio è fermo, la colpa non è tua',
    subtitle: 'Probabilmente, la tua situazione finanziaria assomiglia a una di queste.',
    problems: [
      {
        icon: '⚠️',
        title: 'L\'Ansia da Estratto Conto',
        description: 'Lavori 10 ore al giorno, generi un buon reddito, ma a fine mese ti chiedi dove siano finiti i soldi. Il tuo conto corrente è un campo di battaglia tra entrate e uscite impreviste.'
      },
      {
        icon: '🏢',
        title: 'La Prigione dei Debiti "Buoni"',
        description: 'Ti hanno detto che il mutuo o il finanziamento per l\'auto sono "investimenti". La realtà è che ogni mese una fetta enorme del tuo reddito se ne va per ripagare il passato.'
      },
      {
        icon: '📊',
        title: 'La Paralisi da Investimento',
        description: 'Sai che dovresti investire, che l\'inflazione sta divorando i tuoi risparmi. Ma il mondo della finanza ti sembra un casinò truccato.'
      },
      {
        icon: '🎯',
        title: 'La Ruota del Criceto',
        description: 'Sei intrappolato in un ciclo senza fine. Lavori di più per guadagnare di più, ma più guadagni più spendi. Il tuo stile di vita cresce, ma il tuo patrimonio rimane immobile.'
      }
    ],
    backgroundColor: '#f8fafc',
    paddingY: 80,
  },
  'transparency-filter': {
    badge: '🎯 TRASPARENZA TOTALE',
    title: 'Prima di continuare, lascia che sia brutalmente onesto su chi siamo',
    weDoTitle: 'Quello che facciamo:',
    weDoItems: [
      { text: 'Ti guidiamo a costruire un patrimonio reale di almeno centomila euro in due-quattro anni' },
      { text: 'Generiamo una rendita stabile di almeno duemila euro al mese' },
      { text: 'Aiutiamo chi si trova soffocato dai debiti ad uscirne con il nostro metodo esclusivo' },
      { text: 'Lavoriamo solo con persone davvero determinate a cambiare vita' }
    ],
    weDontTitle: 'Quello che NON facciamo:',
    weDontItems: [
      { text: 'Non lavoriamo con clienti che non sono pronti a impegnarsi fino in fondo' },
      { text: 'Non promettiamo scorciatoie o formule magiche' },
      { text: 'Non offriamo consulenze a basso costo - siamo un percorso esclusivo' },
      { text: 'Non garantiamo miracoli senza sforzo - il tuo impegno è parte del processo' }
    ],
    backgroundColor: '#f1f5f9',
    paddingY: '80',
  },

  // COMPONENTI RENDITA DIPENDENTE
  'vsl-hero-block': {
    topHeadline: 'ESCLUSIVO PER DIPENDENTI, PROFESSIONISTI E TECNICI',
    urgencyBadge: '⚠️ CANDIDATURA LIMITATA - SOLO 50 POSTI DISPONIBILI',
    titlePrefix: 'RIVELATO:',
    title: 'Il Sistema',
    highlightedTitle: '"ACCELERATORE DI BUSINESS REMOTO"',
    titleSuffix: 'che Trasforma il Tuo Lavoro Dipendente in una FONTE DI RICCHEZZA',
    titleSuffix2: '',
    subtitlePart1: '+ Il Metodo',
    subtitleHighlight: '"LIBERTÀ FINANZIARIA 2K"',
    subtitlePart2: 'per Generare €2.000+ di Rendita Passiva al Mese',
    subtitlePart3: 'e almeno 100.000 / 500.000 euro di patrimonio personale in pochi anni',
    videoUrl: '',
    videoProvider: 'wistia',
    ctaType: 'link',
    ctaText: 'CANDIDATI ORA PER L\'ECOSISTEMA COMPLETO!',
    ctaLink: '#',
    urgencyNote: '⏰ Attenzione: Solo 50 candidature accettate questo mese',
    theme: 'dark',
    paddingY: 80
  },
  'problems-grid-rdp': {
    title: 'I Problemi che Affronti Ogni Giorno',
    problems: [
      {
        icon: '💰',
        title: 'Stipendio Bloccato',
        description: 'Il tuo stipendio è fermo da anni, ma le spese continuano ad aumentare.'
      },
      {
        icon: '⏰',
        title: 'Niente Tempo Libero',
        description: 'Lavori 8-10 ore al giorno, ma non hai mai tempo per te stesso o la famiglia.'
      },
      {
        icon: '😰',
        title: 'Ansia per il Futuro',
        description: 'Non hai una strategia chiara per costruire sicurezza finanziaria.'
      },
      {
        icon: '🔒',
        title: 'Dipendenza dal Lavoro',
        description: 'Sei completamente dipendente dal tuo stipendio mensile.'
      }
    ],
    backgroundColor: '#1e293b',
    titleColor: '#ffffff',
    textColor: '#e2e8f0',
    paddingY: '80',
  },
  'method-timeline-rdp': {
    title: 'Come Funziona il Metodo',
    subtitle: 'Un percorso step-by-step per costruire la tua libertà finanziaria',
    steps: [
      {
        number: '01',
        title: 'Analisi Situazione',
        description: 'Valutiamo la tua situazione attuale e identifichiamo opportunità nascoste.'
      },
      {
        number: '02',
        title: 'Strategia Personalizzata',
        description: 'Creiamo un piano su misura per generare il tuo primo business remoto.'
      },
      {
        number: '03',
        title: 'Implementazione',
        description: 'Ti guidiamo passo-passo nell\'implementazione del sistema.'
      },
      {
        number: '04',
        title: 'Ottimizzazione',
        description: 'Ottimizziamo e scaliamo per raggiungere €2.000+ di rendita mensile.'
      }
    ],
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    paddingY: '80',
  },
  'offer-ecosystem': {
    title: 'L\'Ecosistema Completo che Ti Offro',
    items: [
      {
        icon: '💼',
        title: 'ACCELERATORE DI BUSINESS REMOTO',
        features: [
          'Sistema "Idea da 2K al Mese"',
          'Generatore di Clienti Remoto',
          'Pilota Automatico del Business',
          'Setup guidato personalizzato',
          'Piano 90 giorni su misura'
        ]
      },
      {
        icon: '💰',
        title: 'ACCELERATORE DI PATRIMONIO',
        features: [
          'Formula "Dipendente Ricco"',
          '12 consulenze individuali dedicate',
          'Software proprietario pianificazione',
          'Accademia "Dipendente Investitore"',
          'Simulatori crescita patrimoniale'
        ]
      }
    ],
    totalValue: '€12.000',
    backgroundColor: '#1e293b',
    titleColor: '#ffffff',
    textColor: '#e2e8f0',
    paddingY: '80',
  },
  'requirements-compare': {
    title: 'Requisiti per Potersi Candidare',
    subtitle: 'Prima di parlare di come candidarsi, è importante che sia chiarissimo CHI SIAMO e CHI NON SIAMO.',
    workWithTitle: '✅ LAVORIAMO CON CHI:',
    workWithItems: [
      'È davvero determinato a cambiare vita finanziaria',
      'Ha esperienza lavorativa come dipendente o professionista',
      'È disposto a impegnarsi fino in fondo nel percorso',
      'Vuole risultati concreti, non teorie',
      'È pronto a investire su se stesso',
      'Capisce il valore del supporto personalizzato'
    ],
    dontWorkWithTitle: '❌ NON LAVORIAMO CON CHI:',
    dontWorkWithItems: [
      'Vuole solo "provare" o curiosare',
      'Cerca scorciatoie o formule magiche',
      'Non è disposto a seguire le indicazioni',
      'Cerca scuse invece di agire',
      'Non ha serietà nell\'approccio al cambiamento'
    ],
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    paddingY: '80',
  },
  'guarantee-cta-section': {
    badge: '🛡️ GARANZIA BLINDATA',
    title: 'GARANZIA "RISCHIO ZERO" 30 GIORNI',
    description: 'Entri nel sistema, partecipi alle prime sessioni di setup del business e di pianificazione patrimoniale, segui le nostre indicazioni per 30 giorni. Se alla fine del mese, per qualsiasi motivo, non sei assolutamente entusiasta dei primi passi fatti e della chiarezza del tuo piano... ti rimborsiamo l\'INTERO investimento fino all\'ultimo centesimo!',
    guarantee: 'Nessuna domanda. Il rischio è tutto sulle MIE spalle. Non hai letteralmente NULLA da perdere!',
    ctaText: '🔥 VOGLIO CANDIDARMI PER OTTENERE LA TUA CONSULENZA!',
    ctaLink: '#',
    limitedSpots: '⚠️ SOLO 50 CANDIDATURE ACCETTATE',
    backgroundColor: 'linear-gradient(to bottom, #1e40af, #1e3a8a)',
    textColor: '#ffffff',
    paddingY: '80',
  },
  'lead-form-dialog': {
    title: 'Candidati per l\'Ecosistema Completo',
    subtitle: 'Compila il form per candidarti. Ti ricontatteremo entro 24h.',
    fields: [
      { name: 'businessName', label: 'Nome Attività/Professione', type: 'text', required: true },
      { name: 'firstName', label: 'Nome', type: 'text', required: true },
      { name: 'lastName', label: 'Cognome', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Telefono', type: 'tel', required: true }
    ],
    submitText: 'INVIA CANDIDATURA',
    apiEndpoint: '/api/marketing/leads',
    source: 'optin-rendita-dipendente',
    campaign: 'Rendita Dipendente - Libertà Finanziaria 2K',
    redirectUrl: '/optin/rendita-dipendente/success',
    backgroundColor: '#ffffff',
    paddingY: '32',
  },

  // --- NEW COMPONENT ADDED: 'project-detail-card' ---
  'project-detail-card': {
    projectId: null,
    showBackButton: true,
    backgroundColor: '#ffffff',
    paddingY: '80'
  },
  // --- END NEW COMPONENT ---
};

const ELEMENTI_PREDEFINITI = [
    // --- Categoria Blocchi Avanzati (Patrimonio Style) ---
    {
        key: 'hero-patrimonio',
        label: 'Hero Patrimonio',
        icon: Layout,
        description: 'Hero completo con badge, titolo principale evidenziato, sottotitolo e disclaimer.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-hero`,
                type: 'hero-patrimonio',
                props: {
                    badge: '🎯 PER IMPRENDITORI AMBIZIOSI',
                    title: 'Non ti serve un lavoro in più.',
                    highlightedTitle: 'Ti serve un patrimonio che lavora al posto tuo.',
                    subtitle: 'Il sistema scientifico per imprenditori, professionisti e dipendenti determinati a costruire un patrimonio da 100.000€ a 500.000€ in 2-4 anni.',
                    ctaText: 'CANDIDATI PER UNA SESSIONE STRATEGICA',
                    ctaLink: '#',
                    disclaimer: '<strong>⚠️ Attenzione:</strong> Lavoriamo solo con persone proattive, pronte a seguire un metodo. Se cerchi formule magiche o non sei disposto a impegnarti, questo percorso non fa per te.',
                    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    textAlign: 'center',
                    titleSize: '5xl',
                    subtitleSize: 'xl',
                    titleWeight: 'bold',
                    titleColor: '#0f172a',
                    subtitleColor: '#64748b',
                    ctaBackgroundColor: '#ea580c',
                    ctaTextColor: '#ffffff',
                    disclaimerColor: '#64748b',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#1e40af',
                    paddingY: 96,
                    ctaSpacing: 32,
                    disclaimerSpacing: 16
                },
                children: []
            }
        ]
    },
    {
        key: 'hero-patrimonio-old',
        label: 'Hero Patrimonio (Old)',
        icon: Layout,
        description: '[DEPRECATO] Hero completo con struttura nidificata - usa Hero Patrimonio invece.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-hero`,
                type: 'section',
                props: {
                    ...DEFAULT_PROPS.section,
                    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    paddingY: '96'
                },
                children: [
                    {
                        id: `component-${Date.now()}-hero-content`,
                        type: 'container',
                        props: { ...DEFAULT_PROPS.container, maxWidth: '1024px' },
                        children: [
                            {
                                id: `component-${Date.now()}-hero-badge`,
                                type: 'text',
                                props: {
                                    ...DEFAULT_PROPS.text,
                                    content: '<div style="background: #dbeafe; color: #1e40af; padding: 8px 16px; border-radius: 9999px; display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 24px;">🎯 PER IMPRENDITORI AMBIZIOSI</div>',
                                    textAlign: 'center'
                                }
                            },
                            {
                                id: `component-${Date.now()}-hero-title`,
                                type: 'heading',
                                props: {
                                    ...DEFAULT_PROPS.heading,
                                    text: 'Non ti serve un lavoro in più. Ti serve un patrimonio che lavora al posto tuo.',
                                    tag: 'h1',
                                    size: '4xl',
                                    textAlign: 'center',
                                    paddingY: '24'
                                }
                            },
                            {
                                id: `component-${Date.now()}-hero-subtitle`,
                                type: 'text',
                                props: {
                                    ...DEFAULT_PROPS.text,
                                    content: 'Il sistema scientifico per imprenditori, professionisti e dipendenti determinati a costruire un patrimonio da 100.000€ a 500.000€ in 2-4 anni.',
                                    fontSize: 'xl',
                                    textAlign: 'center',
                                    paddingY: '16'
                                }
                            },
                            {
                                id: `component-${Date.now()}-hero-cta`,
                                type: 'button',
                                props: {
                                    ...DEFAULT_PROPS.button,
                                    text: 'CANDIDATI PER UNA SESSIONE STRATEGICA',
                                    size: 'lg',
                                    alignment: 'center',
                                    backgroundColor: '#ea580c',
                                    paddingY: '32'
                                }
                            },
                            {
                                id: `component-${Date.now()}-hero-disclaimer`,
                                type: 'text',
                                props: {
                                    ...DEFAULT_PROPS.text,
                                    content: '<p style="font-style: italic; color: #64748b; font-size: 14px;"><span style="color: #f59e0b;">⚠️</span> Attenzione: Lavoriamo solo con persone proattive, pronte a seguire un metodo.</p>',
                                    textAlign: 'center',
                                    paddingY: '16'
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        key: 'filter-transparency',
        label: 'Sezione Trasparenza',
        icon: Shield,
        description: 'Sezione "Quello che facciamo vs quello che NON facciamo".',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-filter`,
                type: 'transparency-filter',
                props: {
                    ...DEFAULT_PROPS['transparency-filter']
                }
            }
        ]
    },
    {
        key: 'problems-list',
        label: 'Lista Problemi',
        icon: AlertTriangle,
        description: 'Sezione che identifica i problemi comuni del target.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-problems`,
                type: 'problems-list',
                props: {
                    ...DEFAULT_PROPS['problems-list']
                }
            }
        ]
    },
    {
        key: 'method-4-phases',
        label: 'Metodo a 4 Fasi',
        icon: Target,
        description: 'Sistema strutturato con 4 fasi colorate e progressive.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-method`,
                type: 'method-phases',
                props: {
                    ...DEFAULT_PROPS['method-phases']
                }
            }
        ]
    },
    {
        key: 'value-stack-pricing',
        label: 'Value Stack + Prezzi',
        icon: DollarSign,
        description: 'Componenti del pacchetto con valori e prezzi finali.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-value`,
                type: 'value-stack',
                props: {
                    ...DEFAULT_PROPS['value-stack']
                }
            }
        ]
    },
    {
        key: 'pricing-two-plans',
        label: 'Pricing a Due Piani',
        icon: Star,
        description: 'Due piani di prezzo con quello consigliato evidenziato.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-pricing`,
                type: 'section',
                props: {
                    ...DEFAULT_PROPS.section,
                    backgroundColor: 'white',
                    paddingY: '80'
                },
                children: [
                    {
                        id: `component-${Date.now()}-pricing-content`,
                        type: 'container',
                        props: { ...DEFAULT_PROPS.container, maxWidth: '1024px' },
                        children: [
                            {
                                id: `component-${Date.now()}-pricing-title`,
                                type: 'heading',
                                props: {
                                    ...DEFAULT_PROPS.heading,
                                    text: 'Scegli il Percorso per la Tua Velocità di Crociera',
                                    tag: 'h2',
                                    size: '3xl',
                                    textAlign: 'center',
                                    paddingY: '24'
                                }
                            },
                            {
                                id: `component-${Date.now()}-pricing-plans`,
                                type: 'pricing-plans',
                                props: {
                                    title: 'Scegli il Tuo Percorso',
                                    plans: [
                                        {
                                            name: 'Percorso COSTRUTTORE',
                                            price: '297€ / mese',
                                            features: [
                                                '2 Sessioni Strategiche al mese',
                                                'Arsenale Completo (Software, Libreria, Template)',
                                                'Supporto via Piattaforma (Risposta in 2/4h)',
                                                'Canale di Supporto Diretto'
                                            ],
                                            ideal: 'Ideale per: Chi vuole costruire fondamenta solide con un affiancamento costante e strategico.',
                                            buttonText: 'INIZIA IL PERCORSO COSTRUTTORE',
                                            buttonLink: '#',
                                            recommended: false
                                        },
                                        {
                                            name: 'Percorso ACCELERATORE',
                                            price: '497€ / mese',
                                            features: [
                                                '4 Sessioni Strategiche al mese',
                                                'Arsenale Completo (Software, Libreria, Template)',
                                                'Supporto via Piattaforma (Risposta in 1h)',
                                                'Onboarding Intensivo (4 sessioni nel primo mese)',
                                                'Report Mensili Personalizzati'
                                            ],
                                            ideal: 'Ideale per: Chi vuole la massima velocità, il massimo supporto e la certezza assoluta di raggiungere il risultato nel minor tempo possibile.',
                                            buttonText: 'INIZIA IL PERCORSO ACCELERATORE',
                                            buttonLink: '#',
                                            recommended: true
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        key: 'fork-two-paths',
        label: 'Bivio delle Due Strade',
        icon: ArrowRight,
        description: 'Sezione che presenta due alternative opposte per spingere all\'azione.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-fork`,
                type: 'fork-roads',
                props: {
                    ...DEFAULT_PROPS.section,
                    badge: '⚠️ IL MOMENTO DECISIVO',
                    title: 'Sei arrivato al BIVIO DEFINITIVO',
                    subtitle: 'Oggi devi scegliere tra due strade completamente diverse. Non c\'è via di mezzo.',
                    ctaText: 'SCELGO LA STRADA #2: CANDIDATI ORA',
                    ctaLink: '#',
                    paddingY: '96'
                }
            }
        ]
    },
    // --- Categoria Blocchi Base ---
    {
        key: 'hero-standard',
        label: 'Banner Hero',
        icon: Layout,
        description: 'Un\'intestazione, un paragrafo e un pulsante.',
        category: 'Blocchi',
        components: [
            {
                type: 'hero',
                props: {
                    ...DEFAULT_PROPS.hero,
                    title: 'Costruisci il Tuo Futuro',
                    subtitle: 'Questo è un sottotitolo che spiega di più sulla sezione hero e il suo scopo.',
                    ctaText: 'Scopri di Più'
                }
            }
        ]
    },
    {
        key: 'features-3-col',
        label: 'Caratteristiche a 3 Colonne',
        icon: Sparkles,
        description: 'Un titolo di sezione e tre elementi caratteristici.',
        category: 'Blocchi',
        components: [
            {
                type: 'features',
                props: {
                    ...DEFAULT_PROPS.features,
                    title: 'Perché Sceglierci?',
                    items: [
                        { title: 'Team di Esperti', description: 'Il nostro team è composto da esperti del settore con anni di esperienza.' },
                        { title: 'Risultati Comprovati', description: 'Abbiamo una comprovata esperienza nel fornire risultati eccezionali per i nostri clienti.' },
                        { title: 'Supporto Clienti', description: 'Il nostro team di supporto è disponibile 24/7 per aiutarti con qualsiasi domanda.' },
                    ]
                }
            }
        ]
    },
    {
        key: 'testimonial-single',
        label: 'Blocco Testimonianza',
        icon: Users,
        description: 'Una testimonianza centrata con nome e ruolo.',
        category: 'Blocchi',
        components: [
            {
                type: 'testimonials',
                props: {
                    ...DEFAULT_PROPS.testimonials,
                    title: '',
                    items: [
                         { name: 'Anna Verdi', role: 'Direttore Marketing, ABC Corp', text: 'Lavorare con questo team ha cambiato le regole del gioco per la nostra attività. La loro competenza e dedizione sono ineguagliabili.'}
                    ]
                }
            }
        ]
    },
    {
        key: 'guarantee-shield',
        label: 'Garanzia con Shield',
        icon: Shield,
        description: 'Sezione garanzia con icona shield e sfondo colorato.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-guarantee`,
                type: 'section',
                props: {
                    ...DEFAULT_PROPS.section,
                    backgroundColor: '#f0fdf4',
                    paddingY: '80'
                },
                children: [
                    {
                        id: `component-${Date.now()}-guarantee-content`,
                        type: 'container',
                        props: { ...DEFAULT_PROPS.container, maxWidth: '1024px' },
                        children: [
                            {
                                id: `component-${Date.now()}-guarantee-card`,
                                type: 'guarantee-shield',
                                props: {
                                    title: 'La Nostra Garanzia',
                                    description: 'Siamo così sicuri della potenza del nostro sistema che mettiamo il rischio interamente sulle nostre spalle. Se dopo i primi 30 giorni, seguendo alla lettera il piano d\'azione iniziale e completando tutti gli esercizi assegnati, non sarai assolutamente convinto del valore e della direzione che abbiamo impostato, ti rimborsiamo l\'intero importo versato. Senza fare domande.',
                                    icon: '🛡️',
                                    iconColor: '#22c55e'
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    },
    // --- Categoria Pagine (Template completi) ---
    {
        key: 'pagina-lead-gen',
        label: 'Pagina Lead Generation',
        icon: Layers,
        description: 'Una pagina completa per la generazione di contatti.',
        category: 'Pagine',
        components: [
            {
                id: `component-${Date.now()}-1`,
                type: 'hero',
                props: {
                    ...DEFAULT_PROPS.hero,
                    title: 'Soluzioni Innovative per il Tuo Business',
                    subtitle: 'Aumenta la tua visibilità, ottimizza i processi e raggiungi nuovi clienti con le nostre strategie su misura.',
                    ctaText: 'Richiedi una Consulenza Gratuita',
                    ctaLink: '#contatti',
                    paddingY: '96',
                }
            },
            {
                id: `component-${Date.now()}-2`,
                type: 'features',
                props: {
                    ...DEFAULT_PROPS.features,
                    title: 'I Nostri Punti di Forza',
                    items: [
                        { title: 'Analisi Strategica', description: 'Analizziamo il tuo mercato per identificare le migliori opportunità di crescita.' },
                        { title: 'Tecnologia Avanzata', description: 'Utilizziamo gli strumenti più moderni per garantire risultati misurabili e performanti.' },
                        { title: 'Supporto Dedicato', description: 'Un team di esperti sempre al tuo fianco per guidarti in ogni fase del progetto.' },
                    ]
                }
            },
            {
                id: `component-${Date.now()}-3`,
                type: 'testimonials',
                props: {
                    ...DEFAULT_PROPS.testimonials,
                    title: 'Cosa Dicono di Noi',
                    items: [
                        { name: 'Luca Bianchi', role: 'Fondatore, Startup Innovativa', text: 'Hanno trasformato la nostra presenza online, portando un aumento del 200% nei lead qualificati in soli tre mesi.'}
                    ]
                }
            },
            {
                id: `component-${Date.now()}-4`,
                type: 'cta',
                props: {
                    ...DEFAULT_PROPS.cta,
                    text: 'Pronto a Iniziare? Contattaci Ora!',
                    link: '#contatti',
                    variant: 'default',
                    size: 'lg',
                    paddingY: '64'
                }
            }
        ]
    },
    {
        key: 'pagina-servizio',
        label: 'Pagina Servizio',
        icon: Layers,
        description: 'Un template per descrivere un servizio specifico.',
        category: 'Pagine',
        components: [
            {
                id: `component-${Date.now()}-5`,
                type: 'hero',
                props: {
                    ...DEFAULT_PROPS.hero,
                    title: 'Il Nostro Servizio di Punta',
                    subtitle: 'Una descrizione concisa ma potente del servizio offerto.',
                    backgroundImage: 'https://images.unsplash.com/photo-1553028826-f4806a3637b2?q=80&w=2070',
                    paddingY: '128',
                    textAlign: 'left'
                }
            },
            {
                id: `component-${Date.now()}-6`,
                type: 'text',
                props: {
                    ...DEFAULT_PROPS.text,
                    content: '<h1>Descrizione Dettagliata del Servizio</h1><p>Qui puoi approfondire tutti gli aspetti del servizio. Spiega i benefici, il processo e perché un cliente dovrebbe sceglierti. Puoi usare <strong>grassetto</strong>, <em>corsivo</em> e liste per rendere il testo più leggibile e accattivante. L\'obiettivo è fornire tutte le informazioni necessarie per convincere il visitatore.</p>',
                    paddingY: '64'
                }
            },
            {
                id: `component-${Date.now()}-7`,
                type: 'checklist',
                props: {
                    ...DEFAULT_PROPS.checklist,
                    title: 'Cosa Include il Pacchetto',
                    items: [
                        'Consulenza iniziale approfondita',
                        'Sviluppo personalizzato della strategia',
                        'Reportistica mensile dettagliata',
                        'Supporto prioritario via email e telefono'
                    ],
                    backgroundColor: 'muted/50'
                }
            },
            {
                id: `component-${Date.now()}-8`,
                type: 'form',
                props: {
                    ...DEFAULT_PROPS.form,
                    title: 'Richiedi Maggiori Informazioni',
                    submitText: 'Invia la Richiesta'
                }
            }
        ]
    },
    {
        key: 'candidatura-cta',
        label: 'Sezione Candidatura',
        icon: ArrowRight,
        description: 'Call-to-action per candidature con disclaimer.',
        category: 'Blocchi Avanzati',
        components: [
            {
                id: `component-${Date.now()}-candidatura`,
                type: 'candidature-cta',
                props: {
                    icon: 'ShieldCheck', // Nuova proprietà per l icona
                    title: 'Pronto a Costruire il Tuo Patrimonio?',
                    subtitle: 'Questa non è una semplice consulenza. È l\'inizio di un percorso di trasformazione che ti porterà a raggiungere la libertà finanziaria. Ma non è per tutti.',
                    ctaText: 'CANDIDATI PER LA SESSIONE STRATEGICA',
                    ctaLink: '#',
                    disclaimer: 'ATTENZIONE: Selezioniamo solo persone realmente motivate. Compilando il form ti candidi per una sessione conoscitiva. Non garantiamo accesso al percorso.',
                    backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
                    paddingY: 96
                }
            }
        ]
    },
    // --- HOMEPAGE BLOCKS ---
    {
        key: 'hero-home',
        label: 'Hero Homepage',
        icon: Layout,
        description: 'Hero principale con badge, titolo evidenziato, sottotitolo e video placeholder.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-hero-home`,
                type: 'hero-home',
                props: {
                    badge: '🚀 BENVENUTI',
                    badgeIcon: '✨',
                    title: 'Trasforma la Tua Visione',
                    highlightedTitle: 'in Realtà Concrete',
                    subtitle: 'Accompagniamo imprenditori e professionisti verso il successo con strategie personalizzate e risultati misurabili.',
                    showVideo: true,
                    ctaText: 'Inizia Ora',
                    ctaLink: '#',
                    ctaSubtext: 'Nessuna carta di credito richiesta',
                    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    titleColor: '#ffffff',
                    subtitleColor: '#f3f4f6',
                    ctaBackgroundColor: '#f59e0b',
                    ctaTextColor: '#ffffff',
                    paddingY: 120
                }
            }
        ]
    },
    {
        key: 'social-proof-logos',
        label: 'Social Proof Loghi',
        icon: Award,
        description: 'Barra con loghi di aziende/partner per credibilità.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-social-proof`,
                type: 'social-proof-logos',
                props: {
                    badge: 'SCELTI DA',
                    title: 'Più di 500 aziende si fidano di noi',
                    logos: [
                        { name: 'Google', url: 'https://via.placeholder.com/120x40?text=Google' },
                        { name: 'Microsoft', url: 'https://via.placeholder.com/120x40?text=Microsoft' },
                        { name: 'Amazon', url: 'https://via.placeholder.com/120x40?text=Amazon' },
                        { name: 'Meta', url: 'https://via.placeholder.com/120x40?text=Meta' }
                    ],
                    backgroundColor: '#f8fafc',
                    paddingY: 60
                }
            }
        ]
    },
    {
        key: 'stats-grid',
        label: 'Grid Statistiche',
        icon: BarChart,
        description: 'Grid con numeri impressionanti e relative etichette.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-stats`,
                type: 'stats-grid',
                props: {
                    title: 'I Nostri Numeri Parlano',
                    stats: [
                        { number: '10K+', label: 'Clienti Soddisfatti' },
                        { number: '500+', label: 'Progetti Completati' },
                        { number: '98%', label: 'Tasso di Successo' },
                        { number: '24/7', label: 'Supporto Disponibile' }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'problem-solution',
        label: 'Problema/Soluzione',
        icon: AlertTriangle,
        description: 'Confronto visivo tra problema e soluzione.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-problem-solution`,
                type: 'problem-solution',
                props: {
                    badge: 'LA SFIDA',
                    title: 'Da Problema a Opportunità',
                    subtitle: 'Trasformiamo le tue difficoltà in occasioni di crescita.',
                    problemTitle: 'Il Problema',
                    problems: [
                        { title: 'Processi inefficienti', description: 'I processi rallentano la produzione e creano colli di bottiglia' },
                        { title: 'Perdita di tempo', description: 'Troppe attività ripetitive sottraggono tempo alle priorità' },
                        { title: 'Risorse sprecate', description: 'Gli sprechi impediscono la crescita e riducono i margini' }
                    ],
                    solutionTitle: 'La Nostra Soluzione',
                    solutions: [
                        { title: 'Sistema automatizzato', description: 'Ottimizziamo ogni processo per massimizzare l\'efficienza' },
                        { title: 'Eliminazione sprechi', description: 'Identifichiamo e rimuoviamo tutte le inefficienze operative' },
                        { title: 'Massimizzazione produttività', description: 'Il tuo team potrà concentrarsi su ciò che conta davvero' }
                    ],
                    ctaText: 'Scopri come possiamo aiutarti',
                    ctaSubtext: 'Prenota una consulenza gratuita',
                    ctaLink: '/contatti',
                    backgroundColor: '#f8fafc',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'filter-section-home',
        label: 'Filtro Per Chi/Non Per Chi',
        icon: Filter,
        description: 'Sezione che qualifica i potenziali clienti.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-filter`,
                type: 'filter-section',
                props: {
                    badge: '🎯 TRASPARENZA',
                    title: 'È la Soluzione Giusta per Te?',
                    subtitle: 'Vogliamo essere chiari su chi possiamo aiutare meglio.',
                    forWhoTitle: 'Questo Servizio È PER TE se:',
                    forWhoItems: [
                        { text: 'Sei un imprenditore o professionista pronto a investire nel tuo futuro' },
                        { text: 'Vuoi risultati concreti e misurabili, non promesse vuote' },
                        { text: 'Sei disposto a seguire un metodo collaudato' }
                    ],
                    notForWhoTitle: 'NON È PER TE se:',
                    notForWhoItems: [
                        { text: 'Cerchi soluzioni magiche senza impegno' },
                        { text: 'Non sei pronto a investire tempo e risorse' },
                        { text: 'Preferisci rimanere nella tua zona di comfort' }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'testimonials-grid',
        label: 'Grid Testimonianze',
        icon: MessageSquare,
        description: 'Grid di testimonianze con rating e avatar.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-testimonials`,
                type: 'testimonials-grid',
                props: {
                    badge: 'RECENSIONI',
                    title: 'Cosa Dicono i Nostri Clienti',
                    subtitle: 'Migliaia di professionisti hanno già trasformato il loro business.',
                    testimonials: [
                        {
                            name: 'Marco Rossi',
                            role: 'CEO, TechStart SRL',
                            content: 'Incredibile! In soli 6 mesi abbiamo triplicato il fatturato. Il team è professionale e sempre disponibile.',
                            rating: 5,
                            avatar: 'MR'
                        },
                        {
                            name: 'Laura Bianchi',
                            role: 'Founder, Digital Agency',
                            content: 'La migliore decisione che abbiamo preso. Processi ottimizzati e risultati oltre ogni aspettativa.',
                            rating: 5,
                            avatar: 'LB'
                        },
                        {
                            name: 'Giuseppe Verdi',
                            role: 'Imprenditore',
                            content: 'Approccio pratico e concreto. Finalmente un servizio che mantiene le promesse.',
                            rating: 5,
                            avatar: 'GV'
                        }
                    ],
                    backgroundColor: '#f8fafc',
                    paddingY: 96
                }
            }
        ]
    },
    // --- CHI SIAMO BLOCKS ---
    {
        key: 'hero-chi-siamo',
        label: 'Hero Chi Siamo',
        icon: Heart,
        description: 'Hero semplice e centrato per pagina Chi Siamo.',
        category: 'Chi Siamo',
        components: [
            {
                id: `component-${Date.now()}-hero-chi-siamo`,
                type: 'hero-chi-siamo',
                props: {
                    badgeIcon: 'Heart',
                    badge: 'LA NOSTRA MISSIONE',
                    title: 'Costruiamo',
                    highlightedTitle: 'Sistemi di Crescita',
                    titleSuffix: ', non solo Campagne.',
                    subtitle: 'Aiutiamo le aziende ambiziose a liberarsi dalla dipendenza dalle agenzie tradizionali, implementando asset di marketing proprietari che generano clienti in modo prevedibile e scalabile.',
                    backgroundColor: 'linear-gradient(to-br, from-white via-blue-50/30 to-indigo-50/20)',
                    titleColor: '#0f172a',
                    subtitleColor: '#64748b',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#2563eb',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'values-grid',
        label: 'Grid Valori Aziendali',
        icon: Target,
        description: 'Grid con i valori fondamentali dell\'azienda.',
        category: 'Chi Siamo',
        components: [
            {
                id: `component-${Date.now()}-values`,
                type: 'values-grid',
                props: {
                    title: 'I Pilastri del Nostro Metodo',
                    subtitle: 'Ogni nostra azione si basa su questi quattro principi fondamentali che guidano il nostro approccio al business.',
                    values: [
                        {
                            icon: 'Target',
                            title: 'Orientati ai Risultati',
                            description: 'Ogni strategia è misurata sul ROI concreto per i nostri clienti. Non promettiamo, dimostriamo.',
                            color: 'blue'
                        },
                        {
                            icon: 'Lightbulb',
                            title: 'Innovazione Tecnologica',
                            description: 'Usiamo la logica ingegneristica per creare sistemi di marketing scientifici e replicabili.',
                            color: 'amber'
                        },
                        {
                            icon: 'Shield',
                            title: 'Trasparenza Totale',
                            description: 'Comunicazione chiara, report dettagliati e nessuna sorpresa. Il tuo successo è misurabile.',
                            color: 'emerald'
                        },
                        {
                            icon: 'Users',
                            title: 'Partnership Strategica',
                            description: 'Non siamo fornitori, siamo partner investiti nella tua crescita a lungo termine.',
                            color: 'purple'
                        }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'company-quote',
        label: 'Citazione Aziendale',
        icon: Quote,
        description: 'Citazione importante con autore.',
        category: 'Chi Siamo',
        components: [
            {
                id: `component-${Date.now()}-quote`,
                type: 'company-quote',
                props: {
                    quote: 'Il nostro obiettivo non è essere i vostri marketer. È rendervi così bravi nel marketing da non aver più bisogno di noi.',
                    author: 'Alessio Rossi',
                    authorTitle: 'Founder',
                    quoteIconSize: 64,
                    backgroundColor: 'linear-gradient(to-r, from-slate-900 via-slate-800 to-slate-900)',
                    overlayColor: 'linear-gradient(to-r, from-blue-900/20 to-indigo-900/20)',
                    quoteColor: '#ffffff',
                    authorColor: '#cbd5e1',
                    quoteIconColor: '#60a5fa',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'timeline-milestones',
        label: 'Timeline Pietre Miliari',
        icon: Calendar,
        description: 'Timeline con le tappe importanti dell\'azienda.',
        category: 'Chi Siamo',
        components: [
            {
                id: `component-${Date.now()}-timeline`,
                type: 'timeline-milestones',
                props: {
                    title: 'La Nostra Storia in Breve',
                    subtitle: 'Dal sogno iniziale alla realtà di oggi: ecco come abbiamo costruito un metodo che funziona davvero.',
                    milestones: [
                        {
                            year: '2019',
                            title: 'L\'Intuizione',
                            description: 'Nasce l\'idea di unire programmazione e marketing a risposta diretta per creare sistemi automatizzati.',
                            icon: 'Lightbulb'
                        },
                        {
                            year: '2021',
                            title: 'Primi 100 Clienti',
                            description: 'Raggiungiamo i primi 100 clienti con un tasso di successo del 98% e risultati misurabili.',
                            icon: 'Users'
                        },
                        {
                            year: '2023',
                            title: 'Lancio del Sistema',
                            description: 'Rilasciamo la nostra piattaforma proprietaria per la gestione automatizzata della crescita.',
                            icon: 'TrendingUp'
                        },
                        {
                            year: '2025',
                            title: 'Il Futuro',
                            description: 'La nostra missione è diventare il punto di riferimento in Italia per la crescita sistematica.',
                            icon: 'Award'
                        }
                    ],
                    backgroundColor: 'linear-gradient(to-br, from-slate-50 via-blue-50/30 to-indigo-50/20)',
                    timelineLineColor: 'linear-gradient(to-b, from-primary via-blue-500 to-indigo-600)',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'team-grid',
        label: 'Grid Team',
        icon: Users,
        description: 'Grid con foto e bio dei membri del team.',
        category: 'Chi Siamo',
        components: [
            {
                id: `component-${Date.now()}-team`,
                type: 'team-grid',
                props: {
                    title: 'Le Menti dietro il Sistema',
                    subtitle: 'Un team di specialisti ossessionati dai risultati e dalla crescita dei nostri partner. Conoscenza, esperienza e passione al servizio del tuo successo.',
                    team: [
                        {
                            name: 'Alessio Rossi',
                            title: 'Founder & Lead Strategist',
                            role: 'CEO',
                            bio: 'Unisce la logica ingegneristica del codice con i principi scientifici del marketing a risposta diretta.',
                            image: 'https://via.placeholder.com/500x500/3b82f6/ffffff?text=AR',
                            specialties: ['Marketing Strategy', 'Business Growth', 'Data Analytics']
                        },
                        {
                            name: 'Laura Bianchi',
                            title: 'Head of Operations',
                            role: 'COO',
                            bio: 'Organizza e ottimizza i processi per garantire che ogni progetto venga consegnato con la massima qualità.',
                            image: 'https://via.placeholder.com/500x500/10b981/ffffff?text=LB',
                            specialties: ['Project Management', 'Team Leadership', 'Process Optimization']
                        },
                        {
                            name: 'Marco Verdi',
                            title: 'Lead Developer',
                            role: 'CTO',
                            bio: 'Trasforma le strategie in piattaforme web performanti, scalabili e facili da gestire per i nostri clienti.',
                            image: 'https://via.placeholder.com/500x500/8b5cf6/ffffff?text=MV',
                            specialties: ['Full-Stack Development', 'System Architecture', 'DevOps']
                        },
                        {
                            name: 'Sofia Neri',
                            title: 'Senior Copywriter',
                            role: 'Creative Director',
                            bio: 'Specializzata nella scrittura di testi persuasivi che convertono i visitatori in clienti fedeli.',
                            image: 'https://via.placeholder.com/500x500/f59e0b/ffffff?text=SN',
                            specialties: ['Copywriting', 'Content Strategy', 'Brand Messaging']
                        }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    // --- SERVIZI BLOCKS ---
    {
        key: 'hero-servizi',
        label: 'Hero Servizi',
        icon: Briefcase,
        description: 'Hero per la pagina servizi con titolo evidenziato.',
        category: 'Servizi',
        components: [
            {
                id: `component-${Date.now()}-hero-servizi`,
                type: 'hero-servizi',
                props: {
                    badge: 'I Nostri Servizi',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#1d4ed8',
                    title: 'Un',
                    highlightedTitle: 'Sistema Completo',
                    titleSuffix: 'per la Tua Crescita',
                    subtitle: 'Non offriamo semplici servizi, ma costruiamo sistemi integrati che trasformano la tua presenza digitale in un motore di crescita prevedibile.',
                    backgroundColor: '#f8fafc',
                    titleColor: '#0f172a',
                    subtitleColor: '#64748b',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'services-cards',
        label: 'Card Servizi',
        icon: Grid,
        description: 'Grid di card con servizi dettagliati e prezzi.',
        category: 'Servizi',
        components: [
            {
                id: `component-${Date.now()}-services`,
                type: 'services-cards',
                props: {
                    title: 'I Nostri Servizi',
                    subtitle: 'Scegli la soluzione più adatta alle tue esigenze.',
                    services: [
                        {
                            icon: '💼',
                            title: 'Consulting Strategico',
                            description: 'Analisi approfondita e sviluppo di strategie personalizzate per raggiungere i tuoi obiettivi.',
                            features: [
                                { text: 'Analisi SWOT completa' },
                                { text: 'Piano strategico triennale' },
                                { text: '6 sessioni di follow-up' }
                            ],
                            price: '€2,500',
                            priceDescription: 'una tantum',
                            ctaText: 'Richiedi Info',
                            ctaLink: '#',
                            isPopular: false
                        },
                        {
                            icon: '🚀',
                            title: 'Acceleratore Business',
                            description: 'Programma intensivo per accelerare la crescita della tua azienda con supporto dedicato.',
                            features: [
                                { text: 'Tutto del Consulting' },
                                { text: 'Supporto settimanale' },
                                { text: 'Accesso community esclusiva' },
                                { text: 'Tools proprietari' }
                            ],
                            price: '€5,000',
                            priceDescription: 'per 6 mesi',
                            ctaText: 'Inizia Ora',
                            ctaLink: '#',
                            isPopular: true
                        },
                        {
                            icon: '🎓',
                            title: 'Formazione Team',
                            description: 'Workshop e training per potenziare le competenze del tuo team.',
                            features: [
                                { text: 'Workshop personalizzati' },
                                { text: 'Materiali didattici' },
                                { text: 'Certificazioni' }
                            ],
                            price: '€1,200',
                            priceDescription: 'per giornata',
                            ctaText: 'Scopri di Più',
                            ctaLink: '#',
                            isPopular: false
                        }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'process-steps',
        label: 'Step del Processo',
        icon: List,
        description: 'Timeline con step numerati del processo con colori gradient.',
        category: 'Servizi',
        components: [
            {
                id: `component-${Date.now()}-process`,
                type: 'process-steps',
                props: {
                    badge: 'Metodologia Comprovata',
                    badgeGradient: 'linear-gradient(to-r, from-blue-600 to-indigo-600)',
                    title: 'Il Nostro Processo',
                    highlightedTitle: 'Collaudato',
                    subtitle: 'Seguiamo un metodo in 4 fasi per garantire chiarezza, efficienza e risultati misurabili in ogni progetto.',
                    steps: [
                        {
                            number: '01',
                            title: 'Analisi e Strategia',
                            description: 'Analizziamo il tuo business e definiamo insieme la strategia più efficace per raggiungere i tuoi obiettivi.',
                            badgeText: 'Fase 01',
                            badgeColor: 'emerald',
                            circleGradient: 'from-emerald-500 to-emerald-600'
                        },
                        {
                            number: '02',
                            title: 'Progettazione e Sviluppo',
                            description: 'Creiamo e sviluppiamo gli asset digitali necessari, dal sito web alle campagne.',
                            badgeText: 'Fase 02',
                            badgeColor: 'blue',
                            circleGradient: 'from-blue-500 to-blue-600'
                        },
                        {
                            number: '03',
                            title: 'Lancio e Ottimizzazione',
                            description: 'Lanciamo il progetto e monitoriamo i dati per ottimizzare le performance in tempo reale.',
                            badgeText: 'Fase 03',
                            badgeColor: 'purple',
                            circleGradient: 'from-purple-500 to-purple-600'
                        },
                        {
                            number: '04',
                            title: 'Scaling',
                            description: 'Una volta validato il sistema, lo scaliamo per massimizzare il ritorno sull\'investimento.',
                            badgeText: 'Fase 04',
                            badgeColor: 'orange',
                            circleGradient: 'from-orange-500 to-orange-600'
                        }
                    ],
                    backgroundColor: 'linear-gradient(to-br, from-slate-50 via-blue-50/30 to-slate-50)',
                    timelineGradient: 'linear-gradient(to-b, from-blue-500 via-indigo-500 to-blue-600)',
                    paddingY: 96
                }
            }
        ]
    },
    // --- PROGETTI BLOCKS ---
    {
        key: 'project-detail-card',
        label: 'Dettaglio Progetto (DB)',
        icon: Briefcase,
        description: 'Card di dettaglio progetto dinamica - mostra automaticamente il progetto in base allo slug URL.',
        category: 'I miei progetti',
        components: [
            {
                id: `component-${Date.now()}-project-detail`,
                type: 'project-detail-card',
                props: {
                    showBackButton: true,
                    backgroundColor: '#ffffff',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'hero-progetti',
        label: 'Hero Progetti',
        icon: Briefcase,
        description: 'Hero per la pagina progetti con badge, stats e search.',
        category: 'I miei progetti',
        components: [
            {
                id: `component-${Date.now()}-hero-progetti`,
                type: 'hero-progetti',
                props: {
                    badgeIcon: 'Trophy',
                    badge: 'Portfolio Progetti',
                    title: 'I Miei',
                    highlightedTitle: 'Progetti',
                    subtitle: 'Scopri i progetti e le partnership che hanno trasformato il business dei nostri clienti. Ogni progetto racconta una storia di successo, innovazione e crescita digitale.',
                    stats: [
                        { icon: 'Trophy', label: 'Progetti Completati', value: 0 },
                        { icon: 'Star', label: 'In Evidenza', value: 0 }
                    ],
                    showSearch: true,
                    searchPlaceholder: 'Cerca progetti...',
                    backgroundColor: 'linear-gradient(to-r, from-primary/5 via-transparent to-accent/5)',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#2563eb',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'projects-grid',
        label: 'Grid Progetti (DB)',
        icon: Grid,
        description: 'Grid dinamica di progetti integrata con database.',
        category: 'I miei progetti',
        components: [
            {
                id: `component-${Date.now()}-projects`,
                type: 'projects-grid',
                props: {
                    defaultTab: 'all',
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    // --- BLOG BLOCKS ---
    {
        key: 'hero-blog',
        label: 'Hero Blog',
        icon: BookOpen,
        description: 'Hero per la pagina blog con search e filtri categorie.',
        category: 'Blog',
        components: [
            {
                id: `component-${Date.now()}-hero-blog`,
                type: 'hero-blog',
                props: {
                    badge: 'Il Nostro Blog',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#2563eb',
                    title: 'Insights e Strategie per il',
                    highlightedTitle: 'Successo Digitale',
                    subtitle: 'Guide pratiche, case study e le ultime tendenze del marketing digitale per far crescere il tuo business.',
                    showSearch: true,
                    searchPlaceholder: 'Cerca articoli, argomenti...',
                    showCategoryFilters: true,
                    backgroundColor: 'linear-gradient(to-r, from-primary/5 via-transparent to-accent/5)',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'blog-posts-grid',
        label: 'Grid Blog Posts (DB)',
        icon: Grid,
        description: 'Grid dinamica di articoli blog integrata con database.',
        category: 'Blog',
        components: [
            {
                id: `component-${Date.now()}-blog`,
                type: 'blog-posts-grid',
                props: {
                    showFeatured: true,
                    featuredColumns: 2,
                    postsColumns: 3,
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'blog-section-complete',
        label: 'Sezione Blog Completa',
        icon: BookOpen,
        description: 'Hero con filtri e griglia articoli con post in evidenza.',
        category: 'Blog',
        components: [
            {
                id: `component-${Date.now()}-hero-blog`,
                type: 'hero-blog',
                props: {
                    ...DEFAULT_PROPS['hero-blog'],
                }
            },
            {
                id: `component-${Date.now()}-blog-grid`,
                type: 'blog-posts-grid',
                props: {
                    ...DEFAULT_PROPS['blog-posts-grid'],
                    title: '',
                }
            }
        ]
    },
    {
        key: 'expert-profile-card',
        label: 'Expert Profile Card',
        icon: Users,
        description: 'Card con immagine esperto e descrizione professionale.',
        category: 'Homepage',
        components: [
            {
                id: `component-${Date.now()}-expert`,
                type: 'expert-profile-card',
                props: {
                    image: '/attached_assets/image_1759612238064.png',
                    title: 'Marco Massi, maestro pasticcere e lievitista',
                    subtitles: [
                        '- Giudice al Concorso "Miglior colomba d\'Italia" FIPGC 2024',
                        '- Giudice al Campionato mondiale per il "Miglior panettone al mondo 2023"'
                    ],
                    description: 'Sensibilità e conoscenza tecnica, mente e cuore danno vita a creazioni che uniscono sapori e profumi del <strong>territorio marchigiano</strong>, attraverso l\'esperienza di Marco Massi che in questa terra è poi cresciuto e poi coltivato il suo amore per <strong>i piccoli e i grandi lievitati</strong>.<br/><br/>Le sue <strong>creazioni</strong> prendono vita dopo un ciclo produttivo di più giorni per regalare esperienze di gusto sopraffine.<br/><br/>Assaporare le creazioni di Marco Massi o il particolare Camomillo, significa gustare ed apprezzare <strong>l\'artigianità, l\'eccellenza</strong> degli ingredienti, i sapori della <strong>tradizione</strong>. Si tratta di mettere in pratica tecnica e creatività, precisione ed estro, oltre alla scelta delle materie prime e la cura di ogni singolo dettaglio.',
                    ctaText: 'CHI SONO',
                    ctaLink: '/chi-siamo',
                    backgroundColor: '#ffffff',
                    paddingY: 96
                }
            }
        ]
    },
    // --- CONTATTI BLOCKS ---
    {
        key: 'hero-contatti',
        label: 'Hero Contatti',
        icon: Mail,
        description: 'Hero per la pagina contatti.',
        category: 'Contatti',
        components: [
            {
                id: `component-${Date.now()}-hero-contatti`,
                type: 'hero-contatti',
                props: {
                    badge: 'Contattaci',
                    title: 'Parliamo del tuo Progetto.',
                    subtitle: 'Siamo pronti ad ascoltare le tue idee e a trasformarle in un successo digitale. Inizia oggi con una consulenza gratuita e senza impegno.',
                    backgroundColor: '#f8fafc',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#1d4ed8',
                    titleColor: '#0f172a',
                    subtitleColor: '#64748b',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'benefits-grid-contatti',
        label: 'Grid Benefici',
        icon: CheckCircle,
        description: 'Grid con benefici/vantaggi del servizio.',
        category: 'Contatti',
        components: [
            {
                id: `component-${Date.now()}-benefits`,
                type: 'benefits-grid',
                props: {
                    benefits: [
                        {
                            icon: 'CheckCircle',
                            title: 'Consulenza Gratuita',
                            description: 'Prima consulenza sempre gratuita e senza impegno'
                        },
                        {
                            icon: 'Headphones',
                            title: 'Supporto Dedicato',
                            description: 'Account manager dedicato per tutto il progetto'
                        },
                        {
                            icon: 'Zap',
                            title: 'Risposta Rapida',
                            description: 'Risposta garantita entro 2 ore in orario lavorativo'
                        },
                        {
                            icon: 'Users',
                            title: 'Team Esperto',
                            description: 'Oltre 15 anni di esperienza nel settore digitale'
                        }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'contact-info',
        label: 'Info Contatto',
        icon: Phone,
        description: 'Sezione con informazioni di contatto (phone, email, address).',
        category: 'Contatti',
        components: [
            {
                id: `component-${Date.now()}-contact-info`,
                type: 'contact-info',
                props: {
                    title: 'Oppure, usa i nostri canali diretti:',
                    phone: '+39 02 1234 5678',
                    email: 'info@professionale.it',
                    address: 'Via Roma 123, 20121 Milano (MI)',
                    showOfficeHours: true,
                    officeHours: 'Lun-Ven: 9:00 - 18:00',
                    backgroundColor: '#f8fafc',
                    paddingY: 96
                }
            }
        ]
    },
    // --- FAQ BLOCKS ---
    {
        key: 'hero-faq',
        label: 'Hero FAQ',
        icon: HelpCircle,
        description: 'Hero per la pagina FAQ con search.',
        category: 'FAQ',
        components: [
            {
                id: `component-${Date.now()}-hero-faq`,
                type: 'hero-faq',
                props: {
                    badge: 'FAQ',
                    title: 'Domande Frequenti',
                    subtitle: 'Trova rapidamente le risposte alle domande più comuni sui nostri servizi, prezzi, tempistiche e modalità di lavoro.',
                    showSearch: true,
                    searchPlaceholder: 'Cerca nelle FAQ...',
                    backgroundColor: 'linear-gradient(to-br, from-primary/5 to-primary/10)',
                    badgeColor: '#dbeafe',
                    badgeTextColor: '#2563eb',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'popular-questions',
        label: 'Domande Popolari',
        icon: Star,
        description: 'Grid con le domande più frequenti.',
        category: 'FAQ',
        components: [
            {
                id: `component-${Date.now()}-popular-faq`,
                type: 'popular-questions',
                props: {
                    badge: 'Domande Popolari',
                    title: 'Le Risposte che Cerchi di Più',
                    subtitle: 'Le domande più frequenti dei nostri clienti con risposte dettagliate.',
                    limit: 4,
                    questions: [
                        {
                            question: 'Quali servizi offrite esattamente?',
                            answer: 'Offriamo una gamma completa di servizi digitali: consulenza strategica, sviluppo web, marketing digitale e molto altro.'
                        },
                        {
                            question: 'Quanto tempo serve per vedere i primi risultati?',
                            answer: 'I tempi variano in base al servizio: per le campagne Google Ads vediamo risultati in 2-4 settimane.'
                        },
                        {
                            question: 'Quali sono i vostri prezzi?',
                            answer: 'I nostri prezzi partono da €299/mese per la consulenza strategica. Offriamo sempre preventivi personalizzati gratuiti.'
                        },
                        {
                            question: 'Lavorate anche con piccole aziende?',
                            answer: 'Assolutamente! Abbiamo soluzioni per ogni budget e dimensione aziendale, dalle startup alle grandi corporate.'
                        }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 80
                }
            }
        ]
    },
    {
        key: 'faq-list',
        label: 'Lista FAQ',
        icon: List,
        description: 'Lista completa di FAQ con categorie e accordion.',
        category: 'FAQ',
        components: [
            {
                id: `component-${Date.now()}-faq-list`,
                type: 'faq-list',
                props: {
                    title: 'Tutte le Domande',
                    subtitle: '',
                    showCategories: true,
                    faqs: [
                        {
                            category: 'Servizi',
                            question: 'Quali servizi offrite esattamente?',
                            answer: 'Offriamo una gamma completa di servizi digitali: consulenza strategica, sviluppo web e CMS personalizzato, marketing digitale (Google Ads, Social Media, Email Marketing), SEO, e-commerce, applicazioni mobile, sicurezza web e formazione. Ogni servizio può essere personalizzato in base alle specifiche esigenze del tuo business.',
                            popular: true
                        },
                        {
                            category: 'Tempi',
                            question: 'Quanto tempo serve per vedere i primi risultati?',
                            answer: 'I tempi variano in base al servizio: per le campagne Google Ads vediamo risultati in 2-4 settimane, per il SEO servono tipicamente 3-6 mesi per risultati significativi, mentre per lo sviluppo web i tempi sono 4-8 settimane a seconda della complessità del progetto. Durante la consulenza iniziale ti forniremo un timeline dettagliato.',
                            popular: true
                        },
                        {
                            category: 'Prezzi',
                            question: 'Quali sono i vostri prezzi?',
                            answer: 'I nostri prezzi partono da €299/mese per la consulenza strategica, €899 per lo sviluppo completo (una tantum + hosting), e €599/mese per il marketing digitale. Offriamo sempre preventivi personalizzati gratuiti perché ogni progetto ha esigenze specifiche. La prima consulenza è sempre gratuita e senza impegno.',
                            popular: true
                        },
                        {
                            category: 'Servizi',
                            question: 'Offrite garanzie sui risultati?',
                            answer: 'Sì, offriamo garanzie specifiche per ogni servizio. Ad esempio, garantiamo un aumento delle conversioni del 20% entro 60 giorni per i progetti di ottimizzazione CRO, e un ROI minimo di 3:1 per le campagne pubblicitarie dopo il secondo mese. Ogni garanzia viene definita chiaramente nel contratto.',
                            popular: false
                        },
                        {
                            category: 'Servizi',
                            question: 'Lavorate anche con piccole aziende?',
                            answer: 'Assolutamente! Abbiamo soluzioni per ogni budget e dimensione aziendale, dalle startup alle grandi corporate. Il nostro approccio è sempre personalizzato e scalabile in base alle tue esigenze e possibilità economiche. Offriamo anche piani di pagamento flessibili per le piccole aziende.',
                            popular: true
                        },
                        {
                            category: 'Supporto',
                            question: 'Che tipo di supporto fornite dopo il lancio?',
                            answer: 'Forniamo supporto continuo attraverso diversi canali: supporto tecnico 24/7 per emergenze, aggiornamenti mensili gratuiti, backup automatici, monitoraggio delle performance, e un account manager dedicato. Offriamo anche pacchetti di manutenzione personalizzati in base alle tue esigenze.',
                            popular: false
                        },
                        {
                            category: 'Servizi',
                            question: 'Posso gestire il CMS autonomamente?',
                            answer: 'Sì, il nostro CMS è progettato per essere estremamente user-friendly. Anche senza competenze tecniche puoi gestire contenuti, pubblicare articoli, aggiornare pagine e monitorare le performance. Forniamo formazione completa (video tutorial + sessioni live) e supporto continuo per renderti completamente autonomo.',
                            popular: true
                        },
                        {
                            category: 'Prezzi',
                            question: 'Cosa include il servizio di manutenzione?',
                            answer: 'Il servizio di manutenzione include: backup automatici quotidiani, aggiornamenti di sicurezza, monitoraggio uptime 24/7, ottimizzazione performance, supporto tecnico, report mensili, e fino a 2 ore di modifiche minori. Abbiamo diversi piani di manutenzione per adattarci a ogni esigenza e budget.',
                            popular: false
                        },
                        {
                            category: 'Prezzi',
                            question: 'Ci sono costi nascosti?',
                            answer: 'No, la trasparenza è uno dei nostri valori fondamentali. Tutti i costi vengono comunicati chiaramente nel preventivo iniziale. Gli unici costi aggiuntivi possono derivare da richieste di modifiche sostanziali al progetto originale, che vengono sempre discusse e approvate prima dell\'implementazione.',
                            popular: false
                        },
                        {
                            category: 'Tempi',
                            question: 'Posso richiedere modifiche durante lo sviluppo?',
                            answer: 'Sì, il nostro processo prevede revisioni periodiche e la possibilità di modifiche. Includiamo fino a 3 round di revisioni gratuite in ogni progetto. Utilizziamo un approccio agile che ti permette di vedere i progressi e dare feedback durante tutto lo sviluppo, non solo alla fine.',
                            popular: false
                        },
                        {
                            category: 'Supporto',
                            question: 'Come funziona il processo di onboarding?',
                            answer: 'Il processo inizia con una consulenza gratuita per comprendere le tue esigenze. Poi definiamo insieme strategia e obiettivi, creiamo un project plan dettagliato, assegniamo il team e l\'account manager dedicato. Riceverai accesso a una dashboard per monitorare i progressi in tempo reale.',
                            popular: false
                        },
                        {
                            category: 'Prezzi',
                            question: 'Offrite sconti per contratti annuali?',
                            answer: 'Sì, offriamo sconti significativi per contratti annuali: 15% di sconto per contratti di 12 mesi e 20% per contratti di 24 mesi. Inoltre, per i clienti a lungo termine offriamo servizi aggiuntivi gratuiti come consulenze strategiche mensili e report avanzati.',
                            popular: false
                        },
                        {
                            category: 'Servizi',
                            question: 'Lavorate con aziende di tutti i settori?',
                            answer: 'Sì, abbiamo esperienza in diversi settori: e-commerce, servizi professionali, manifatturiero, immobiliare, sanitario, educativo e molti altri. Il nostro approccio metodologico si adatta a qualsiasi settore, mentre la strategia viene sempre personalizzata in base al mercato di riferimento.',
                            popular: false
                        },
                        {
                            category: 'Supporto',
                            question: 'Cosa succede se non sono soddisfatto dei risultati?',
                            answer: 'Offriamo una garanzia \'soddisfatti o rimborsati\' di 30 giorni per tutti i nostri servizi. Se non sei soddisfatto dei risultati, analizziamo insieme cosa non ha funzionato e, se necessario, procediamo con il rimborso totale. La tua soddisfazione è la nostra priorità assoluta.',
                            popular: false
                        },
                        {
                            category: 'Tempi',
                            question: 'Posso accelerare i tempi di sviluppo?',
                            answer: 'Sì, offriamo un servizio \'Fast Track\' che riduce i tempi di sviluppo del 40-50% dedicando un team espanso al tuo progetto. Questo servizio ha un costo aggiuntivo del 30% ma garantisce delivery più rapidi mantenendo la stessa qualità.',
                            popular: false
                        },
                        {
                            category: 'Prezzi',
                            question: 'I prezzi includono l\'hosting e il dominio?',
                            answer: 'Per il servizio di sviluppo completo, l\'hosting è incluso per il primo anno (valore €588). Il dominio è incluso solo se nuovo, altrimenti ti aiutiamo gratuitamente nel trasferimento. Dopo il primo anno, l\'hosting ha un costo di €49/mese che include backup, sicurezza, aggiornamenti e supporto.',
                            popular: false
                        },
                        {
                            category: 'Supporto',
                            question: 'Fornite formazione al mio team?',
                            answer: 'Sì, offriamo formazione completa e personalizzata per il tuo team. Include sessioni live, video tutorial, documentazione dettagliata e workshop pratici. La formazione base è inclusa in tutti i progetti, mentre per esigenze specifiche offriamo pacchetti formativi avanzati.',
                            popular: false
                        },
                        {
                            category: 'Servizi',
                            question: 'Gestite anche le campagne pubblicitarie esistenti?',
                            answer: 'Sì, possiamo prendere in gestione le tue campagne esistenti. Iniziamo sempre con un audit completo gratuito per identificare le aree di miglioramento, poi ottimizziamo gradualmente per massimizzare il ROI. Spesso riusciamo a ridurre i costi del 30-50% mantenendo o aumentando le conversioni.',
                            popular: false
                        },
                        {
                            category: 'Prezzi',
                            question: 'Come funzionano i pagamenti?',
                            answer: 'Accettiamo pagamenti con bonifico bancario, carta di credito e PayPal. Per progetti di sviluppo richiediamo un acconto del 50% all\'inizio e il saldo alla consegna. Per i servizi mensili, la fatturazione avviene in anticipo. Offriamo anche piani di pagamento personalizzati per progetti di grande entità.',
                            popular: false
                        },
                        {
                            category: 'Supporto',
                            question: 'Avete un supporto di emergenza?',
                            answer: 'Sì, offriamo supporto di emergenza 24/7 per i clienti con contratti di manutenzione Premium. Per situazioni critiche (sito down, attacchi hacker, etc.) interveniamo entro 30 minuti. Il servizio di emergenza ha un costo aggiuntivo ma garantisce la continuità del tuo business online.',
                            popular: false
                        },
                        {
                            category: 'Servizi',
                            question: 'Realizzate anche app mobile?',
                            answer: 'Sì, sviluppiamo app native per iOS e Android, oltre a Progressive Web App (PWA). Il nostro team ha esperienza con React Native, Flutter e sviluppo nativo. Offriamo anche servizi di pubblicazione sui store, manutenzione e aggiornamenti continui.',
                            popular: false
                        },
                        {
                            category: 'Tempi',
                            question: 'Quanto tempo serve per un restyling completo?',
                            answer: 'Un restyling completo richiede tipicamente 6-12 settimane, a seconda della complessità del sito e delle funzionalità richieste. Il processo include analisi dell\'esistente, nuovo design, sviluppo, migrazione contenuti, testing e ottimizzazione. Ti forniamo un timeline dettagliato durante la consulenza iniziale.',
                            popular: false
                        },
                        {
                            category: 'Supporto',
                            question: 'Posso cambiare piano in corso d\'opera?',
                            answer: 'Sì, puoi sempre fare upgrade o downgrade del tuo piano. Per gli upgrade, le nuove funzionalità vengono attivate immediatamente e paghi la differenza pro-rata. Per i downgrade, le modifiche vengono applicate al rinnovo successivo. Ti aiutiamo sempre a scegliere il piano più adatto alle tue esigenze attuali.',
                            popular: false
                        },
                        {
                            category: 'Prezzi',
                            question: 'Cosa include esattamente il servizio di manutenzione?',
                            answer: 'Il servizio di manutenzione include: backup automatici quotidiani, aggiornamenti di sicurezza, monitoraggio uptime 24/7, ottimizzazione performance, supporto tecnico, report mensili, e fino a 2 ore di modifiche minori. Abbiamo diversi piani di manutenzione per adattarci a ogni esigenza e budget.',
                            popular: false
                        },
                        {
                            category: 'Servizi',
                            question: 'Offrite consulenze one-shot?',
                            answer: 'Sì, offriamo consulenze singole di 2 ore a €299 per chi ha bisogno di consigli strategici specifici, audit del sito esistente, o validazione di un\'idea di business. La consulenza include un report dettagliato con raccomandazioni actionable che puoi implementare autonomamente o con il nostro supporto.',
                            popular: false
                        }
                    ],
                    backgroundColor: '#f8fafc',
                    paddingY: 96
                }
            }
        ]
    },
    {
        key: 'contact-support-grid',
        label: 'Grid Canali Supporto',
        icon: MessageSquare,
        description: 'Grid con canali di supporto (chat, phone, email).',
        category: 'FAQ',
        components: [
            {
                id: `component-${Date.now()}-support`,
                type: 'contact-support-grid',
                props: {
                    title: 'Non Hai Trovato la Risposta?',
                    subtitle: 'Il nostro team è sempre disponibile per rispondere alle tue domande specifiche.',
                    channels: [
                        {
                            icon: 'MessageCircle',
                            title: 'Chat Live',
                            description: 'Chatta direttamente con un esperto',
                            availability: 'Disponibile Lun-Ven 9:00-18:00',
                            ctaText: 'Inizia Chat',
                            ctaLink: 'https://wa.me/393351234567'
                        },
                        {
                            icon: 'Phone',
                            title: 'Chiamata Telefonica',
                            description: 'Parla direttamente con un consulente',
                            availability: '+39 02 1234 5678 - Lun-Ven 9:00-18:00',
                            ctaText: 'Chiama Ora',
                            ctaLink: 'tel:+390212345678'
                        },
                        {
                            icon: 'Mail',
                            title: 'Email Supporto',
                            description: 'Scrivi per domande dettagliate',
                            availability: 'info@professionale.it - Risposta entro 2 ore',
                            ctaText: 'Invia Email',
                            ctaLink: '/contatti'
                        }
                    ],
                    backgroundColor: '#ffffff',
                    paddingY: 80
                }
            }
        ]
    }
];

// Elemento Componente Ordinabile
function SortableComponent({ component, onEdit, onDelete }: {
  component: ComponentData;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const componentType = COMPONENT_TYPES.find(t => t.type === component.type);
  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className="hover-elevate">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </button>
              <div>
                <CardTitle className="text-sm font-medium">{componentType?.label || component.type}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {componentType?.description || 'Componente personalizzato'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(component.id)} data-testid={`button-edit-component-${component.id}`}>
                Modifica
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDelete(component.id)} data-testid={`button-delete-component-${component.id}`}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

// Elemento trascinabile dalla barra laterale della Libreria Componenti
function ComponentLibraryItem({ componentType }: { componentType: typeof COMPONENT_TYPES[0] }) {
  const Icon = componentType.icon;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `component-${componentType.type}`,
    data: { type: componentType.type, isBlock: false }
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <Card className={`cursor-grab active:cursor-grabbing hover-elevate transition-all ${isDragging ? 'opacity-50' : ''}`} data-testid={`library-item-${componentType.type}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{componentType.label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Elemento trascinabile dalla barra laterale della Libreria Blocchi
function BlockLibraryItem({ block }: { block: typeof ELEMENTI_PREDEFINITI[0] }) {
    const Icon = block.icon;
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `block-${block.key}`,
        data: { blockKey: block.key, isBlock: true }
    });
    return (
        <div ref={setNodeRef} {...attributes} {...listeners}>
            <Card className={`cursor-grab active:cursor-grabbing hover-elevate transition-all ${isDragging ? 'opacity-50' : ''}`}>
                <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/10">
                            <Icon className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{block.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{block.description}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- EDITOR PROPRIETÀ COMPONENTE ---

// Campo Ripetitore per la gestione di array di oggetti
function RepeaterField({ label, value = [], fields, onChange }: {
  label: string;
  value: any[];
  fields: any[];
  onChange: (newValue: any[]) => void;
}) {
  const handleItemChange = (index: number, key: string, itemValue: any) => {
    const newItems = [...value];
    newItems[index] = { ...newItems[index], [key]: itemValue };
    onChange(newItems);
  };

  const handleAddItem = () => {
    const newItem = fields.reduce((acc, field) => {
      acc[field.key] = field.defaultValue || '';
      return acc;
    }, {});
    onChange([...value, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-4 rounded-lg border p-4">
        {value.map((item, index) => (
          <div key={index} className="rounded border p-3 relative bg-background">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0"
              onClick={() => handleRemoveItem(index)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.key}>
                  <Label className="text-xs">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                      placeholder={field.label}
                      className="mt-1"
                      rows={3}
                    />
                  ) : field.type === 'number' ? (
                      <Input
                        type="number"
                        value={item[field.key] || ''}
                        onChange={(e) => handleItemChange(index, field.key, parseInt(e.target.value, 10))}
                        placeholder={field.label}
                        className="mt-1"
                      />
                  ) : field.type === 'list' ? (
                      <Textarea
                        value={Array.isArray(item[field.key]) ? item[field.key].join('\n') : ''}
                        onChange={(e) => handleItemChange(index, field.key, e.target.value.split('\n'))}
                        placeholder={field.label}
                        className="mt-1"
                        rows={3}
                      />
                   ) : (
                    <Input
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                      placeholder={field.label}
                      className="mt-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          Aggiungi {label}
        </Button>
      </div>
    </div>
  );
}

// Funzione principale per renderizzare un singolo campo in base alla sua configurazione
function renderField(fieldConfig: any, value: any, onUpdate: (newProps: any) => void) {
  const { key, type, label, options, min, max, step, fields, placeholder } = fieldConfig;
  const displayLabel = label || key.replace(/([A-Z])/g, ' $1').trim();
  const currentValue = value[key];

  switch (type) {
    case 'text':
      return (
        <div key={key} className="space-y-1">
          <Label className="text-sm font-medium">{displayLabel}</Label>
          <Input
            value={currentValue || ''}
            onChange={(e) => onUpdate({ [key]: e.target.value })}
            placeholder={`Inserisci ${displayLabel.toLowerCase()}`}
          />
        </div>
      );
    case 'color':
        return (
            <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <div className="flex items-center gap-2 border rounded-md pr-2">
                    <Input
                        type="text"
                        value={currentValue || ''}
                        onChange={(e) => onUpdate({ [key]: e.target.value })}
                        className="border-0"
                    />
                    <Input
                        type="color"
                        value={currentValue || '#ffffff'}
                        onChange={(e) => onUpdate({ [key]: e.target.value })}
                        className="h-6 w-6 p-0 border-0 bg-transparent"
                    />
                </div>
            </div>
        )
    case 'textarea':
      return (
        <div key={key} className="space-y-1">
          <Label className="text-sm font-medium">{displayLabel}</Label>
          <Textarea
            value={currentValue || ''}
            onChange={(e) => onUpdate({ [key]: e.target.value })}
            className="min-h-[100px]"
            placeholder={`Inserisci ${displayLabel.toLowerCase()}`}
          />
        </div>
      );
    case 'select':
      return (
        <div key={key} className="space-y-1">
          <Label className="text-sm font-medium">{displayLabel}</Label>
          <Select value={currentValue} onValueChange={(newValue) => onUpdate({ [key]: newValue })}>
            <SelectTrigger>
              <SelectValue placeholder={`Seleziona ${displayLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case 'slider':
        const numValue = parseInt(currentValue, 10);
        return (
        <div key={key} className="space-y-1">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">{displayLabel}</Label>
            <span className="text-sm text-muted-foreground">{!isNaN(numValue) ? numValue : (min || 0)}</span>
          </div>
          <Slider
            value={[!isNaN(numValue) ? numValue : (min || 0)]}
            onValueChange={(newValue) => onUpdate({ [key]: String(newValue[0]) })}
            min={min || 0}
            max={max || 100}
            step={step || 1}
          />
        </div>
      );
    case 'boolean':
        return (
            <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm font-medium">{displayLabel}</Label>
                <Switch
                    checked={currentValue || false}
                    onCheckedChange={(checked) => onUpdate({ [key]: checked })}
                />
            </div>
        )
    case 'repeater':
      return (
        <RepeaterField
          key={key}
          label={displayLabel}
          value={currentValue || []}
          fields={fields}
          onChange={(newValue) => onUpdate({ [key]: newValue })}
        />
      );
    case 'number':
        return (
            <div key={key} className="space-y-1">
                <Label className="text-sm font-medium">{displayLabel}</Label>
                <Input
                    type="number"
                    value={currentValue || ''}
                    onChange={(e) => onUpdate({ [key]: parseInt(e.target.value, 10) })}
                    placeholder={`Inserisci ${displayLabel.toLowerCase()}`}
                />
            </div>
        );
    case 'list':
        return (
            <div key={key} className="space-y-1">
                <Label className="text-sm font-medium">{displayLabel}</Label>
                <Textarea
                    value={Array.isArray(currentValue) ? currentValue.join('\n') : ''}
                    onChange={(e) => onUpdate({ [key]: e.target.value.split('\n') })}
                    placeholder={`Inserisci ogni elemento su una nuova riga`}
                    rows={3}
                />
            </div>
        );
    default:
      return null;
  }
}

// Configurazione completa per tutti i componenti
const COMPONENT_EDITOR_CONFIG: Record<string, any> = {
  // --- COMPONENTI DI BASE ---
  section: {
    style: [
        { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'},
        { key: 'backgroundImage', type: 'text', label: 'URL Immagine Sfondo'},
        { key: 'borderRadius', type: 'select', label: 'Raggio Bordo', options: [
             { value: 'none', label: 'Nessuno' }, { value: 'sm', label: 'Piccolo' },
             { value: 'md', label: 'Medio' }, { value: 'lg', label: 'Grande' },
             { value: 'xl', label: 'Extra Grande' }
        ]},
        { key: 'border', type: 'text', label: 'Bordo (es. 1px solid #ccc)'},
    ],
    layout: [
        { key: 'minHeight', type: 'text', label: 'Altezza Minima (es. 500px)'},
        { key: 'maxWidth', type: 'text', label: 'Larghezza Massima (es. 1280px)'},
    ],
    spacing: [
        { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4},
        { key: 'paddingX', type: 'slider', label: 'Padding Orizzontale', min: 0, max: 100, step: 2},
    ]
  },
  column: {
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'},
          { key: 'border', type: 'text', label: 'Bordo'},
          { key: 'borderRadius', type: 'text', label: 'Raggio Bordo (es. 8px)'},
      ],
      layout: [
          { key: 'width', type: 'text', label: 'Larghezza (es. 100%, 50%)'},
           { key: 'textAlign', type: 'select', label: 'Allineamento Testo', options: [
            { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }
          ]},
          { key: 'verticalAlign', type: 'select', label: 'Allineamento Verticale', options: [
            { value: 'top', label: 'Alto' }, { value: 'center', label: 'Centro' }, { value: 'bottom', label: 'Basso' }
          ]},
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2},
          { key: 'paddingX', type: 'slider', label: 'Padding Orizzontale', min: 0, max: 100, step: 2},
      ]
  },
  container: {
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
    ],
    layout: [
      { key: 'maxWidth', type: 'text', label: 'Larghezza Massima (es. 1200px)' },
      { key: 'margin', type: 'text', label: 'Margine (es. auto)' },
    ],
    spacing: [
      { key: 'padding', type: 'select', label: 'Padding Interno', options: [
        { value: 'none', label: 'Nessuno'}, { value: 'small', label: 'Piccolo'},
        { value: 'medium', label: 'Medio'}, { value: 'large', label: 'Grande'},
      ]},
    ]
  },
  heading: {
    content: [
      { key: 'text', type: 'textarea', label: 'Testo Intestazione' },
    ],
    style: [
      { key: 'tag', type: 'select', label: 'Tag HTML', options: [
        { value: 'h1', label: 'H1' }, { value: 'h2', label: 'H2' }, { value: 'h3', label: 'H3' },
        { value: 'h4', label: 'H4' }, { value: 'h5', label: 'H5' }, { value: 'h6', label: 'H6' }
      ]},
      { key: 'size', type: 'select', label: 'Dimensione', options: [
        { value: 'sm', label: 'Piccolo' }, { value: 'base', label: 'Base' }, { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'XL' }, { value: '2xl', label: '2XL' }, { value: '3xl', label: '3XL' },
        { value: '4xl', label: '4XL' }
      ]},
      { key: 'weight', type: 'select', label: 'Spessore', options: [
        { value: 'light', label: 'Leggero' }, { value: 'normal', label: 'Normale' },
        { value: 'medium', label: 'Medio' }, { value: 'semibold', label: 'Semigrassetto' },
        { value: 'bold', label: 'Grassetto' }
      ]},
      { key: 'textAlign', type: 'select', label: 'Allineamento', options: [
        { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' },
        { value: 'right', label: 'Destra' }
      ]},
      { key: 'color', type: 'color', label: 'Colore' },
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2 }
    ]
  },
  text: {
    content: [
      { key: 'content', type: 'textarea', label: 'Contenuto Testo' },
    ],
    style: [
      { key: 'fontSize', type: 'select', label: 'Dimensione Carattere', options: [
        { value: 'sm', label: 'Piccolo' }, { value: 'base', label: 'Base' }, { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'XL' }
      ]},
      { key: 'fontWeight', type: 'select', label: 'Spessore Carattere', options: [
        { value: 'light', label: 'Leggero' }, { value: 'normal', label: 'Normale' },
        { value: 'medium', label: 'Medio' }, { value: 'semibold', label: 'Semigrassetto' },
        { value: 'bold', label: 'Grassetto' }
      ]},
      { key: 'textAlign', type: 'select', label: 'Allineamento Testo', options: [
        { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' },
        { value: 'right', label: 'Destra' }
      ]},
      { key: 'color', type: 'color', label: 'Colore Testo' },
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2 }
    ]
  },
  image: {
    content: [
      { key: 'src', type: 'text', label: 'URL Immagine' },
      { key: 'alt', type: 'text', label: 'Testo Alternativo' },
    ],
    style: [
      { key: 'width', type: 'text', label: 'Larghezza (es. 100%, 300px)' },
      { key: 'borderRadius', type: 'select', label: 'Raggio Bordo', options: [
        { value: 'none', label: 'Nessuno' }, { value: 'sm', label: 'Piccolo' },
        { value: 'md', label: 'Medio' }, { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Extra Grande' }
      ]},
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2 }
    ]
  },
  button: {
    content: [
      { key: 'text', type: 'text', label: 'Testo Pulsante' },
      { key: 'link', type: 'text', label: 'URL Link' },
    ],
    style: [
      { key: 'variant', type: 'select', label: 'Stile', options: [
        { value: 'default', label: 'Predefinito' }, { value: 'destructive', label: 'Distruttivo' },
        { value: 'outline', label: 'Bordo' }, { value: 'secondary', label: 'Secondario' },
        { value: 'ghost', label: 'Fantasma' }, { value: 'link', label: 'Link' }
      ]},
      { key: 'size', type: 'select', label: 'Dimensione', options: [
        { value: 'sm', label: 'Piccolo' }, { value: 'default', label: 'Predefinita' },
        { value: 'lg', label: 'Grande' }
      ]},
      { key: 'width', type: 'select', label: 'Larghezza', options: [
        { value: 'auto', label: 'Auto' }, { value: 'full', label: 'Piena' }
      ]},
       { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
       { key: 'textColor', type: 'color', label: 'Colore Testo' },
    ],
    layout: [
        { key: 'alignment', type: 'select', label: 'Allineamento Contenitore', options: [
            { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' },
            { value: 'right', label: 'Destra' }
        ]}
    ],
     spacing: [
       { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2 }
    ]
  },
  video: {
      content: [
        { key: 'url', type: 'text', label: 'URL Video (YouTube/Vimeo)'},
        { key: 'provider', type: 'select', label: 'Provider', options: [
            { value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo'}
        ]}
      ],
      style: [
           { key: 'aspectRatio', type: 'select', label: 'Proporzioni', options: [
              { value: '16:9', label: '16:9'}, { value: '4:3', label: '4:3'}
          ]},
          { key: 'autoplay', type: 'boolean', label: 'Autoplay'},
          { key: 'muted', type: 'boolean', label: 'Senza Audio'},
          { key: 'controls', type: 'boolean', label: 'Controlli'},
      ],
       spacing: [
         { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2 }
      ]
  },
  form: {
    content: [
      { key: 'title', type: 'text', label: 'Titolo Modulo' },
      { key: 'submitText', type: 'text', label: 'Testo Pulsante Invio' },
      { key: 'fields', type: 'repeater', label: 'Campi Modulo', fields: [
          { key: 'label', type: 'text', label: 'Etichetta Campo'},
          { key: 'name', type: 'text', label: 'Nome (ID)'},
          { key: 'type', type: 'select', label: 'Tipo Campo', options: [
              { value: 'text', label: 'Testo'}, { value: 'email', label: 'Email'}, { value: 'textarea', label: 'Area di Testo'}
          ]},
          { key: 'required', type: 'boolean', label: 'Obbligatorio'}
      ]}
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 4}
    ]
  },
  map: {
      content: [
          { key: 'address', type: 'text', label: 'Indirizzo'}
      ],
      style: [
          { key: 'height', type: 'text', label: 'Altezza (es. 400px)'}
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 4}
      ]
  },
  'icon-list': {
      content: [
          { key: 'items', type: 'repeater', label: 'Elementi Elenco', fields: [
              { key: 'icon', type: 'text', label: 'Icona (Nome Lucide)'},
              { key: 'text', type: 'text', label: 'Testo'},
              { key: 'color', type: 'text', label: 'Colore Icona (es. primary)'}
          ]}
      ],
      style: [
          { key: 'layout', type: 'select', label: 'Layout', options: [
              { value: 'vertical', label: 'Verticale'}, { value: 'horizontal', label: 'Orizzontale'}
          ]},
          { key: 'spacing', type: 'select', label: 'Spaziatura', options: [
              { value: 'small', label: 'Piccola'}, { value: 'medium', label: 'Media'}, { value: 'large', label: 'Grande'}
          ]}
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 4}
      ]
  },
  checklist: {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'items', type: 'repeater', label: 'Elementi Elenco', fields: [
             // Nota: Il RepeaterField si aspetta un oggetto, quindi l Array di stringhe viene gestito come [{text: '...'}, ...]
             { key: 'text', type: 'text', label: 'Testo dell elemento' }
          ]}
      ],
      style: [
          { key: 'titleSize', type: 'select', label: 'Dimensione Titolo', options: [
              { value: 'xl', label: 'XL' }, { value: '2xl', label: '2XL' }, { value: '3xl', label: '3XL' }
          ]},
           { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  spacer: {
      style: [
          { key: 'height', type: 'slider', label: 'Altezza (px)', min: 10, max: 200, step: 5 },
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'}
      ]
  },
  divider: {
       style: [
          { key: 'style', type: 'select', label: 'Stile', options: [
              { value: 'solid', label: 'Solido'}, { value: 'dashed', label: 'Tratteggiato'}, { value: 'dotted', label: 'Punteggiato'}
          ]},
          { key: 'width', type: 'text', label: 'Larghezza (es. 100%, 80px)'},
          { key: 'thickness', type: 'slider', label: 'Spessore (px)', min: 1, max: 10, step: 1},
          { key: 'color', type: 'color', label: 'Colore'},
      ],
      spacing: [
          { key: 'spacing', type: 'slider', label: 'Spaziatura Verticale', min: 0, max: 100, step: 2 }
      ]
  },
  'nav-menu': {
      content: [
          { key: 'items', type: 'repeater', label: 'Voci Menu', fields: [
              { key: 'label', type: 'text', label: 'Etichetta'},
              { key: 'link', type: 'text', label: 'Link'}
          ]}
      ],
      style: [
          { key: 'layout', type: 'select', label: 'Layout', options: [
              { value: 'horizontal', label: 'Orizzontale'}, { value: 'vertical', label: 'Verticale'}
          ]},
          { key: 'alignment', type: 'select', label: 'Allineamento', options: [
            { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' },
            { value: 'right', label: 'Destra' }
          ]},
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'},
          { key: 'textColor', type: 'color', label: 'Colore Testo'},
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 4}
      ]
  },
  // --- COMPONENTI DI CONTENUTO / LEGACY ---
  features: {
    content: [
        { key: 'title', type: 'text', label: 'Titolo Sezione' },
        { key: 'items', type: 'repeater', label: 'Caratteristiche', fields: [
            { key: 'icon', type: 'text', label: 'Icona (Nome Lucide)' },
            { key: 'title', type: 'text', label: 'Titolo Caratteristica' },
            { key: 'description', type: 'textarea', label: 'Descrizione' }
        ]}
    ],
    style: [
        { key: 'titleSize', type: 'select', label: 'Dimensione Titolo', options: [
            { value: '2xl', label: '2XL' }, { value: '3xl', label: '3XL' }, { value: '4xl', label: '4XL' }
        ]},
        { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
        { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
    ],
    spacing: [
        { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  testimonials: {
    content: [
      { key: 'title', type: 'text', label: 'Titolo Sezione' },
      { key: 'items', type: 'repeater', label: 'Testimonianze', fields: [
        { key: 'name', type: 'text', label: 'Nome' },
        { key: 'role', type: 'text', label: 'Ruolo' },
        { key: 'text', type: 'textarea', label: 'Testimonianza' },
        { key: 'image', type: 'text', label: 'URL Immagine' },
      ]}
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'posts-grid': {
      content: [
           { key: 'title', type: 'text', label: 'Titolo Sezione' }
      ],
      style: [
          { key: 'titleSize', type: 'select', label: 'Dimensione Titolo', options: [
             { value: '2xl', label: '2XL' }, { value: '3xl', label: '3XL' }, { value: '4xl', label: '4XL' }
          ]},
          { key: 'postsToShow', type: 'slider', label: 'Articoli da Mostrare', min: 1, max: 12, step: 1 },
          { key: 'columns', type: 'slider', label: 'Colonne', min: 1, max: 4, step: 1 },
          { key: 'showExcerpt', type: 'boolean', label: 'Mostra Estratto'},
          { key: 'showDate', type: 'boolean', label: 'Mostra Data'},
          { key: 'showAuthor', type: 'boolean', label: 'Mostra Autore'},
      ],
      spacing: [
           { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  hero: {
    content: [
      { key: 'title', type: 'text', label: 'Titolo Principale' },
      { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
      { key: 'ctaText', type: 'text', label: 'Testo Pulsante CTA' },
      { key: 'ctaLink', type: 'text', label: 'Link Pulsante CTA' },
    ],
     style: [
      { key: 'backgroundImage', type: 'text', label: 'URL Immagine Sfondo' },
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      { key: 'textAlign', type: 'select', label: 'Allineamento Testo', options: [
         { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }
      ]},
      { key: 'titleSize', type: 'select', label: 'Dimensione Titolo', options: [
          { value: '2xl', label: '2XL' }, { value: '3xl', label: '3XL' }, { value: '4xl', label: '4XL' }, { value: '5xl', label: '5XL' }
      ]},
      { key: 'subtitleSize', type: 'select', label: 'Dimensione Sottotitolo', options: [
           { value: 'base', label: 'Base' }, { value: 'lg', label: 'Grande' }, { value: 'xl', label: 'XL' }, { value: '2xl', label: '2XL' }
      ]},
      { key: 'titleWeight', type: 'select', label: 'Spessore Titolo', options: [
        { value: 'normal', label: 'Normale' }, { value: 'bold', label: 'Grassetto' }
      ]},
      { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
      { key: 'subtitleColor', type: 'color', label: 'Colore Sottotitolo' },
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 },
    ]
  },
  cta: {
     content: [
      { key: 'text', type: 'text', label: 'Testo CTA' },
      { key: 'link', type: 'text', label: 'Link Pulsante' },
    ],
     style: [
        { key: 'variant', type: 'select', label: 'Stile Pulsante', options: [
             { value: 'default', label: 'Predefinito' }, { value: 'destructive', label: 'Distruttivo' },
            { value: 'outline', label: 'Bordo' }, { value: 'secondary', label: 'Secondario' }
        ]},
        { key: 'size', type: 'select', label: 'Dimensione Pulsante', options: [
            { value: 'default', label: 'Predefinita' }, { value: 'sm', label: 'Piccolo' }, { value: 'lg', label: 'Grande' }
        ]},
    ],
    layout: [
        { key: 'textAlign', type: 'select', label: 'Allineamento', options: [
            { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }
        ]},
    ],
     spacing: [
       { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 2 }
    ]
  },
  // --- COMPONENTI AVANZATI PATRIMONIO ---
  'value-stack': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo Principale' },
          { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato' },
          { key: 'items', type: 'repeater', label: 'Componenti', fields: [
              { key: 'icon', type: 'text', label: 'Emoji Icona'},
              { key: 'title', type: 'text', label: 'Titolo'},
              { key: 'value', type: 'text', label: 'Valore'},
              { key: 'description', type: 'textarea', label: 'Descrizione'}
          ]},
          { key: 'totalValue', type: 'text', label: 'Valore Totale' },
          { key: 'investment', type: 'text', label: 'Testo Investimento' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'method-phases': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo Principale' },
          { key: 'phases', type: 'repeater', label: 'Fasi', fields: [
              { key: 'phase', type: 'text', label: 'Numero Fase'},
              { key: 'icon', type: 'text', label: 'Emoji'},
              { key: 'title', type: 'text', label: 'Titolo'},
              { key: 'description', type: 'textarea', label: 'Descrizione'},
              { key: 'transformation', type: 'text', label: 'Trasformazione'},
              { key: 'gradient', type: 'text', label: 'Gradient CSS (es. linear-gradient(...))'},
              { key: 'borderColor', type: 'text', label: 'Colore Bordo (es. linear-gradient(...))'}
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'problems-list': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'text', label: 'Sottotitolo' },
          { key: 'problems', type: 'repeater', label: 'Problemi', fields: [
              { key: 'icon', type: 'text', label: 'Icona (emoji o testo)' },
              { key: 'title', type: 'text', label: 'Titolo Problema' },
              { key: 'description', type: 'textarea', label: 'Descrizione' },
              { key: 'severity', type: 'number', label: 'Gravità (1-3)', defaultValue: 2 }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
      'transparency-filter': {
        content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo Principale' },
          { key: 'weDoTitle', type: 'text', label: 'Titolo "Cosa Facciamo"' },
          {
            key: 'weDoItems',
            type: 'repeater',
            label: 'Lista "Cosa Facciamo"',
            fields: [
              { key: 'text', type: 'textarea', label: 'Elemento' }
            ]
          },
          { key: 'weDontTitle', type: 'text', label: 'Titolo "Cosa NON Facciamo"' },
          {
            key: 'weDontItems',
            type: 'repeater',
            label: 'Lista "Cosa NON Facciamo"',
            fields: [
              { key: 'text', type: 'textarea', label: 'Elemento' }
            ]
          },
        ],
        style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
        ],
        spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
        ]
      },

  // RENDITA DIPENDENTE COMPONENTS
  'vsl-hero-block': {
    content: [
      { key: 'topHeadline', type: 'text', label: 'Headline Superiore (Badge)' },
      { key: 'urgencyBadge', type: 'text', label: 'Badge Urgenza' },
      { key: 'titlePrefix', type: 'text', label: 'Prefisso Titolo' },
      { key: 'title', type: 'text', label: 'Titolo' },
      { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato (Gradiente)' },
      { key: 'titleSuffix', type: 'textarea', label: 'Suffisso Titolo' },
      { key: 'titleSuffix2', type: 'text', label: 'Suffisso Titolo 2 (Evidenziato Blu)' },
      { key: 'subtitlePart1', type: 'text', label: 'Sottotitolo Parte 1 (Blu)' },
      { key: 'subtitleHighlight', type: 'text', label: 'Sottotitolo Evidenziato (Box Blu)' },
      { key: 'subtitlePart2', type: 'text', label: 'Sottotitolo Parte 2 (Principale)' },
      { key: 'subtitlePart3', type: 'text', label: 'Sottotitolo Parte 3 (Blu)' },
      { key: 'videoUrl', type: 'text', label: 'URL Video' },
      { key: 'videoProvider', type: 'select', label: 'Provider Video', options: [
          { value: 'youtube', label: 'YouTube' },
          { value: 'vimeo', label: 'Vimeo' },
          { value: 'wistia', label: 'Wistia' }
      ]},
      { key: 'ctaType', type: 'select', label: 'Tipo CTA', options: [
          { value: 'link', label: 'Link Diretto' },
          { value: 'form', label: 'Form Lead' }
      ]},
      { key: 'ctaText', type: 'text', label: 'Testo CTA' },
      { key: 'ctaLink', type: 'text', label: 'Link CTA (solo se tipo Link)' },
      { key: 'urgencyNote', type: 'text', label: 'Nota Urgenza' }
    ],
    style: [
      { key: 'theme', type: 'select', label: 'Tema', options: [
        { value: 'dark', label: 'Sfondo Scuro' },
        { value: 'light', label: 'Sfondo Chiaro' }
      ]},
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo (Opzionale)' },
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'problems-grid-rdp': {
    content: [
      { key: 'title', type: 'text', label: 'Titolo' },
      {
        key: 'problems',
        type: 'repeater',
        label: 'Problemi',
        fields: [
          { key: 'icon', type: 'text', label: 'Icona (Emoji)' },
          { key: 'title', type: 'text', label: 'Titolo Problema' },
          { key: 'description', type: 'textarea', label: 'Descrizione' }
        ]
      }
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
      { key: 'textColor', type: 'color', label: 'Colore Testo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'method-timeline-rdp': {
    content: [
      { key: 'title', type: 'text', label: 'Titolo' },
      { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
      {
        key: 'steps',
        type: 'repeater',
        label: 'Step',
        fields: [
          { key: 'number', type: 'text', label: 'Numero (es. 01)' },
          { key: 'title', type: 'text', label: 'Titolo Step' },
          { key: 'description', type: 'textarea', label: 'Descrizione' }
        ]
      }
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      { key: 'textColor', type: 'color', label: 'Colore Testo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'offer-ecosystem': {
    content: [
      { key: 'title', type: 'text', label: 'Titolo' },
      {
        key: 'items',
        type: 'repeater',
        label: 'Elementi Offerta',
        fields: [
          { key: 'icon', type: 'text', label: 'Icona (Emoji)' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'features', type: 'list', label: 'Features (una per riga)' }
        ]
      },
      { key: 'totalValue', type: 'text', label: 'Valore Totale' }
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
      { key: 'textColor', type: 'color', label: 'Colore Testo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'requirements-compare': {
    content: [
      { key: 'title', type: 'text', label: 'Titolo' },
      { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
      { key: 'workWithTitle', type: 'text', label: 'Titolo "Lavoriamo Con"' },
      { key: 'workWithItems', type: 'list', label: 'Requisiti Positivi (uno per riga)' },
      { key: 'dontWorkWithTitle', type: 'text', label: 'Titolo "NON Lavoriamo Con"' },
      { key: 'dontWorkWithItems', type: 'list', label: 'Requisiti Negativi (uno per riga)' }
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
      { key: 'textColor', type: 'color', label: 'Colore Testo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'guarantee-cta-section': {
    content: [
      { key: 'badge', type: 'text', label: 'Badge' },
      { key: 'title', type: 'text', label: 'Titolo' },
      { key: 'description', type: 'textarea', label: 'Descrizione Garanzia' },
      { key: 'guarantee', type: 'textarea', label: 'Testo Garanzia' },
      { key: 'ctaText', type: 'text', label: 'Testo CTA' },
      { key: 'ctaLink', type: 'text', label: 'Link CTA' },
      { key: 'limitedSpots', type: 'text', label: 'Testo Posti Limitati' }
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo (gradiente supportato)' },
      { key: 'textColor', type: 'color', label: 'Colore Testo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
    ]
  },
  'lead-form-dialog': {
    content: [
      { key: 'title', type: 'text', label: 'Titolo Form' },
      { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
      {
        key: 'fields',
        type: 'repeater',
        label: 'Campi Form',
        fields: [
          { key: 'name', type: 'text', label: 'Nome Campo (ID)' },
          { key: 'label', type: 'text', label: 'Etichetta' },
          { key: 'type', type: 'select', label: 'Tipo Campo', options: [
            { value: 'text', label: 'Testo' },
            { value: 'email', label: 'Email' },
            { value: 'tel', label: 'Telefono' },
            { value: 'textarea', label: 'Area Testo' }
          ]},
          { key: 'required', type: 'boolean', label: 'Obbligatorio' }
        ]
      },
      { key: 'submitText', type: 'text', label: 'Testo Pulsante Invio' },
      { key: 'apiEndpoint', type: 'text', label: 'API Endpoint' },
      { key: 'source', type: 'text', label: 'Sorgente Lead' },
      { key: 'campaign', type: 'text', label: 'Nome Campagna' },
      { key: 'redirectUrl', type: 'text', label: 'URL Redirect Dopo Invio' }
    ],
    style: [
      { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
    ],
    spacing: [
      { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 100, step: 4 }
    ]
  },

  'pricing-plans': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo Sezione' },
          { key: 'plans', type: 'repeater', label: 'Piani', fields: [
              { key: 'name', type: 'text', label: 'Nome Piano'},
              { key: 'price', type: 'text', label: 'Prezzo'},
              { key: 'features', type: 'repeater', label: 'Features', fields: [
                  { key: 'text', type: 'text', label: 'Feature'}
              ]},
              { key: 'ideal', type: 'textarea', label: 'Ideale per'},
              { key: 'buttonText', type: 'text', label: 'Testo Pulsante'},
              { key: 'buttonLink', type: 'text', label: 'Link Pulsante'},
              { key: 'recommended', type: 'boolean', label: 'Consigliato'}
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'}
      ],
       spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4}
      ]
  },
  'fork-roads': {
      content: [
           { key: 'badge', type: 'text', label: 'Badge'},
           { key: 'title', type: 'text', label: 'Titolo Principale'},
           { key: 'subtitle', type: 'textarea', label: 'Sottotitolo'},
           { key: 'ctaText', type: 'text', label: 'Testo CTA'},
           { key: 'ctaLink', type: 'text', label: 'Link CTA'}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'}
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4}
      ]
  },
  'guarantee-shield': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo'},
          { key: 'description', type: 'textarea', label: 'Descrizione Garanzia'},
          { key: 'icon', type: 'text', label: 'Icona (Emoji)'},
          { key: 'iconColor', type: 'color', label: 'Colore Icona'}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo'}
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4}
      ]
  },
  'hero-patrimonio': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo Principale' },
          { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'ctaText', type: 'text', label: 'Testo CTA' },
          { key: 'ctaLink', type: 'text', label: 'Link CTA' },
          { key: 'disclaimer', type: 'textarea', label: 'Disclaimer (HTML ammesso)' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore/Gradiente Sfondo' },
          { key: 'textAlign', type: 'select', label: 'Allineamento Testo', options: [
              { value: 'left', label: 'Sinistra' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Destra' }
          ]},
          { key: 'titleSize', type: 'select', label: 'Dimensione Titolo', options: [
              { value: '3xl', label: '3XL' }, { value: '4xl', label: '4XL' }, { value: '5xl', label: '5XL' }, { value: '6xl', label: '6XL' }
          ]},
          { key: 'subtitleSize', type: 'select', label: 'Dimensione Sottotitolo', options: [
              { value: 'lg', label: 'Grande' }, { value: 'xl', label: 'XL' }, { value: '2xl', label: '2XL' }
          ]},
          { key: 'titleWeight', type: 'select', label: 'Spessore Titolo', options: [
              { value: 'normal', label: 'Normale' }, { value: 'bold', label: 'Grassetto' }
          ]},
          { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
          { key: 'subtitleColor', type: 'color', label: 'Colore Sottotitolo' },
          { key: 'highlightColor', type: 'color', label: 'Colore Evidenziazione' },
          { key: 'ctaBackgroundColor', type: 'color', label: 'Colore Sfondo CTA' },
          { key: 'ctaTextColor', type: 'color', label: 'Colore Testo CTA' },
          { key: 'disclaimerColor', type: 'color', label: 'Colore Disclaimer' },
          { key: 'badgeColor', type: 'color', label: 'Colore Sfondo Badge' },
          { key: 'badgeTextColor', type: 'color', label: 'Colore Testo Badge' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 },
          { key: 'ctaSpacing', type: 'slider', label: 'Spaziatura CTA', min: 0, max: 100, step: 4 },
          { key: 'disclaimerSpacing', type: 'slider', label: 'Spaziatura Disclaimer', min: 0, max: 50, step: 2 }
      ]
  },
      'candidature-cta': {
        content: [
          { key: 'icon', type: 'select', label: 'Icona', options: [
            { value: 'ShieldCheck', label: 'Scudo con Spunta' },
            { value: 'Award', label: 'Premio' },
            { value: 'Rocket', label: 'Razzo' },
            { value: 'Target', label: 'Bersaglio' },
            { value: 'Star', label: 'Stella' },
          ]},
          { key: 'title', type: 'textarea', label: 'Titolo Principale' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'ctaText', type: 'text', label: 'Testo Bottone' },
          { key: 'ctaLink', type: 'text', label: 'Link Bottone' },
          { key: 'disclaimer', type: 'textarea', label: 'Disclaimer' },
        ],
        style: [
          { key: 'backgroundColor', type: 'color', label: 'Sfondo (CSS Gradient)' },
        ],
        spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 40, max: 200, step: 8 }
        ]
      },
  // --- HOMEPAGE COMPONENTS ---
  'hero-home': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'badgeIcon', type: 'text', label: 'Icona Badge (Emoji)' },
          { key: 'title', type: 'textarea', label: 'Titolo' },
          { key: 'highlightedTitle', type: 'textarea', label: 'Titolo Evidenziato' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'showVideo', type: 'boolean', label: 'Mostra Sezione Video' },
          { key: 'videoUrl', type: 'text', label: 'URL Video (YouTube/Vimeo/Wistia)' },
          { key: 'videoProvider', type: 'select', label: 'Piattaforma Video', options: [
            { value: 'youtube', label: 'YouTube' },
            { value: 'vimeo', label: 'Vimeo' },
            { value: 'wistia', label: 'Wistia' }
          ]},
          { key: 'videoAutoplay', type: 'boolean', label: 'Autoplay Video' },
          { key: 'videoMuted', type: 'boolean', label: 'Video Silenziato' },
          { key: 'videoControls', type: 'boolean', label: 'Mostra Controlli Video' },
          { key: 'ctaText', type: 'text', label: 'Testo CTA' },
          { key: 'ctaLink', type: 'text', label: 'Link CTA' },
          { key: 'ctaSubtext', type: 'text', label: 'Sotto-testo CTA' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
          { key: 'subtitleColor', type: 'color', label: 'Colore Sottotitolo' },
          { key: 'ctaBackgroundColor', type: 'color', label: 'Colore CTA' },
          { key: 'ctaTextColor', type: 'color', label: 'Colore Testo CTA' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'social-proof-logos': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'logos', type: 'repeater', label: 'Loghi', fields: [
              { key: 'name', type: 'text', label: 'Nome' },
              { key: 'url', type: 'text', label: 'URL Immagine' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'stats-grid': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'stats', type: 'repeater', label: 'Statistiche', fields: [
              { key: 'number', type: 'text', label: 'Numero' },
              { key: 'label', type: 'text', label: 'Label' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'problem-solution': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'problemTitle', type: 'text', label: 'Titolo Sezione Problemi' },
          { key: 'problems', type: 'repeater', label: 'Problemi', fields: [
            { key: 'title', type: 'text', label: 'Titolo Problema', defaultValue: '' },
            { key: 'description', type: 'textarea', label: 'Descrizione', defaultValue: '' },
            { key: 'severity', type: 'number', label: 'Gravità (1-3)', defaultValue: 2 }
          ]},
          { key: 'solutionTitle', type: 'text', label: 'Titolo Sezione Soluzioni' },
          { key: 'solutions', type: 'repeater', label: 'Soluzioni', fields: [
            { key: 'title', type: 'text', label: 'Titolo Soluzione', defaultValue: '' },
            { key: 'description', type: 'textarea', label: 'Descrizione', defaultValue: '' }
          ]},
          { key: 'ctaText', type: 'text', label: 'Testo CTA' },
          { key: 'ctaSubtext', type: 'text', label: 'Sottotesto CTA' },
          { key: 'ctaLink', type: 'text', label: 'Link CTA' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'filter-section': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'forWhoTitle', type: 'text', label: 'Titolo "Per Chi È"' },
          { key: 'forWhoItems', type: 'repeater', label: 'Per Chi È', fields: [
              { key: 'text', type: 'textarea', label: 'Testo' }
          ]},
          { key: 'notForWhoTitle', type: 'text', label: 'Titolo "Per Chi NON È"' },
          { key: 'notForWhoItems', type: 'repeater', label: 'Per Chi NON È', fields: [
              { key: 'text', type: 'textarea', label: 'Testo' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'testimonials-grid': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'testimonials', type: 'repeater', label: 'Testimonianze', fields: [
              { key: 'name', type: 'text', label: 'Nome' },
              { key: 'role', type: 'text', label: 'Ruolo' },
              { key: 'content', type: 'textarea', label: 'Contenuto' },
              { key: 'rating', type: 'number', label: 'Rating (1-5)' },
              { key: 'avatar', type: 'text', label: 'Avatar (Iniziali)' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  // --- CHI SIAMO COMPONENTS ---
  'hero-chi-siamo': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'textarea', label: 'Titolo (Parte 1)' },
          { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato' },
          { key: 'titleSuffix', type: 'text', label: 'Titolo (Parte 2)' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
          { key: 'subtitleColor', type: 'color', label: 'Colore Sottotitolo' },
          { key: 'badgeColor', type: 'color', label: 'Sfondo Badge' },
          { key: 'badgeTextColor', type: 'color', label: 'Testo Badge' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'values-grid': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'values', type: 'repeater', label: 'Valori', fields: [
              { key: 'icon', type: 'select', label: 'Icona', options: [
                  { value: 'Target', label: 'Target' }, { value: 'Users', label: 'Users' },
                  { value: 'Lightbulb', label: 'Lightbulb' }, { value: 'Shield', label: 'Shield' },
                  { value: 'Award', label: 'Award' }, { value: 'Star', label: 'Star' },
                  { value: 'TrendingUp', label: 'TrendingUp' }, { value: 'Heart', label: 'Heart' }
              ]},
              { key: 'title', type: 'text', label: 'Titolo' },
              { key: 'description', type: 'textarea', label: 'Descrizione' },
              { key: 'color', type: 'text', label: 'Colore (es. blue, amber, emerald)' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'company-quote': {
      content: [
          { key: 'quote', type: 'textarea', label: 'Citazione' },
          { key: 'author', type: 'text', label: 'Autore' },
          { key: 'authorTitle', type: 'text', label: 'Titolo Autore' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'overlayColor', type: 'color', label: 'Colore Overlay' },
          { key: 'quoteColor', type: 'color', label: 'Colore Citazione' },
          { key: 'authorColor', type: 'color', label: 'Colore Autore' },
          { key: 'quoteIconColor', type: 'color', label: 'Colore Icona' },
          { key: 'quoteIconSize', type: 'slider', label: 'Dimensione Icona', min: 24, max: 128, step: 1 }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'timeline-milestones': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'milestones', type: 'repeater', label: 'Pietre Miliari', fields: [
              { key: 'year', type: 'text', label: 'Anno' },
              { key: 'title', type: 'text', label: 'Titolo' },
              { key: 'description', type: 'textarea', label: 'Descrizione' },
              { key: 'icon', type: 'select', label: 'Icona', options: [
                  { value: 'Lightbulb', label: 'Lightbulb' }, { value: 'Users', label: 'Users' },
                  { value: 'TrendingUp', label: 'TrendingUp' }, { value: 'Award', label: 'Award' },
                  { value: 'Target', label: 'Target' }, { value: 'Shield', label: 'Shield' }
              ]}
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'timelineLineColor', type: 'text', label: 'Colore/Gradiente Linea' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'team-grid': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'team', type: 'repeater', label: 'Team Members', fields: [
              { key: 'name', type: 'text', label: 'Nome' },
              { key: 'title', type: 'text', label: 'Ruolo' },
              { key: 'bio', type: 'textarea', label: 'Bio' },
              { key: 'image', type: 'text', label: 'URL Immagine' },
              { key: 'specialties', type: 'repeater', label: 'Specialità', fields: [
                  // Nota: Il RepeaterField si aspetta un oggetto
                  { key: 'text', label: 'Testo specialità' }
              ]}
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  // --- SERVIZI COMPONENTS ---
  'hero-servizi': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'textarea', label: 'Titolo (Parte 1)' },
          { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato' },
          { key: 'titleSuffix', type: 'text', label: 'Titolo (Parte 2)' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'badgeColor', type: 'color', label: 'Sfondo Badge' },
          { key: 'badgeTextColor', type: 'color', label: 'Testo Badge' },
          { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
          { key: 'subtitleColor', type: 'color', label: 'Colore Sottotitolo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'services-cards': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'services', type: 'repeater', label: 'Servizi', fields: [
              { key: 'icon', type: 'text', label: 'Icona (Emoji)' },
              { key: 'title', type: 'text', label: 'Titolo' },
              { key: 'description', type: 'textarea', label: 'Descrizione' },
              { key: 'features', type: 'repeater', label: 'Features', fields: [
                  { key: 'text', type: 'text', label: 'Feature' }
              ]},
              { key: 'price', type: 'text', label: 'Prezzo' },
              { key: 'priceDescription', type: 'text', label: 'Descrizione Prezzo' },
              { key: 'ctaText', type: 'text', label: 'Testo CTA' },
              { key: 'ctaLink', type: 'text', label: 'Link CTA' },
              { key: 'isPopular', type: 'boolean', label: 'Popolare' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'process-steps': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'steps', type: 'repeater', label: 'Step', fields: [
              { key: 'number', type: 'text', label: 'Numero' },
              { key: 'title', type: 'text', label: 'Titolo Step' },
              { key: 'description', type: 'textarea', label: 'Descrizione Step' },
              { key: 'badgeText', type: 'text', label: 'Testo Badge Step' },
              { key: 'badgeColor', type: 'select', label: 'Colore Badge Step', options: [
                  {value: 'emerald', label: 'Smeraldo'}, {value: 'blue', label: 'Blu'},
                  {value: 'purple', label: 'Viola'}, {value: 'orange', label: 'Arancione'}
              ] },
              { key: 'circleGradient', type: 'text', label: 'Gradiente Cerchio (CSS)' },
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'badgeGradient', type: 'text', label: 'Gradiente Badge Principale (CSS)' },
          { key: 'timelineGradient', type: 'text', label: 'Gradiente Timeline (CSS)' },
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  // --- PROGETTI BLOCKS ---
  'hero-progetti': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'badgeIcon', type: 'select', label: 'Icona Badge', options: [
              { value: 'Trophy', label: 'Trophy' }, { value: 'Star', label: 'Star' }, { value: 'Briefcase', label: 'Briefcase' }
          ]},
          { key: 'title', type: 'textarea', label: 'Titolo (Parte 1)' },
          { key: 'highlightedTitle', type: 'text', label: 'Titolo Evidenziato' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'showSearch', type: 'boolean', label: 'Mostra Ricerca' },
          { key: 'searchPlaceholder', type: 'text', label: 'Placeholder Ricerca' },
          { key: 'stats', type: 'repeater', label: 'Statistiche', fields: [
              { key: 'icon', type: 'select', label: 'Icona', options: [
                  { value: 'Trophy', label: 'Trophy' }, { value: 'Star', label: 'Star' },
                  { value: 'Users', label: 'Users' }, { value: 'CheckCircle', label: 'CheckCircle' }
              ]},
              { key: 'label', type: 'text', label: 'Etichetta' },
              { key: 'value', type: 'text', label: 'Valore' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'projects-grid': {
      content: [
          { key: 'defaultTab', type: 'select', label: 'Tab Predefinito', options: [
              { value: 'all', label: 'Tutti i Progetti' }, { value: 'featured', label: 'In Evidenza' },
              { value: 'development', label: 'Sviluppo' }, { value: 'marketing', label: 'Marketing' },
              { value: 'consulting', label: 'Consulenza' }, { value: 'projects', label: 'Solo Progetti' },
              { value: 'partnerships', label: 'Partnership' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
      // --- BLOG COMPONENTS ---
      'hero-blog': {
          content: [
              { key: 'badge', type: 'text', label: 'Badge' },
              { key: 'badgeIcon', type: 'select', label: 'Icona Badge', options: [
                  { value: 'BookOpen', label: 'Libro' }, { value: 'Zap', label: 'Fulmine' }, { value: 'Star', label: 'Stella' }
              ]},
              { key: 'title', type: 'textarea', label: 'Titolo (Parte 1)' },
              { key: 'titleHighlight', type: 'text', label: 'Titolo Evidenziato' },
              { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' }
          ],
          settings: [
              { key: 'showSearch', type: 'boolean', label: 'Mostra Barra di Ricerca' },
              { key: 'searchPlaceholder', type: 'text', label: 'Placeholder Ricerca' },
              { key: 'showCategoryFilters', type: 'boolean', label: 'Mostra Filtri Categoria' }
          ],
          spacing: [
              { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
          ]
      },
      'blog-posts-grid': {
          content: [
            { key: 'title', type: 'text', label: 'Titolo Sezione' },
          ],
          settings: [
              { key: 'postsToShow', type: 'slider', label: 'Numero Articoli', min: 1, max: 12, step: 1 },
              { key: 'layout', type: 'select', label: 'Layout Griglia', options: [
                  { value: 'grid', label: 'Griglia Standard' }, { value: 'featured', label: 'Con Post in Evidenza' }
              ]},
              { key: 'postsColumns', type: 'slider', label: 'Colonne (per griglia)', min: 1, max: 4, step: 1 },
          ],
          style: [
              { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
          ],
          spacing: [
              { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
          ]
      },
      'blog-categories': {
          content: [
            { key: 'title', type: 'text', label: 'Titolo Sezione' },
          ],
          settings: [
            { key: 'limit', type: 'slider', label: 'Numero Categorie', min: 2, max: 12, step: 1 },
            { key: 'layout', type: 'select', label: 'Layout', options: [
                { value: 'grid', label: 'Griglia' }, { value: 'list', label: 'Lista' }
            ]},
          ],
          style: [
              { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
          ],
          spacing: [
              { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
          ]
      },
      'expert-profile-card': {
          content: [
            { key: 'image', type: 'text', label: 'URL Immagine' },
            { key: 'title', type: 'text', label: 'Nome e Titolo' },
            { key: 'subtitles', type: 'array-simple', label: 'Sottotitoli', fields: [
                { key: 'text', label: 'Testo', type: 'text', defaultValue: '' }
            ]},
            { key: 'description', type: 'textarea', label: 'Descrizione' },
            { key: 'ctaText', type: 'text', label: 'Testo Bottone' },
            { key: 'ctaLink', type: 'text', label: 'Link Bottone' },
          ],
          style: [
              { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
          ],
          spacing: [
              { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
          ]
      },
      'newsletter-cta': {
          content: [
            { key: 'title', type: 'text', label: 'Titolo' },
            { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
            { key: 'placeholder', type: 'text', label: 'Placeholder Email' },
            { key:           'buttonText', type: 'text', label: 'Testo Bottone' },
            { key: 'disclaimer', type: 'text', label: 'Disclaimer' },
          ],
          style: [
              { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
          ],
          spacing: [
              { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
          ]
      },
  // --- CONTATTI COMPONENTS ---
  'hero-contatti': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'textarea', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'badgeColor', type: 'color', label: 'Sfondo Badge' },
          { key: 'badgeTextColor', type: 'color', label: 'Testo Badge' },
          { key: 'titleColor', type: 'color', label: 'Colore Titolo' },
          { key: 'subtitleColor', type: 'color', label: 'Colore Sottotitolo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'benefits-grid': {
      content: [
          { key: 'benefits', type: 'repeater', label: 'Benefici', fields: [
              { key: 'icon', type: 'select', label: 'Icona',options: [
                  { value: 'CheckCircle', label: 'CheckCircle' }, { value: 'Headphones', label: 'Headphones' },
                  { value: 'Zap', label: 'Zap' }, { value: 'Users', label: 'Users' }
              ]},
              { key: 'title', type: 'text', label: 'Titolo' },
              { key: 'description', type: 'textarea', label: 'Descrizione' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'contact-info': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo Sezione' },
          { key: 'phone', type: 'text', label: 'Telefono' },
          { key: 'email', type: 'text', label: 'Email' },
          { key: 'address', type: 'textarea', label: 'Indirizzo' },
          { key: 'showOfficeHours', type: 'boolean', label: 'Mostra Orari Ufficio' },
          { key: 'officeHours', type: 'text', label: 'Orari Ufficio' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  // --- FAQ COMPONENTS ---
  'hero-faq': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'textarea', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'showSearch', type: 'boolean', label: 'Mostra Ricerca' },
          { key: 'searchPlaceholder', type: 'text', label: 'Placeholder Ricerca' }
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' },
          { key: 'badgeColor', type: 'color', label: 'Sfondo Badge' },
          { key: 'badgeTextColor', type: 'color', label: 'Testo Badge' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'popular-questions': {
      content: [
          { key: 'badge', type: 'text', label: 'Badge' },
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'limit', type: 'slider', label: 'Limite Domande', min: 2, max: 8, step: 1 },
          { key: 'questions', type: 'repeater', label: 'Domande', fields: [
              { key: 'question', type: 'text', label: 'Domanda' },
              { key: 'answer', type: 'textarea', label: 'Risposta' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'faq-list': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo Sezione' },
          { key: 'subtitle', type: 'text', label: 'Sottotitolo' },
          { key: 'showCategories', type: 'boolean', label: 'Mostra Sidebar Categorie' },
          { key: 'faqs', type: 'repeater', label: 'FAQs', fields: [
              { key: 'category', type: 'text', label: 'Categoria' },
              { key: 'question', type: 'text', label: 'Domanda' },
              { key: 'answer', type: 'textarea', label: 'Risposta' },
              { key: 'popular', type: 'boolean', label: 'Popolare' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  },
  'contact-support-grid': {
      content: [
          { key: 'title', type: 'text', label: 'Titolo' },
          { key: 'subtitle', type: 'textarea', label: 'Sottotitolo' },
          { key: 'channels', type: 'repeater', label: 'Canali di Supporto', fields: [
              { key: 'icon', type: 'select', label: 'Icona', options: [
                  { value: 'MessageCircle', label: 'MessageCircle' },
                  { value: 'Phone', label: 'Phone' },
                  { value: 'Mail', label: 'Mail' }
              ]},
              { key: 'title',type: 'text', label: 'Titolo' },
              { key: 'description', type: 'textarea', label: 'Descrizione' },
              { key: 'availability', type: 'textarea', label: 'Disponibilità' },
              { key: 'ctaText', type: 'text', label: 'Testo Bottone' },
              { key: 'ctaLink', type: 'text', label: 'Link Bottone' }
          ]}
      ],
      style: [
          { key: 'backgroundColor', type: 'color', label: 'Colore Sfondo' }
      ],
      spacing: [
          { key: 'paddingY', type: 'slider', label: 'Padding Verticale', min: 0, max: 200, step: 4 }
      ]
  }
};

// Component Properties Editor - Editor universale basato su COMPONENT_EDITOR_CONFIG
function ComponentPropertiesEditor({ component, onUpdate }: {
  component: ComponentData;
  onUpdate: (newProps: Record<string, any>) => void;
}) {
  const config = COMPONENT_EDITOR_CONFIG[component.type as keyof typeof COMPONENT_EDITOR_CONFIG];

  if (!config) return null;

  const handlePropChange = (key: string, value: any) => {
    onUpdate({ ...component.props, [key]: value });
  };

  const renderField = (field: any) => {
    const value = component.props[field.key];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-xs">{field.label}</Label>
            <Input
              value={value || ''}
              onChange={(e) => handlePropChange(field.key, e.target.value)}
              placeholder={field.label}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-xs">{field.label}</Label>
            <Textarea
              value={value || ''}
              onChange={(e) => handlePropChange(field.key, e.target.value)}
              placeholder={field.label}
              rows={3}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={field.key} className="flex items-center justify-between">
            <Label className="text-xs">{field.label}</Label>
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => handlePropChange(field.key, checked)}
            />
          </div>
        );

      case 'slider':
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">{field.label}</Label>
              <span className="text-xs text-muted-foreground">{value || field.min}</span>
            </div>
            <Slider
              value={[parseInt(String(value), 10) || field.min]}
              onValueChange={([val]) => handlePropChange(field.key, val)}
              min={field.min}
              max={field.max}
              step={field.step}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-xs">{field.label}</Label>
            <Select value={value || ''} onValueChange={(val) => handlePropChange(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Seleziona ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'color':
        return (
            <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                <div className="flex items-center gap-2 border rounded-md pr-2">
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handlePropChange(field.key, e.target.value)}
                        className="border-0"
                    />
                    <Input
                        type="color"
                        value={value || '#ffffff'}
                        onChange={(e) => handlePropChange(field.key, e.target.value)}
                        className="h-6 w-6 p-0 border-0 bg-transparent"
                    />
                </div>
            </div>
        );

      case 'repeater':
        return (
          <RepeaterField
            key={field.key}
            label={field.label}
            value={value || []}
            fields={field.fields}
            onChange={(newValue) => handlePropChange(field.key, newValue)}
          />
        );

      case 'array-simple':
        return (
            <div key={field.key} className="space-y-2">
                <Label className="text-xs">{field.label}</Label>
                <Textarea
                    value={Array.isArray(value) ? value.join('\n') : ''}
                    onChange={(e) => {
                        const items = e.target.value.split('\n').filter(s => s.trim());
                        handlePropChange(field.key, items);
                    }}
                    placeholder={field.fields.map((f: any) => f.placeholder || f.label).join('\n')}
                    rows={field.fields.length + 1}
                />
            </div>
        );

      case'number':
        return (
            <div key={field.key} className="space-y-2">
                <Label className="text-xs">{field.label}</Label>
                <Input
                    type="number"
                    value={value || ''}
                    onChange={(e) => handlePropChange(field.key, parseInt(e.target.value, 10))}
                    placeholder={field.label}
                />
            </div>
        );

      case 'list':
        return (
            <div key={field.key} className="space-y-2">
                <Label className="text-xs">{field.label}</Label>
                <Textarea
                    value={Array.isArray(value) ? value.join('\n') : ''}
                    onChange={(e) => handlePropChange(field.key, e.target.value.split('\n'))}
                    placeholder={`Inserisci ogni elemento su una nuova riga`}
                    rows={3}
                />
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(config).map(([groupName, fields]) => (
        <div key={groupName} className="space-y-3">
          <Separator />
          <Label className="font-semibold capitalize">{groupName}</Label>
          {(fields as any[]).map(renderField)}
        </div>
      ))}
    </div>
  );
}

// Funzione per renderizzare componenti specifici all'interno dell editor
function RenderComponentEditor({ component, onUpdateComponent }: {
  component: ComponentData;
  onUpdateComponent:(id: string, props: Record<string, any>) => void;
}) {
  switch (component.type) {
    case 'pricing-plans':
      return (
        <div className="space-y-4">
          <Label className="font-semibold">Pricing a Due Piani</Label>
          <Input
            placeholder="Titolo"
            value={component.props.title || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, title: e.target.value })}
          />
          {/* Editor per i piani */}
          <div className="space-y-3">
            <Label>Piani di Prezzo</Label>
            {component.props.plans.map((plan: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold">{plan.name}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newPlans = component.props.plans.filter((_: any, i: number) => i !== index);
                      onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Nome piano"
                  value={plan.name}
                  onChange={e => {
                    const newPlans = [...component.props.plans];
                    newPlans[index].name = e.target.value;
                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                  }}
                />
                <Input
                  placeholder="Prezzo"
                  value={plan.price}
                  onChange={e => {
                    const newPlans = [...component.props.plans];
                    newPlans[index].price = e.target.value;
                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                  }}
                />
                <Textarea
                  placeholder="Ideale per..."
                  value={plan.ideal}
                  onChange={e => {
                    const newPlans = [...component.props.plans];
                    newPlans[index].ideal = e.target.value;
                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                  }}
                />
                 <div className="space-y-2">
                    <Label>Features</Label>
                    {plan.features.map((feature: string, featureIndex: number) => (
                        <div key={featureIndex} className="flex items-center gap-2">
                            <Input
                                value={feature}
                                onChange={e => {
                                    const newPlans = [...component.props.plans];
                                    newPlans[index].features[featureIndex] = e.target.value;
                                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                                }}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const newPlans = [...component.props.plans];
                                    newPlans[index].features.splice(featureIndex, 1);
                                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                     <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newPlans = [...component.props.plans];
                            newPlans[index].features.push('');
                            onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                        }}
                     >
                        <Plus className="h-4 w-4 mr-2" /> Aggiungi Feature
                    </Button>
                </div>
                <Input
                  placeholder="Testo Pulsante"
                  value={plan.buttonText}
                  onChange={e => {
                    const newPlans = [...component.props.plans];
                    newPlans[index].buttonText = e.target.value;
                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                  }}
                />
                <Input
                  placeholder="Link Pulsante"
                  value={plan.buttonLink}
                  onChange={e => {
                    const newPlans = [...component.props.plans];
                    newPlans[index].buttonLink = e.target.value;
                    onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                  }}
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={plan.recommended}
                    onCheckedChange={checked => {
                      const newPlans = [...component.props.plans];
                      newPlans[index].recommended = checked;
                      onUpdateComponent(component.id, { ...component.props, plans: newPlans });
                    }}
                  />
                  <Label>Piano consigliato</Label>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPlan = {
                  name: 'Nuovo Piano',
                  price: '0€ / mese',
                  features: ['Nuova funzionalità'],
                  ideal: 'Ideale per...',
                  buttonText: 'INIZIA ORA',
                  buttonLink: '#',
                  recommended: false
                };
                onUpdateComponent(component.id, { ...component.props, plans: [...component.props.plans, newPlan] });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />Aggiungi Piano
            </Button>
          </div>
        </div>
      );

    case 'fork-roads':
      return (
        <div className="space-y-4">
          <Label className="font-semibold">Bivio delle Due Strade</Label>
          <Input
            placeholder="Badge"
            value={component.props.badge || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, badge: e.target.value })}
          />
          <Input
            placeholder="Titolo"
            value={component.props.title || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, title: e.target.value })}
          />
          <Textarea
            placeholder="Sottotitolo"
            value={component.props.subtitle || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, subtitle: e.target.value })}
          />
          <Input
            placeholder="Testo CTA"
            value={component.props.ctaText || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, ctaText: e.target.value })}
          />
           <Input
            placeholder="Link CTA"
            value={component.props.ctaLink || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, ctaLink: e.target.value })}
          />
        </div>
      );

    case 'guarantee-shield':
      return (
        <div className="space-y-4">
          <Label className="font-semibold">Garanzia con Shield</Label>
          <Input
            placeholder="Titolo"
            value={component.props.title || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, title: e.target.value })}
          />
          <Textarea
            placeholder="Descrizione garanzia"
            value={component.props.description || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, description: e.target.value })}
          />
            <Input
                placeholder="Icona (es. 🛡️)"
                value={component.props.icon || ''}
                onChange={e => onUpdateComponent(component.id, { ...component.props, icon: e.target.value })}
            />
             <div className="flex items-center gap-2">
                 <Label>Colore Icona</Label>
                 <Input
                    type="color"
                    value={component.props.iconColor || '#ffffff'}
                    onChange={(e) => onUpdateComponent(component.id, { ...component.props, iconColor: e.target.value })}
                    className="h-8 w-10 p-0 border-0"
                 />
            </div>
        </div>
      );

    case 'hero-patrimonio':
      return (
        <div className="space-y-4">
          <Label className="font-semibold">Hero Patrimonio</Label>
          <Input
            placeholder="Badge"
            value={component.props.badge || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, badge: e.target.value })}
          />
          <Input
            placeholder="Titolo"
            value={component.props.title || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, title: e.target.value })}
          />
          <Input
            placeholder="Titolo evidenziato"
            value={component.props.highlightedTitle || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, highlightedTitle: e.target.value })}
          />
          <Textarea
            placeholder="Sottotitolo"
            value={component.props.subtitle || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, subtitle: e.target.value })}
          />
          <Input
            placeholder="Testo CTA"
            value={component.props.ctaText || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, ctaText: e.target.value })}
          />
           <Input
            placeholder="Link CTA"
            value={component.props.ctaLink || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, ctaLink: e.target.value })}
          />
          <Textarea
            placeholder="Disclaimer (HTML ammesso)"
            value={component.props.disclaimer || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, disclaimer: e.target.value })}
          />
        </div>
      );

    case 'value-stack':
      return (
        <div className="space-y-4">
          <Label className="font-semibold">Value Stack</Label>
          <Input
            placeholder="Titolo Principale"
            value={component.props.title || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, title: e.target.value })}
          />
          <Input
            placeholder="Titolo Evidenziato"
            value={component.props.highlightedTitle || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, highlightedTitle: e.target.value })}
          />
          <RepeaterField
            label="Componenti"
            value={component.props.items || []}
            fields={[
              { key: 'icon', type: 'text', label: 'Emoji Icona' },
              { key: 'title', type: 'text', label: 'Titolo' },
              { key: 'value', type: 'text', label: 'Valore' },
              { key: 'description', type: 'textarea', label: 'Descrizione' },
            ]}
            onChange={(newItems) => onUpdateComponent(component.id, { ...component.props, items: newItems })}
          />
          <Input
            placeholder="Valore Totale"
            value={component.props.totalValue || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, totalValue: e.target.value })}
          />
          <Input
            placeholder="Testo Investimento"
            value={component.props.investment || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, investment: e.target.value })}
          />
        </div>
      );

    // Editor for the new 'candidature-cta' component
    case 'candidature-cta':
      return (
        <div className="space-y-4">
          <Label className="font-semibold">Call to Action Candidature</Label>
          <Textarea
            placeholder="Titolo Principale"
            value={component.props.title || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, title: e.target.value })}
          />
          <Textarea
            placeholder="Sottotitolo"
            value={component.props.subtitle || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, subtitle: e.target.value })}
          />
          <Input
            placeholder="Testo Bottone"
            value={component.props.ctaText || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, ctaText: e.target.value })}
          />
          <Input
            placeholder="Link Bottone"
            value={component.props.ctaLink || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, ctaLink: e.target.value })}
          />
          <Textarea
            placeholder="Disclaimer"
            value={component.props.disclaimer || ''}
            onChange={e => onUpdateComponent(component.id, { ...component.props, disclaimer: e.target.value })}
          />
        </div>
      );

    // --- NEW CASES FOR PROJECT DETAIL CARD ---
    case 'project-detail-card':
        return (
            <div className="space-y-4">
                <Label className="font-semibold">Dettaglio Progetto</Label>
                <Input
                    type="number"
                    placeholder="ID Progetto"
                    value={component.props.projectId || ''}
                    onChange={(e) => onUpdateComponent(component.id, { ...component.props, projectId: parseInt(e.target.value, 10) || null })}
                />
                <div className="flex items-center justify-between rounded-lg border p-3">
                    <Label className="text-xs">Mostra Bottone Indietro</Label>
                    <Switch
                        checked={component.props.showBackButton || false}
                        onCheckedChange={(checked) => onUpdateComponent(component.id, { ...component.props, showBackButton: checked })}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-medium">Colore Sfondo</Label>
                    <Input
                        type="color"
                        value={component.props.backgroundColor || '#ffffff'}
                        onChange={(e) => onUpdateComponent(component.id, { ...component.props, backgroundColor: e.target.value })}
                        className="h-8 w-full p-0 border-0"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">Padding Verticale (px)</Label>
                    <Slider
                        value={[parseInt(String(component.props.paddingY), 10) || 80]}
                        onValueChange={([val]) => onUpdateComponent(component.id, { ...component.props, paddingY: val })}
                        min={0}
                        max={200}
                        step={4}
                    />
                </div>
            </div>
        );
    // --- END NEW CASES ---

    default:
      return null;
  }
}


// DragDropPageBuilder Component
export function DragDropPageBuilder({ pageToEdit, onClose }: DragDropPageBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BuilderPageFormData>({
    title: pageToEdit?.title || '',
    slug: pageToEdit?.slug || '',
    description: pageToEdit?.description || '',
    components: pageToEdit?.components || [],
    metaTitle: pageToEdit?.metaTitle || '',
    metaDescription: pageToEdit?.metaDescription || '',
    ogImage: pageToEdit?.ogImage || '',
  });
  const [components, setComponents] = useState<ComponentData[]>(pageToEdit?.components || []);
  const [selectedComponent, setSelectedComponent] = useState<ComponentData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync selected component with components array
  useEffect(() => {
    if (selectedComponent) {
      const updated = components.find(c => c.id === selectedComponent.id);
      if (updated && JSON.stringify(updated.props) !== JSON.stringify(selectedComponent.props)) {
        setSelectedComponent(updated);
      }
    }
  }, [components]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeData = active.data.current;

    setActiveId(null);
    if (!over) return;

    if (activeData?.isBlock) {
        const blockKey = activeData.blockKey;
        const block = ELEMENTI_PREDEFINITI.find(b => b.key === blockKey);
        if (block) {
            const newComponents = block.components.map((component, index) => ({
                ...component,
                id: `component-${Date.now()}-${index}`
            }));
            const overIndex = components.findIndex(c => c.id === over.id);
            if(overIndex !== -1) {
                const newComponentsArray = [...components];
                newComponentsArray.splice(overIndex, 0, ...newComponents);
                setComponents(newComponentsArray);
            } else {
                setComponents(prev => [...prev, ...newComponents]);
            }
        }
        return;
    }

    if (activeData?.type) {
      const draggedType = COMPONENT_TYPES.find(t => t.type === activeData.type);
      if (draggedType) {
        const newComponent: ComponentData = {
          id: `component-${Date.now()}`,
          type: draggedType.type,
          props: { ...DEFAULT_PROPS[draggedType.type] },
        };
        const overIndex = components.findIndex(c => c.id === over.id);

        if (overIndex !== -1) {
            const newComponentsArray = [...components];
            newComponentsArray.splice(overIndex, 0, newComponent);
            setComponents(newComponentsArray);
        } else {
             setComponents(prev => [...prev, newComponent]);
        }
      }
    } else if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        if (newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDeleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
  };

  const handleEditComponent = (id: string) => {
    const component = components.find(c => c.id === id);
    if (component) {
      setSelectedComponent(component);
    }
  };

  const handleUpdateComponentProps = (id: string, newProps: Record<string, any>) => {
    setComponents(prevComponents => {
      return prevComponents.map(c =>
        c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
      );
    });

    // Update selected component if it matches
    if (selectedComponent?.id === id) {
      setSelectedComponent(prev => prev ? { ...prev, props: { ...prev.props, ...newProps } } : null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: BuilderPageFormData) => {
      const payload = {
        title: data.title.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || null,
        metaTitle: data.metaTitle?.trim() || null,
        metaDescription: data.metaDescription?.trim() || null,
        ogImage: data.ogImage?.trim() || null,
        components: Array.isArray(components) ? components : [],
        isActive: true
      };

      if (pageToEdit) {
        return apiRequest('PUT', `/api/builder-pages/${pageToEdit.id}`, payload);
      } else {
        return apiRequest('POST', '/api/builder-pages', payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Successo!",
        description: pageToEdit ? "Pagina aggiornata con successo" : "Pagina creata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/builder-pages'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la pagina",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({ title: "Errore di Validazione", description: "Il titolo è obbligatorio", variant: "destructive" });
      return;
    }
    if (!formData.slug.trim()) {
      toast({ title: "Errore di Validazione", description: "Lo slug è obbligatorio", variant: "destructive" });
      return;
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug.trim())) {
      toast({ title: "Errore di Validazione", description: "Lo slug deve contenere solo lettere minuscole, numeri e trattini", variant: "destructive" });
      return;
    }

    saveMutation.mutate(formData);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex h-full flex-col">
        {/* Intestazione */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Costruttore di Pagine</h2>
              <p className="text-sm text-muted-foreground">Costruisci la tua pagina con il drag & drop</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} data-testid="button-close-builder">
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-page">
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva Pagina'}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenuto Principale */}
        <div className="flex flex-1 overflow-hidden">
          {/* Barra Laterale Sinistra */}
          <div className="w-72 border-r bg-muted/30 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Impostazioni Pagina */}
              <Collapsible defaultOpen>
                   <CollapsibleTrigger className="flex items-center gap-2 mb-4 w-full hover:opacity-80 transition-opacity">
                    <h3 className="font-bold text-lg">Impostazioni Pagina</h3>
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform ui-state-open:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <Label className="text-xs font-medium">Titolo Pagina</Label>
                            <Input
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Inserisci il titolo"
                              data-testid="input-page-title"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium">URL Slug</Label>
                            <Input
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                              placeholder="url-della-pagina"
                              data-testid="input-page-slug"
                            />
                          </div>

                          <Separator className="my-4" />

                          <div className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground">SEO</Label>

                            <div>
                              <Label className="text-xs font-medium">Meta Title</Label>
                              <Input
                                value={formData.metaTitle || ''}
                                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                                placeholder="Titolo SEO (30-60 caratteri)"
                                maxLength={60}
                                data-testid="input-meta-title"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {formData.metaTitle?.length || 0}/60 caratteri
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs font-medium">Meta Description</Label>
                              <Textarea
                                value={formData.metaDescription || ''}
                                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                                placeholder="Descrizione SEO (120-160 caratteri)"
                                maxLength={160}
                                rows={3}
                                data-testid="textarea-meta-description"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {formData.metaDescription?.length || 0}/160 caratteri
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs font-medium">OG Image</Label>
                              <Input
                                value={formData.ogImage || ''}
                                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                                placeholder="URL immagine per social media"
                                data-testid="input-og-image"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                </Collapsible>

                {/* Logica per raggruppare solo Blocchi Avanzati (esclusi Blocchi e Pagine) */}
                {Object.entries(
                    ELEMENTI_PREDEFINITI.reduce((acc, elemento) => {
                        const category = elemento.category || 'Altro';
                        // Esclude le categorie "Blocchi" e "Pagine"
                        if (category === 'Blocchi' || category === 'Pagine') {
                            return acc;
                        }
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(elemento);
                        return acc;
                    }, {} as Record<string, typeof ELEMENTI_PREDEFINITI>)
                ).map(([category, elements]) => (
                    <Collapsible key={category} defaultOpen>
                        <CollapsibleTrigger className="flex items-center gap-2 mb-4 w-full hover:opacity-80 transition-opacity">
                            <h3 className="font-bold text-lg">{category}</h3>
                            <ChevronDown className="h-4 w-4 ml-auto transition-transform ui-state-open:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2">
                            {elements.map((block) => (
                                <BlockLibraryItem key={block.key} block={block} />
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                ))}

              {/* Libreria Componenti */}
              <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 mb-4 w-full hover:opacity-80 transition-opacity">
                    <h3 className="font-bold text-lg">Componenti</h3>
                    <ChevronDown className="h-4 w-4 ml-auto transition-transform ui-state-open:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                      {Object.entries(
                        COMPONENT_TYPES.reduce((acc, component) => {
                            const category = component.category || 'Altro';
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(component);
                            return acc;
                        }, {} as Record<string, typeof COMPONENT_TYPES>)
                    ).map(([category, components]) => (
                      <div key={category} className="mb-4">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                          {category}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {components.map((componentType) => (
                               <ComponentLibraryItem key={componentType.type} componentType={componentType} />
                          ))}
                        </div>
                      </div>
                      ))}</CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Centro - Anteprima Live */}
          <div className="flex-1 overflow-y-auto bg-muted/20">
            <div className="h-full p-4">
                 {components.length === 0 ? (
                    <EmptyDropZone />
                 ) : (
                    <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <BuilderPageRenderer
                           page={{
                            ...formData,
                            components,
                            id: pageToEdit?.id || 0,
                            isActive: true,
                            description: formData.description || null,
                            metaTitle: formData.metaTitle || null,
                            metaDescription: formData.metaDescription || null,
                            ogImage: formData.ogImage || null,
                          }}
                          isEditing={true}
                          onComponentClick={handleEditComponent}
                          onComponentDelete={handleDeleteComponent}
                          selectedComponentId={selectedComponent?.id}
                        />
                    </SortableContext>
                 )}
            </div>
          </div>

          {/* Barra Laterale Destra */}
          {selectedComponent && (
            <div className="w-80 border-l p-4 overflow-y-auto bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Modifica Componente</h3>
                <Button size="sm" variant="ghost" onClick={() => setSelectedComponent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Renderizza editor universale basato su COMPONENT_EDITOR_CONFIG */}
              <ComponentPropertiesEditor
                component={selectedComponent}
                onUpdate={(newProps) => handleUpdateComponentProps(selectedComponent.id, newProps)}
              />

              {/* Renderizza editor specifico se esiste (per componenti complessi come pricing-plans) */}
              <RenderComponentEditor
                component={selectedComponent}
                onUpdateComponent={handleUpdateComponentProps}
              />
            </div>
          )}
        </div>
      </div>

        <DragOverlay>
          {activeId ? (
            <Card className="opacity-50">
              <CardContent className="p-4">
                <p>Trascinamento in corso...</p>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}