import TestimonialCard from '../TestimonialCard';

export default function TestimonialCardExample() {
  const testimonials = [
    {
      name: "Marco Rossi",
      role: "CEO",
      company: "TechStart SRL",
      content: "Il sistema CMS ha trasformato completamente il nostro approccio al marketing digitale. Le conversioni sono aumentate del 340% in soli 3 mesi. Un investimento che si è ripagato immediatamente.",
      rating: 5,
      featured: true
    },
    {
      name: "Laura Bianchi",
      role: "Marketing Director",
      company: "Fashion Hub",
      content: "Incredibile! Le landing page ottimizzate hanno migliorato drasticamente le nostre campagne. Il team è sempre disponibile e professionale.",
      rating: 5
    },
    {
      name: "Andrea Verdi",
      role: "Founder",
      company: "GreenTech Solutions",
      content: "Finalmente un CMS che permette di gestire tutto in autonomia. Il blog integrato ha dato una spinta enorme alla nostra SEO.",
      rating: 4
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {testimonials.map((testimonial, index) => (
        <TestimonialCard key={index} {...testimonial} />
      ))}
    </div>
  );
}