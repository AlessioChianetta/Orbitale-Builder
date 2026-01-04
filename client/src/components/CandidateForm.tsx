import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, FileText, Send, CheckCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";

const candidateSchema = z.object({
  nome: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  email: z.string().email("Inserisci un indirizzo email valido"),
  telefono: z.string().min(10, "Inserisci un numero di telefono valido"),
  eta: z.string().min(1, "Seleziona la tua età"),
  esperienza: z.string().min(1, "Seleziona il tuo livello di esperienza"),
  settore: z.string().min(1, "Seleziona il settore di interesse"),
  motivazione: z.string().min(50, "La motivazione deve avere almeno 50 caratteri"),
  disponibilita: z.string().min(1, "Seleziona la tua disponibilità"),
  budget: z.string().min(1, "Seleziona il budget disponibile"),
  privacy: z.boolean().refine(val => val === true, "Devi accettare la privacy policy"),
  newsletter: z.boolean().optional()
});

type CandidateFormData = z.infer<typeof candidateSchema>;

const etaOptions = [
  { value: "18-25", label: "18-25 anni" },
  { value: "26-35", label: "26-35 anni" },
  { value: "36-45", label: "36-45 anni" },
  { value: "46-55", label: "46-55 anni" },
  { value: "55+", label: "55+ anni" }
];

const esperienzaOptions = [
  { value: "principiante", label: "Principiante", description: "0-1 anni di esperienza" },
  { value: "intermedio", label: "Intermedio", description: "2-5 anni di esperienza" },
  { value: "avanzato", label: "Avanzato", description: "5+ anni di esperienza" },
  { value: "esperto", label: "Esperto", description: "10+ anni di esperienza" }
];

const settoriOptions = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "servizi", label: "Servizi Professionali" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "salute", label: "Salute e Benessere" },
  { value: "educazione", label: "Educazione" },
  { value: "immobiliare", label: "Immobiliare" },
  { value: "altro", label: "Altro" }
];

export default function CandidateForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  // Fetch candidate form settings
  const { data: settingsData } = useQuery({
    queryKey: ['/api/candidate-form-settings'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const settings = settingsData || {};
  
  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      eta: "",
      esperienza: "",
      settore: "",
      motivazione: "",
      disponibilita: "",
      budget: "",
      privacy: false,
      newsletter: false
    }
  });

  const { mutate: createLead, isPending: isCreatingLead } = useMutation({
    mutationFn: async (leadData: any) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'invio della candidatura');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Candidatura inviata!",
        description: "Il nostro team la esaminerà e ti contatterà entro 48 ore.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: CandidateFormData) => {
    const leadData = {
      name: `${data.nome} ${data.cognome}`.trim(),
      email: data.email,
      phone: data.telefono || undefined,
      company: undefined,
      message: `CANDIDATURA LEAD GENERATION
      
Età: ${data.eta}
Esperienza: ${data.esperienza}
Settore: ${data.settore}
Disponibilità: ${data.disponibilita}
Budget: ${data.budget}

Motivazione:
${data.motivazione}

Newsletter: ${data.newsletter ? 'Sì' : 'No'}`,
      source: 'candidatura-lead-generation',
      candidateData: {
        eta: data.eta,
        esperienza: data.esperienza,
        settore: data.settore,
        motivazione: data.motivazione,
        disponibilita: data.disponibilita,
        budget: data.budget,
        privacy: data.privacy,
        newsletter: data.newsletter
      }
    };

    createLead(leadData);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-2xl" data-testid="heading-candidate-success">
                {settings.successTitle || "Candidatura Inviata con Successo!"}
              </h3>
              <p className="text-muted-foreground" data-testid="text-candidate-success">
                {settings.successDescription || "Grazie per il tuo interesse. Il nostro team esaminerà la tua candidatura e ti contatterà entro 48 ore."}
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Prossimi Passi:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Riceverai una email di conferma entro 1 ora</li>
                <li>• Il nostro team esaminerà la tua candidatura</li>
                <li>• Ti contatteremo per un colloquio preliminare</li>
                <li>• Se selezionato, riceverai un piano personalizzato</li>
              </ul>
            </div>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              data-testid="button-new-application"
            >
              Invia una Nuova Candidatura
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
          <User className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-heading text-3xl" data-testid="heading-candidate-form">
          {settings.title || "Candidatura Lead Generation"}
        </CardTitle>
        <CardDescription className="text-lg" data-testid="text-candidate-description">
          {settings.description || "Compila il form per accedere al nostro programma esclusivo di crescita digitale"}
        </CardDescription>
        <Badge className="mx-auto bg-destructive text-destructive-foreground">
          {settings.badge || "Posti Limitati - Solo 20 Candidature al Mese"}
        </Badge>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informazioni Personali */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg border-b pb-2">Informazioni Personali</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Il tuo nome" {...field} data-testid="input-candidate-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cognome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Il tuo cognome" {...field} data-testid="input-candidate-cognome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            placeholder="email@esempio.it" 
                            className="pl-10"
                            {...field} 
                            data-testid="input-candidate-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="tel" 
                            placeholder="+39 123 456 7890" 
                            className="pl-10"
                            {...field} 
                            data-testid="input-candidate-telefono"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="eta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fascia di Età *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-candidate-eta">
                          <SelectValue placeholder="Seleziona la tua fascia di età" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {etaOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Esperienza Professionale */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg border-b pb-2">Esperienza Professionale</h3>
              
              <FormField
                control={form.control}
                name="esperienza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Livello di Esperienza *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        data-testid="radio-candidate-esperienza"
                      >
                        {esperienzaOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-3 hover-elevate">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <div className="flex-1">
                              <label htmlFor={option.value} className="cursor-pointer">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settore di Interesse *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-candidate-settore">
                          <SelectValue placeholder="Seleziona il settore di interesse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settoriOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Motivazione e Obiettivi */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg border-b pb-2">Motivazione e Obiettivi</h3>
              
              <FormField
                control={form.control}
                name="motivazione"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perché vuoi partecipare al programma? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrivi le tue motivazioni, obiettivi e cosa speri di ottenere dal programma..."
                        className="min-h-[120px]"
                        {...field}
                        data-testid="textarea-candidate-motivazione"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="disponibilita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilità Settimanale *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-candidate-disponibilita">
                            <SelectValue placeholder="Ore disponibili a settimana" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="5-10">5-10 ore/settimana</SelectItem>
                          <SelectItem value="10-20">10-20 ore/settimana</SelectItem>
                          <SelectItem value="20-30">20-30 ore/settimana</SelectItem>
                          <SelectItem value="30+">30+ ore/settimana</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Investimento *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-candidate-budget">
                            <SelectValue placeholder="Budget disponibile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="500-1000">€500 - €1.000</SelectItem>
                          <SelectItem value="1000-2500">€1.000 - €2.500</SelectItem>
                          <SelectItem value="2500-5000">€2.500 - €5.000</SelectItem>
                          <SelectItem value="5000+">€5.000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Privacy e Consensi */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg border-b pb-2">Consensi</h3>
              
              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-candidate-privacy"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Accetto la <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> e autorizzo il trattamento dei dati per la valutazione della candidatura *
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newsletter"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-candidate-newsletter"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Desidero ricevere contenuti esclusivi e aggiornamenti sul programma
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-destructive hover:bg-destructive/90 h-12 text-lg font-semibold"
                disabled={isCreatingLead}
                data-testid="button-submit-candidate"
              >
                {isCreatingLead ? (
                  settings.loadingText || "Invio candidatura in corso..."
                ) : (
                  <>
                    {settings.submitText || "Invia Candidatura"}
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                {settings.footerText || "La tua candidatura verrà esaminata entro 48 ore"}
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}