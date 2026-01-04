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
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const contactSchema = z.object({
  nome: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  cognome: z.string().min(2, "Il cognome deve avere almeno 2 caratteri"),
  email: z.string().email("Inserisci un indirizzo email valido"),
  telefono: z.string().optional(),
  azienda: z.string().optional(),
  servizio: z.string().min(1, "Seleziona un servizio"),
  messaggio: z.string().min(10, "Il messaggio deve avere almeno 10 caratteri"),
  privacy: z.boolean().refine(val => val === true, "Devi accettare la privacy policy"),
  newsletter: z.boolean().optional()
});

type ContactFormData = z.infer<typeof contactSchema>;

const servizi = [
  { value: "consulenza", label: "Consulenza Strategica" },
  { value: "sviluppo", label: "Sviluppo Web" },
  { value: "marketing", label: "Marketing Digitale" },
  { value: "seo", label: "Ottimizzazione SEO" },
  { value: "altro", label: "Altro" }
];

export default function ContactForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      azienda: "",
      servizio: "",
      messaggio: "",
      privacy: false,
      newsletter: false
    }
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
      message: string;
      source: string;
    }) => {
      const response = await apiRequest("POST", "/api/leads", leadData);
      return response.json();
    },
    onSuccess: (data) => {
      setIsSubmitted(true);
      form.reset();
      // Invalidate leads query for admin views
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({
        title: "Messaggio inviato!",
        description: "Ti risponderemo entro 24 ore.",
      });
      console.log('Lead created:', data?.id);
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova più tardi.",
        variant: "destructive"
      });
      console.error('Lead submission error:', error);
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    // Map form data to lead schema
    const leadData = {
      name: `${data.nome} ${data.cognome}`.trim(),
      email: data.email,
      phone: data.telefono || undefined,
      company: data.azienda || undefined,
      message: data.messaggio,
      source: `contact-form-${data.servizio}`
    };

    createLeadMutation.mutate(leadData);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-heading font-semibold text-xl" data-testid="heading-success">
              Messaggio Inviato con Successo!
            </h3>
            <p className="text-muted-foreground" data-testid="text-success">
              Grazie per averci contattato. Il nostro team ti risponderà entro 24 ore.
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              data-testid="button-send-another"
            >
              Invia un Altro Messaggio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-heading text-2xl text-center" data-testid="heading-contact-form">
          Contattaci
        </CardTitle>
        <CardDescription className="text-center" data-testid="text-contact-description">
          Compila il form per ricevere una consulenza gratuita
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome e Cognome */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Il tuo nome" {...field} data-testid="input-nome" />
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
                      <Input placeholder="Il tuo cognome" {...field} data-testid="input-cognome" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email e Telefono */}
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
                          data-testid="input-email"
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
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          placeholder="+39 123 456 7890" 
                          className="pl-10"
                          {...field} 
                          data-testid="input-telefono"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Azienda */}
            <FormField
              control={form.control}
              name="azienda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Azienda</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome della tua azienda" {...field} data-testid="input-azienda" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Servizio */}
            <FormField
              control={form.control}
              name="servizio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servizio di Interesse *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-servizio">
                        <SelectValue placeholder="Seleziona un servizio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servizi.map((servizio) => (
                        <SelectItem key={servizio.value} value={servizio.value}>
                          {servizio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Messaggio */}
            <FormField
              control={form.control}
              name="messaggio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Messaggio *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrivi il tuo progetto o le tue esigenze..."
                      className="min-h-[120px]"
                      {...field}
                      data-testid="textarea-messaggio"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Privacy e Newsletter */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-privacy"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Accetto la <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> *
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
                        data-testid="checkbox-newsletter"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Desidero ricevere aggiornamenti e offerte via email
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-destructive hover:bg-destructive/90"
              disabled={createLeadMutation.isPending}
              data-testid="button-submit-contact"
            >
              {createLeadMutation.isPending ? (
                "Invio in corso..."
              ) : (
                <>
                  Invia Messaggio
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}