// src/pages/Contatti.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContactForm from "@/components/ContactForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Phone, Mail, ArrowRight, CheckCircle, Headphones, Zap, Users } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SEOHead, useSEOPerformance } from "@/components/SEOHead";

const benefits = [
  { icon: CheckCircle, title: "Consulenza Gratuita", description: "Prima consulenza sempre gratuita e senza impegno" },
  { icon: Headphones, title: "Supporto Dedicato", description: "Account manager dedicato per tutto il progetto" },
  { icon: Zap, title: "Risposta Rapida", description: "Risposta garantita entro 2 ore in orario lavorativo" },
  { icon: Users, title: "Team Esperto", description: "Oltre 15 anni di esperienza nel settore digitale" }
];

export default function Contatti() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // SEO Performance monitoring
  useSEOPerformance('contatti');

  // Carichiamo i dati di contatto dall'API
  const { data: contactInfo, isLoading } = useQuery({
      queryKey: ['/api/settings/contactInfo'],
      queryFn: async () => apiRequest('GET', '/api/settings/public').then(res => res.json()),
  });

  return (
    <>
      <SEOHead 
        type="website"
        url="/contatti"
        usePageData={true}
      />
      <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="py-12 md:py-16 text-center bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">Contattaci</Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
            Parliamo del tuo Progetto.
          </h1>
          <p className="text-lg md:text-xl mt-6 text-slate-600">
            Siamo pronti ad ascoltare le tue idee e a trasformarle in un successo digitale. Inizia oggi con una consulenza gratuita e senza impegno.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                        <div key={benefit.title} className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-full w-fit mt-1"><Icon className="h-6 w-6 text-blue-600"/></div>
                            <div><h3 className="font-bold text-lg mb-1">{benefit.title}</h3><p className="text-slate-600 text-sm">{benefit.description}</p></div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* Main CTA & Info Section */}
      <section className="py-20 md:py-24 bg-slate-50 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Pronto a Fare il Prossimo Passo?</h2>
              <p className="mt-4 text-lg text-slate-600">
                Il modo più efficace per iniziare è compilare il nostro modulo di contatto. Ci permette di capire a fondo le tue esigenze prima della nostra chiamata, così da poterti offrire il massimo valore fin dal primo minuto.
              </p>
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="mt-8 px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white font-bold">
                    Inizia Ora Compilando il Form
                    <ArrowRight className="ml-2 h-5 w-5"/>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Raccontaci il Tuo Progetto</DialogTitle>
                  </DialogHeader>
                  <ContactForm onSubmitSuccess={() => setIsFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-8">
                <h3 className="text-xl font-semibold">Oppure, usa i nostri canali diretti:</h3>
                {isLoading ? <p>Caricamento info...</p> :
                (<>
                    <div className="flex items-center gap-4"><Phone className="h-6 w-6 text-blue-600"/><a href={`tel:${contactInfo?.contactPhone}`} className="hover:text-blue-600">{contactInfo?.contactPhone}</a></div>
                    <div className="flex items-center gap-4"><Mail className="h-6 w-6 text-blue-600"/><a href={`mailto:${contactInfo?.contactEmail}`} className="hover:text-blue-600">{contactInfo?.contactEmail}</a></div>
                    <div className="flex items-center gap-4"><MapPin className="h-6 w-6 text-blue-600"/><span>{contactInfo?.address}</span></div>
                </>)}
            </div>
          </div>
        </div>
      </section>

      {/* Office Hours & Map */}
      <section className="py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12">
            <div>
                <h3 className="text-2xl font-bold mb-4">Orari di Apertura</h3>
                <p className="text-slate-600">{contactInfo?.officeHours}</p>
            </div>
            <div className="bg-slate-200 rounded-lg h-80 flex items-center justify-center">
                <p className="text-slate-500">Mappa qui</p>
            </div>
        </div>
      </section>
    </div>
    </>
  );
}