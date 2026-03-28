import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  id: string;
  label: string;
  href: string;
  isVisible: boolean;
  order: number;
}

interface TenantInfo {
  id: number;
  name: string;
  domain: string;
  logo: string | null;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  tenantId: number;
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [location] = useLocation();

  // Carica informazioni del tenant dell'utente autenticato
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: !!localStorage.getItem('authToken'),
    retry: false
  });

  const { data: tenantInfo } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/tenant/info', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          return await response.json();
        }
        // Se fallisce l'API autenticata, non fare fallback al pubblico
        throw new Error('Failed to fetch authenticated tenant info');
      }
      // Solo se non c'è token, usa l'endpoint pubblico
      const response = await fetch('/api/tenant/public');
      if (!response.ok) {
        return { id: 0, name: 'Sito', domain: 'localhost', logo: null };
      }
      return await response.json();
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    retry: false // Non fare retry se fallisce
  });

  // Carica i link della navbar dal database
  const { data: navItems = [], isLoading } = useQuery({
    queryKey: ['/api/settings/navbar', user?.id, tenantInfo?.id],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/settings/navbar', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch navbar items');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!tenantInfo,
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    retry: false
  });

  // Filtra solo i link visibili e ordina per order
  const visibleNavItems = navItems
    .filter((item: NavItem) => item.isVisible)
    .sort((a: NavItem, b: NavItem) => a.order - b.order);

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  // Effect per gestire la visibilità dell'header allo scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Nasconde l'header quando si scorre verso il basso oltre una certa soglia
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true);
      } else {
      // Mostra l'header quando si scorre verso l'alto
        setIsHidden(false);
      }

      // Aggiorna l'ultima posizione di scroll
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Pulisce l'event listener quando il componente viene smontato
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  


  return (
    <header 
      className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-transform duration-300 ease-in-out",
        isHidden && "-translate-y-full" // Applica la trasformazione per nascondere/mostrare
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            {tenantInfo?.logo && (
              <picture>
                <source 
                  type="image/avif" 
                  srcSet="/images/logo-optimized.avif 1x, /images/logo-optimized@2x.avif 2x" 
                />
                <source 
                  type="image/webp" 
                  srcSet="/images/logo-optimized.webp 1x, /images/logo-optimized@2x.webp 2x" 
                />
                <img 
                  src={tenantInfo.logo}
                  alt={tenantInfo.name}
                  className="h-8 w-auto"
                  width="48"
                  height="48"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </picture>
            )}
            <span className="font-heading font-bold text-xl text-foreground">
              {tenantInfo?.name || 'Sito'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {visibleNavItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors font-medium",
                  isActive(item.href) && "text-foreground"
                )}
                data-testid={`link-nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button and User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {!user && (
              <>
                <Button asChild variant="ghost" size="sm" data-testid="button-admin-login">
                  <Link href="/admin" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </Button>
                <Button asChild className="bg-destructive hover:bg-destructive/90" data-testid="button-contact-cta">
                  <Link href="/contatti">Richiedi Consulenza</Link>
                </Button>
              </>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Dashboard Admin</span>
                        </Link>
                      </DropdownMenuItem>
                      {user.role === 'superadmin' && (
                        <DropdownMenuItem asChild>
                          <Link href="/superadmin" className="cursor-pointer flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Super Admin</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => {
                      localStorage.removeItem('authToken');
                      window.location.href = '/';
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Esci</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label={isMobileMenuOpen ? "Chiudi menu" : "Apri menu"}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors",
                    isActive(item.href) && "text-foreground bg-muted"
                  )}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid={`link-mobile-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  {item.label}
                </Link>
              ))}
              {!user && (
                <div className="pt-4 space-y-2">
                  <Link 
                    href="/admin" 
                    className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="inline-block mr-2 h-4 w-4" />
                    Admin
                  </Link>
                  <Button 
                    asChild 
                    className="w-full bg-destructive hover:bg-destructive/90" 
                    data-testid="button-mobile-contact-cta"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/contatti">Richiedi Consulenza</Link>
                  </Button>
                </div>
              )}
              
              {user && (
                <div className="pt-4 space-y-2 border-t mt-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {(user.role === 'admin' || user.role === 'superadmin') && (
                    <>
                      <Link 
                        href="/admin" 
                        className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="inline-block mr-2 h-4 w-4" />
                        Dashboard Admin
                      </Link>
                      {user.role === 'superadmin' && (
                        <Link 
                          href="/superadmin" 
                          className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="inline-block mr-2 h-4 w-4" />
                          Super Admin
                        </Link>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      localStorage.removeItem('authToken');
                      window.location.href = '/';
                    }}
                    className="w-full text-left px-3 py-2 text-base font-medium text-destructive hover:bg-muted rounded-md"
                  >
                    <LogOut className="inline-block mr-2 h-4 w-4" />
                    Esci
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}