import BlogCard from '../BlogCard';

export default function BlogCardExample() {
  const blogPosts = [
    {
      title: "Come Ottimizzare il Tuo Sito Web per le Conversioni",
      excerpt: "Scopri le strategie più efficaci per trasformare i visitatori in clienti attraverso l'ottimizzazione delle landing page e l'analisi del comportamento utente.",
      author: "Marco Rossi",
      publishDate: "2024-01-15",
      readTime: "5 min",
      category: "Marketing",
      slug: "ottimizzare-sito-conversioni",
      featured: true
    },
    {
      title: "Guida Completa al SEO per E-commerce",
      excerpt: "Tutto quello che devi sapere per posizionare il tuo e-commerce sui motori di ricerca e aumentare il traffico organico.",
      author: "Laura Bianchi",
      publishDate: "2024-01-10",
      readTime: "8 min",
      category: "SEO",
      slug: "guida-seo-ecommerce"
    },
    {
      title: "Le Tendenze del Web Design 2024",
      excerpt: "Esplora le ultime tendenze del design web che stanno definendo l'esperienza utente moderna e come implementarle nei tuoi progetti.",
      author: "Andrea Verdi",
      publishDate: "2024-01-05",
      readTime: "6 min",
      category: "Design",
      slug: "tendenze-web-design-2024"
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {blogPosts.map((post, index) => (
        <BlogCard key={index} {...post} />
      ))}
    </div>
  );
}