import type { Lead, MarketingLead } from "../../shared/schema";

// Type-specific details interfaces
interface CrmLeadDetails {
  company: string | null;
  message: string | null;
  notes: string | null;
}

interface MarketingLeadDetails {
  campaign: string;
  emailSent: boolean;
  whatsappSent: boolean;
  businessName: string | null;
  additionalData: Record<string, any> | null;
}

// Unified Lead interface
export interface UnifiedLead {
  id: string;
  type: 'crm' | 'marketing';
  fullName: string;
  email: string;
  phone: string | null;
  source: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  details: CrmLeadDetails | MarketingLeadDetails;
}

// Type guard to check if details are CRM details
export function isCrmLeadDetails(details: CrmLeadDetails | MarketingLeadDetails): details is CrmLeadDetails {
  return 'company' in details || 'message' in details || 'notes' in details;
}

// Type guard to check if details are Marketing details
export function isMarketingLeadDetails(details: CrmLeadDetails | MarketingLeadDetails): details is MarketingLeadDetails {
  return 'campaign' in details;
}

/**
 * Maps a CRM lead to the unified lead format
 */
export function mapCrmLead(lead: Lead): UnifiedLead {
  return {
    id: lead.id,
    type: 'crm',
    fullName: lead.name,
    email: lead.email,
    phone: lead.phone || null,
    source: lead.source || null,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    details: {
      company: lead.company || null,
      message: lead.message || null,
      notes: lead.notes || null,
    },
  };
}

/**
 * Maps a marketing lead to the unified lead format
 */
export function mapMarketingLead(lead: MarketingLead): UnifiedLead {
  // Combine first and last name, fallback to business name or email
  const fullName = [lead.firstName, lead.lastName]
    .filter(Boolean)
    .join(' ') || lead.businessName || lead.email;

  return {
    id: lead.id.toString(),
    type: 'marketing',
    fullName,
    email: lead.email,
    phone: lead.phone || null,
    source: lead.source || null,
    status: lead.status || 'new',
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    details: {
      campaign: lead.campaign,
      emailSent: lead.emailSent || false,
      whatsappSent: lead.whatsappSent || false,
      businessName: lead.businessName || null,
      additionalData: lead.additionalData || null,
    },
  };
}

/**
 * Sorts leads by date
 * @param leads - Array of unified leads
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array of unified leads
 */
export function sortLeadsByDate(leads: UnifiedLead[], order: 'asc' | 'desc' = 'desc'): UnifiedLead[] {
  return [...leads].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Filters leads by type
 * @param leads - Array of unified leads
 * @param type - Lead type to filter by (optional)
 * @returns Filtered array of unified leads
 */
export function filterLeadsByType(
  leads: UnifiedLead[],
  type?: 'crm' | 'marketing'
): UnifiedLead[] {
  if (!type) {
    return leads;
  }
  
  return leads.filter(lead => lead.type === type);
}

/**
 * Filters leads by status
 * @param leads - Array of unified leads
 * @param status - Status to filter by
 * @returns Filtered array of unified leads
 */
export function filterLeadsByStatus(
  leads: UnifiedLead[],
  status: string
): UnifiedLead[] {
  return leads.filter(lead => lead.status === status);
}

/**
 * Groups leads by type
 * @param leads - Array of unified leads
 * @returns Object with leads grouped by type
 */
export function groupLeadsByType(leads: UnifiedLead[]): {
  crm: UnifiedLead[];
  marketing: UnifiedLead[];
} {
  return leads.reduce(
    (acc, lead) => {
      acc[lead.type].push(lead);
      return acc;
    },
    { crm: [] as UnifiedLead[], marketing: [] as UnifiedLead[] }
  );
}

/**
 * Maps multiple CRM leads to unified format
 */
export function mapCrmLeads(leads: Lead[]): UnifiedLead[] {
  return leads.map(mapCrmLead);
}

/**
 * Maps multiple marketing leads to unified format
 */
export function mapMarketingLeads(leads: MarketingLead[]): UnifiedLead[] {
  return leads.map(mapMarketingLead);
}

/**
 * Combines and sorts CRM and marketing leads
 */
export function combineAndSortLeads(
  crmLeads: Lead[],
  marketingLeads: MarketingLead[],
  order: 'asc' | 'desc' = 'desc'
): UnifiedLead[] {
  const unified = [
    ...mapCrmLeads(crmLeads),
    ...mapMarketingLeads(marketingLeads),
  ];
  
  return sortLeadsByDate(unified, order);
}
