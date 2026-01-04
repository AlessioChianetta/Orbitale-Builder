import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TenantInfo {
  id: number;
  name: string;
  domain: string;
  logo: string | null;
}

interface FooterSettings {
  email?: string;
  phone?: string;
  address?: string;
  copyrightText?: string;
  showContactInfo?: boolean;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  tenantId: number;
}

export default function Footer() {
  // Carica informazioni del tenant, usando l'utente autenticato se disponibile
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: !!localStorage.getItem('token'),
    retry: false
  });

  const { data: tenantInfo } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      console.log('🔍 Footer fetching tenant info, has token:', !!token);
      
      if (token) {
        try {
          const response = await fetch('/api/tenant/info', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Footer authenticated tenant:', data);
            return data;
          }
          console.log('⚠️ Footer tenant/info failed:', response.status);
        } catch (error) {
          console.error('❌ Footer tenant/info error:', error);
        }
      }
      
      // Solo se non autenticato, usa endpoint pubblico
      console.log('🔍 Footer fallback to public tenant');
      const response = await fetch('/api/tenant/public');
      const data = await response.json();
      console.log('📍 Footer public tenant:', data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Carica impostazioni footer
  const { data: footerSettings } = useQuery<FooterSettings>({
    queryKey: ['/api/settings/public'],
    queryFn: async () => {
      const response = await fetch('/api/settings/public');
      const data = await response.json();
      return data.footerSettings || {};
    },
    staleTime: 5 * 60 * 1000
  });

  // Usa valori predefiniti se non impostati
  const email = footerSettings?.email || 'info@example.com';
  const phone = footerSettings?.phone || '+39 02 1234 5678';
  const address = footerSettings?.address || '';
  const copyrightText = footerSettings?.copyrightText || `© ${new Date().getFullYear()} ${tenantInfo?.name || 'Sito'}. Tutti i diritti riservati.`;
  const showContactInfo = footerSettings?.showContactInfo !== false;

  return (
    <footer className="bg-secondary text-secondary-foreground py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Brand Section */}
          <div className="flex items-center space-x-2">
            {tenantInfo?.logo ? (
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
                  className="h-6 w-auto"
                  width="24"
                  height="24"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            ) : (
              <div className="h-6 w-6 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {tenantInfo?.name?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
            )}
            <span className="font-heading font-bold text-lg">{tenantInfo?.name || 'Sito'}</span>
          </div>

          {/* Contact Info */}
          {showContactInfo && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              {email && (
                <div className="flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>{email}</span>
                </div>
              )}
              {phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-3 w-3" />
                  <span>{phone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{address}</span>
                </div>
              )}
            </div>
          )}

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}