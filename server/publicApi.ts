import { Router, Request, Response } from "express";
import { validateApiKey, requireAnyScope } from "./middleware/apiKey";
import { storage } from "./storage";

const router = Router();

// Tutti gli endpoint pubblici richiedono una API key valida
router.use(validateApiKey);

/**
 * GET /api/public/leads
 * Restituisce tutti i lead del tenant (sia da CRM che da marketing)
 * Richiede scope: "leads:read" o "marketing_leads:read"
 */
router.get("/leads", requireAnyScope(["leads:read", "marketing_leads:read"]), async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    const apiKey = (req as any).apiKey;

    if (!tenant || !tenant.id) {
      return res.status(400).json({ error: "Tenant not found" });
    }

    console.log(`📊 [Public API] Lead request from API key: ${apiKey.name} (Tenant: ${tenant.name})`);

    // Query parameters per filtri
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000); // max 1000
    const offset = parseInt(req.query.offset as string) || 0;
    const source = req.query.source as string;
    const status = req.query.status as string;
    const type = req.query.type as string; // 'crm', 'marketing', o 'all' (default)

    const response: any = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain
      },
      data: {
        leads: [],
        crmLeads: [],
        marketingLeads: []
      },
      pagination: {
        limit,
        offset,
        total: 0
      }
    };

    const hasCrmPermission = apiKey.scopes.includes("leads:read");
    const hasMarketingPermission = apiKey.scopes.includes("marketing_leads:read");

    // Determina il tipo di query da eseguire
    const queryType = type || 'all';

    if (queryType === 'all' && hasCrmPermission && hasMarketingPermission) {
      // UNION query per combinare entrambi i tipi di lead e paginare correttamente
      const combinedResult = await storage.getCombinedLeads(tenant.id, limit, offset, source, status);
      
      // Separa i risultati per tipo
      response.data.leads = combinedResult.leads;
      response.data.crmLeads = combinedResult.leads.filter((lead: any) => lead.lead_type === 'crm');
      response.data.marketingLeads = combinedResult.leads.filter((lead: any) => lead.lead_type === 'marketing');
      response.pagination.total = combinedResult.total;

      console.log(`✅ [Public API] Combined query: ${response.data.crmLeads.length} CRM + ${response.data.marketingLeads.length} marketing = ${combinedResult.leads.length} total leads (${combinedResult.total} total in DB)`);
    } else if (queryType === 'crm' && hasCrmPermission) {
      // Solo lead CRM con filtri applicati in SQL
      const crmResult = await storage.getFilteredCrmLeads(tenant.id, limit, offset, source, status);
      
      response.data.crmLeads = crmResult.leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        message: lead.message,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
        lead_type: 'crm'
      }));
      response.data.leads = response.data.crmLeads;
      response.pagination.total = crmResult.total;

      console.log(`✅ [Public API] CRM only: ${crmResult.leads.length} leads (${crmResult.total} total)`);
    } else if (queryType === 'marketing' && hasMarketingPermission) {
      // Solo marketing leads con filtri applicati in SQL
      const marketingResult = await storage.getFilteredMarketingLeads(tenant.id, limit, offset, source);
      
      response.data.marketingLeads = marketingResult.leads.map(lead => ({
        id: lead.id,
        businessName: lead.businessName,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        campaign: lead.campaign,
        status: lead.status,
        emailSent: lead.emailSent,
        whatsappSent: lead.whatsappSent,
        additionalData: lead.additionalData,
        createdAt: lead.createdAt,
        lead_type: 'marketing'
      }));
      response.data.leads = response.data.marketingLeads;
      response.pagination.total = marketingResult.total;

      console.log(`✅ [Public API] Marketing only: ${marketingResult.leads.length} leads (${marketingResult.total} total)`);
    } else if (queryType === 'all') {
      // type='all' ma ha solo uno dei permessi
      if (hasCrmPermission) {
        const crmResult = await storage.getFilteredCrmLeads(tenant.id, limit, offset, source, status);
        response.data.crmLeads = crmResult.leads.map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          message: lead.message,
          source: lead.source,
          status: lead.status,
          notes: lead.notes,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          lead_type: 'crm'
        }));
        response.data.leads = response.data.crmLeads;
        response.pagination.total = crmResult.total;
        console.log(`✅ [Public API] CRM only (no marketing permission): ${crmResult.leads.length} leads`);
      } else if (hasMarketingPermission) {
        const marketingResult = await storage.getFilteredMarketingLeads(tenant.id, limit, offset, source);
        response.data.marketingLeads = marketingResult.leads.map(lead => ({
          id: lead.id,
          businessName: lead.businessName,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          campaign: lead.campaign,
          status: lead.status,
          emailSent: lead.emailSent,
          whatsappSent: lead.whatsappSent,
          additionalData: lead.additionalData,
          createdAt: lead.createdAt,
          lead_type: 'marketing'
        }));
        response.data.leads = response.data.marketingLeads;
        response.pagination.total = marketingResult.total;
        console.log(`✅ [Public API] Marketing only (no CRM permission): ${marketingResult.leads.length} leads`);
      }
    } else {
      return res.status(403).json({ error: "Insufficient permissions for requested lead type" });
    }

    res.json(response);
  } catch (error) {
    console.error("❌ [Public API] Error fetching leads:", error);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

/**
 * GET /api/public/leads/stats
 * Restituisce statistiche aggregate sui lead
 * Richiede scope: "leads:read" o "marketing_leads:read"
 */
router.get("/leads/stats", requireAnyScope(["leads:read", "marketing_leads:read"]), async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;

    if (!tenant || !tenant.id) {
      return res.status(400).json({ error: "Tenant not found" });
    }

    const stats: any = {
      tenant: {
        id: tenant.id,
        name: tenant.name
      },
      crmLeads: {
        total: 0,
        byStatus: {}
      },
      marketingLeads: {
        total: 0,
        byCampaign: {},
        bySource: {}
      }
    };

    // Stats CRM leads - usa aggregazione SQL
    const apiKey = (req as any).apiKey;
    if (apiKey.scopes.includes("leads:read")) {
      const crmStats = await storage.getCrmLeadsStats(tenant.id);
      stats.crmLeads.total = crmStats.total;
      stats.crmLeads.byStatus = crmStats.byStatus;
      
      console.log(`📊 [Public API] CRM stats: ${crmStats.total} total leads, ${Object.keys(crmStats.byStatus).length} statuses`);
    }

    // Stats marketing leads - usa aggregazione SQL
    if (apiKey.scopes.includes("marketing_leads:read")) {
      const marketingStats = await storage.getMarketingLeadsStats(tenant.id);
      stats.marketingLeads.total = marketingStats.total;
      stats.marketingLeads.byCampaign = marketingStats.byCampaign;
      stats.marketingLeads.bySource = marketingStats.bySource;
      
      console.log(`📊 [Public API] Marketing stats: ${marketingStats.total} total leads, ${Object.keys(marketingStats.byCampaign).length} campaigns, ${Object.keys(marketingStats.bySource).length} sources`);
    }

    res.json(stats);
  } catch (error) {
    console.error("❌ [Public API] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
