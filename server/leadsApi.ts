import { Router, Response } from "express";
import { db } from "./db";
import { leads, marketingLeads } from "../shared/schema";
import { validateApiKey, requireAnyScope, ApiKeyRequest } from "./middleware/apiKey";
import { eq, and, gte, sql } from "drizzle-orm";
import {
  mapCrmLead,
  mapMarketingLead,
  sortLeadsByDate,
  type UnifiedLead,
} from "./utils/leadsMapper";

const router = Router();

/**
 * GET /external/leads/stats
 * 
 * Calcola statistiche aggregate da entrambe le tabelle (CRM e Marketing Leads)
 * 
 * Query Parameters:
 * - type: 'crm' | 'marketing' | undefined (default: stats da entrambe le tabelle se permesso)
 * - days: filtra lead degli ultimi N giorni | 'all' (default: tutti i lead)
 * - source: filtra per sorgente (opzionale)
 * - campaign: filtra per campagna (solo marketing leads) (opzionale)
 * - status: filtra per status (opzionale)
 * 
 * Headers:
 * - X-API-Key o Authorization: Bearer <token>
 * 
 * Scopes richiesti:
 * - leads:read (per accedere alle stats CRM)
 * - marketing_leads:read (per accedere alle stats marketing)
 * - Almeno uno dei due è richiesto
 * 
 * Logica accesso:
 * - Se API key ha solo leads:read → solo stats CRM
 * - Se API key ha solo marketing_leads:read → solo stats marketing
 * - Se API key ha entrambi → stats combinate
 */
router.get(
  "/external/leads/stats",
  validateApiKey,
  requireAnyScope(["leads:read", "marketing_leads:read"]),
  async (req: ApiKeyRequest, res: Response) => {
    try {
      const tenant = req.tenant;
      const apiKey = req.apiKey;
      const apiScopes = req.apiScopes || [];

      if (!tenant || !tenant.id) {
        return res.status(400).json({
          success: false,
          error: "Tenant not found",
        });
      }

      console.log(
        `📊 [Leads API] Stats request from API key: ${apiKey?.name} (Tenant: ${tenant.name})`
      );
      console.log(`🔑 [Leads API] Scopes:`, apiScopes);

      // Parse query parameters
      const { type, days, source, campaign, status } = req.query;

      console.log(`📋 [Leads API] Stats query params:`, {
        type,
        days,
        source,
        campaign,
        status,
      });

      // Check permissions
      const hasCrmPermission = apiScopes.includes("leads:read");
      const hasMarketingPermission = apiScopes.includes("marketing_leads:read");

      // Determine which tables to query
      let queryCrm = false;
      let queryMarketing = false;

      if (!type || type === "both") {
        queryCrm = hasCrmPermission;
        queryMarketing = hasMarketingPermission;
      } else if (type === "crm") {
        if (!hasCrmPermission) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message:
              "You don't have permission to access CRM stats. Required scope: leads:read",
          });
        }
        queryCrm = true;
      } else if (type === "marketing") {
        if (!hasMarketingPermission) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message:
              "You don't have permission to access marketing stats. Required scope: marketing_leads:read",
          });
        }
        queryMarketing = true;
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid type parameter. Use 'crm', 'marketing', or omit for both",
        });
      }

      console.log(
        `🔍 [Leads API] Stats query plan: CRM=${queryCrm}, Marketing=${queryMarketing}`
      );

      // Build base conditions for each table
      const buildDateFilter = (daysParam: string | undefined) => {
        if (!daysParam || daysParam === "all") return null;
        const daysNum = parseInt(daysParam);
        if (!isNaN(daysNum) && daysNum > 0) {
          return sql`NOW() - INTERVAL '${sql.raw(daysNum.toString())} days'`;
        }
        return null;
      };

      const dateFilter = buildDateFilter(days as string);

      // Initialize stats object
      const stats: any = {
        general: {
          total_leads: 0,
          total_crm_leads: 0,
          total_marketing_leads: 0,
          unique_sources: 0,
          leads_last_24h: 0,
          leads_last_7d: 0,
        },
        breakdown: {
          by_type: { crm: 0, marketing: 0 },
          by_source: [] as Array<{ source: string; count: number }>,
          by_campaign: [] as Array<{ campaign: string; count: number }>,
          by_status: [] as Array<{ status: string; count: number }>,
        },
        trends: {
          daily: [] as Array<{ date: string; count: number }>,
        },
      };

      // Arrays to collect breakdown data for merging
      let crmSourceBreakdown: Array<{ source: string; count: number }> = [];
      let marketingSourceBreakdown: Array<{ source: string; count: number }> = [];
      let crmStatusBreakdown: Array<{ status: string; count: number }> = [];
      let marketingStatusBreakdown: Array<{ status: string; count: number }> = [];
      let crmDailyTrends: Array<{ date: string; count: number }> = [];
      let marketingDailyTrends: Array<{ date: string; count: number }> = [];

      // Query CRM stats if needed
      if (queryCrm) {
        console.log(`📊 [Leads API] Querying CRM stats...`);

        // Build CRM conditions
        const crmConditions: any[] = [eq(leads.tenantId, tenant.id)];
        if (dateFilter) {
          crmConditions.push(gte(leads.createdAt, dateFilter));
        }
        if (source) {
          crmConditions.push(eq(leads.source, source as string));
        }
        if (status) {
          crmConditions.push(eq(leads.status, status as string));
        }

        // General stats
        const crmGeneralStats = await db
          .select({
            total: sql<number>`COUNT(*)::int`,
            unique_sources: sql<number>`COUNT(DISTINCT ${leads.source})::int`,
            last_24h: sql<number>`COUNT(CASE WHEN ${leads.createdAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)::int`,
            last_7d: sql<number>`COUNT(CASE WHEN ${leads.createdAt} >= NOW() - INTERVAL '7 days' THEN 1 END)::int`,
          })
          .from(leads)
          .where(and(...crmConditions));

        stats.general.total_crm_leads = crmGeneralStats[0]?.total || 0;
        stats.general.leads_last_24h += crmGeneralStats[0]?.last_24h || 0;
        stats.general.leads_last_7d += crmGeneralStats[0]?.last_7d || 0;
        stats.breakdown.by_type.crm = crmGeneralStats[0]?.total || 0;

        console.log(`✅ [Leads API] CRM general stats:`, crmGeneralStats[0]);

        // Breakdown by source
        const crmBySource = await db
          .select({
            source: leads.source,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(leads)
          .where(and(...crmConditions))
          .groupBy(leads.source)
          .orderBy(sql`COUNT(*) DESC`);

        crmSourceBreakdown = crmBySource.map((row) => ({
          source: row.source || "unknown",
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] CRM by source: ${crmSourceBreakdown.length} sources`);

        // Breakdown by status
        const crmByStatus = await db
          .select({
            status: leads.status,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(leads)
          .where(and(...crmConditions))
          .groupBy(leads.status)
          .orderBy(sql`COUNT(*) DESC`);

        crmStatusBreakdown = crmByStatus.map((row) => ({
          status: row.status || "unknown",
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] CRM by status: ${crmStatusBreakdown.length} statuses`);

        // Daily trends (last 30 days)
        const crmDailyConditions: any[] = [
          eq(leads.tenantId, tenant.id),
          gte(leads.createdAt, sql`NOW() - INTERVAL '30 days'`),
        ];
        if (source) {
          crmDailyConditions.push(eq(leads.source, source as string));
        }
        if (status) {
          crmDailyConditions.push(eq(leads.status, status as string));
        }

        const crmDaily = await db
          .select({
            date: sql<string>`DATE(${leads.createdAt})::text`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(leads)
          .where(and(...crmDailyConditions))
          .groupBy(sql`DATE(${leads.createdAt})`)
          .orderBy(sql`DATE(${leads.createdAt}) ASC`);

        crmDailyTrends = crmDaily.map((row) => ({
          date: row.date,
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] CRM daily trends: ${crmDailyTrends.length} days`);
      }

      // Query Marketing stats if needed
      if (queryMarketing) {
        console.log(`📊 [Leads API] Querying Marketing stats...`);

        // Build Marketing conditions
        const marketingConditions: any[] = [eq(marketingLeads.tenantId, tenant.id)];
        if (dateFilter) {
          marketingConditions.push(gte(marketingLeads.createdAt, dateFilter));
        }
        if (source) {
          marketingConditions.push(eq(marketingLeads.source, source as string));
        }
        if (campaign) {
          marketingConditions.push(eq(marketingLeads.campaign, campaign as string));
        }
        if (status) {
          marketingConditions.push(eq(marketingLeads.status, status as string));
        }

        // General stats
        const marketingGeneralStats = await db
          .select({
            total: sql<number>`COUNT(*)::int`,
            unique_sources: sql<number>`COUNT(DISTINCT ${marketingLeads.source})::int`,
            last_24h: sql<number>`COUNT(CASE WHEN ${marketingLeads.createdAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)::int`,
            last_7d: sql<number>`COUNT(CASE WHEN ${marketingLeads.createdAt} >= NOW() - INTERVAL '7 days' THEN 1 END)::int`,
            emails_sent: sql<number>`COUNT(CASE WHEN ${marketingLeads.emailSent} = true THEN 1 END)::int`,
            whatsapp_sent: sql<number>`COUNT(CASE WHEN ${marketingLeads.whatsappSent} = true THEN 1 END)::int`,
          })
          .from(marketingLeads)
          .where(and(...marketingConditions));

        stats.general.total_marketing_leads = marketingGeneralStats[0]?.total || 0;
        stats.general.leads_last_24h += marketingGeneralStats[0]?.last_24h || 0;
        stats.general.leads_last_7d += marketingGeneralStats[0]?.last_7d || 0;
        stats.breakdown.by_type.marketing = marketingGeneralStats[0]?.total || 0;

        // Add marketing-specific stats only if has marketing permission
        if (hasMarketingPermission) {
          stats.general.emails_sent = marketingGeneralStats[0]?.emails_sent || 0;
          stats.general.whatsapp_sent = marketingGeneralStats[0]?.whatsapp_sent || 0;
        }

        console.log(`✅ [Leads API] Marketing general stats:`, marketingGeneralStats[0]);

        // Breakdown by source
        const marketingBySource = await db
          .select({
            source: marketingLeads.source,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(marketingLeads)
          .where(and(...marketingConditions))
          .groupBy(marketingLeads.source)
          .orderBy(sql`COUNT(*) DESC`);

        marketingSourceBreakdown = marketingBySource.map((row) => ({
          source: row.source || "unknown",
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] Marketing by source: ${marketingSourceBreakdown.length} sources`);

        // Breakdown by campaign (only for marketing)
        const marketingByCampaign = await db
          .select({
            campaign: marketingLeads.campaign,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(marketingLeads)
          .where(and(...marketingConditions))
          .groupBy(marketingLeads.campaign)
          .orderBy(sql`COUNT(*) DESC`);

        stats.breakdown.by_campaign = marketingByCampaign.map((row) => ({
          campaign: row.campaign || "unknown",
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] Marketing by campaign: ${stats.breakdown.by_campaign.length} campaigns`);

        // Breakdown by status
        const marketingByStatus = await db
          .select({
            status: marketingLeads.status,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(marketingLeads)
          .where(and(...marketingConditions))
          .groupBy(marketingLeads.status)
          .orderBy(sql`COUNT(*) DESC`);

        marketingStatusBreakdown = marketingByStatus.map((row) => ({
          status: row.status || "unknown",
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] Marketing by status: ${marketingStatusBreakdown.length} statuses`);

        // Daily trends (last 30 days)
        const marketingDailyConditions: any[] = [
          eq(marketingLeads.tenantId, tenant.id),
          gte(marketingLeads.createdAt, sql`NOW() - INTERVAL '30 days'`),
        ];
        if (source) {
          marketingDailyConditions.push(eq(marketingLeads.source, source as string));
        }
        if (campaign) {
          marketingDailyConditions.push(eq(marketingLeads.campaign, campaign as string));
        }
        if (status) {
          marketingDailyConditions.push(eq(marketingLeads.status, status as string));
        }

        const marketingDaily = await db
          .select({
            date: sql<string>`DATE(${marketingLeads.createdAt})::text`,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(marketingLeads)
          .where(and(...marketingDailyConditions))
          .groupBy(sql`DATE(${marketingLeads.createdAt})`)
          .orderBy(sql`DATE(${marketingLeads.createdAt}) ASC`);

        marketingDailyTrends = marketingDaily.map((row) => ({
          date: row.date,
          count: row.count || 0,
        }));

        console.log(`✅ [Leads API] Marketing daily trends: ${marketingDailyTrends.length} days`);
      }

      // Calculate total leads
      stats.general.total_leads =
        stats.general.total_crm_leads + stats.general.total_marketing_leads;

      // Merge source breakdowns
      const sourceMap = new Map<string, number>();
      [...crmSourceBreakdown, ...marketingSourceBreakdown].forEach((item) => {
        sourceMap.set(item.source, (sourceMap.get(item.source) || 0) + item.count);
      });
      stats.breakdown.by_source = Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate unique sources
      stats.general.unique_sources = stats.breakdown.by_source.length;

      // Merge status breakdowns
      const statusMap = new Map<string, number>();
      [...crmStatusBreakdown, ...marketingStatusBreakdown].forEach((item) => {
        statusMap.set(item.status, (statusMap.get(item.status) || 0) + item.count);
      });
      stats.breakdown.by_status = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // Merge daily trends
      const dailyMap = new Map<string, number>();
      [...crmDailyTrends, ...marketingDailyTrends].forEach((item) => {
        dailyMap.set(item.date, (dailyMap.get(item.date) || 0) + item.count);
      });
      stats.trends.daily = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log(`✅ [Leads API] Stats calculated successfully`);

      // Prepare response
      const responseData = {
        success: true,
        data: stats,
        filters: {
          type: type || null,
          days: days || null,
          source: source || null,
          campaign: campaign || null,
          status: status || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0",
          endpoint: "external/leads/stats",
          tenant: {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
          },
        },
      };

      res.json(responseData);
    } catch (error) {
      console.error("❌ [Leads API] Error fetching stats:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch stats",
      });
    }
  }
);

/**
 * GET /external/leads/:id
 * 
 * Recupera un lead specifico per ID cercando in entrambe le tabelle (CRM e Marketing)
 * 
 * Parametri URL:
 * - id: ID del lead (string o number)
 * 
 * Headers:
 * - X-API-Key o Authorization: Bearer <token>
 * 
 * Scopes richiesti:
 * - leads:read (per accedere ai lead CRM)
 * - marketing_leads:read (per accedere ai marketing leads)
 * - Almeno uno dei due è richiesto
 * 
 * Logica:
 * 1. Cerca prima nella tabella leads (CRM)
 * 2. Se non trovato, cerca nella tabella marketing_leads
 * 3. Verifica che l'API key abbia lo scope appropriato per il tipo di lead trovato
 * 
 * Risposte:
 * - 200: Lead trovato e scope appropriato
 * - 403: Lead trovato ma scope non appropriato
 * - 404: Lead non trovato in nessuna tabella
 * - 401: API key non valida (gestito dal middleware)
 */
router.get(
  "/external/leads/:id",
  validateApiKey,
  requireAnyScope(["leads:read", "marketing_leads:read"]),
  async (req: ApiKeyRequest, res: Response) => {
    try {
      const tenant = req.tenant;
      const apiKey = req.apiKey;
      const apiScopes = req.apiScopes || [];
      const { id } = req.params;

      if (!tenant || !tenant.id) {
        return res.status(400).json({
          success: false,
          error: "Tenant not found",
        });
      }

      if (!id) {
        return res.status(400).json({
          success: false,
          error: "Lead ID is required",
        });
      }

      console.log(
        `🔍 [Leads API] Get lead by ID: ${id} (Tenant: ${tenant.name})`
      );
      console.log(`🔑 [Leads API] Scopes:`, apiScopes);

      const hasCrmPermission = apiScopes.includes("leads:read");
      const hasMarketingPermission = apiScopes.includes("marketing_leads:read");

      let foundLead: UnifiedLead | null = null;
      let leadType: "crm" | "marketing" | null = null;

      // Step 1: Search in CRM leads table first
      if (hasCrmPermission) {
        console.log(`🔍 [Leads API] Searching in CRM leads table...`);
        const crmLeadResult = await db
          .select()
          .from(leads)
          .where(and(eq(leads.id, id), eq(leads.tenantId, tenant.id)))
          .limit(1);

        if (crmLeadResult.length > 0) {
          foundLead = mapCrmLead(crmLeadResult[0]);
          leadType = "crm";
          console.log(`✅ [Leads API] Found in CRM leads table`);
        }
      }

      // Step 2: If not found in CRM, search in marketing_leads table
      if (!foundLead && hasMarketingPermission) {
        console.log(`🔍 [Leads API] Searching in marketing_leads table...`);
        
        // Marketing leads use integer IDs, so we need to parse
        const marketingLeadId = parseInt(id);
        if (!isNaN(marketingLeadId)) {
          const marketingLeadResult = await db
            .select()
            .from(marketingLeads)
            .where(
              and(
                eq(marketingLeads.id, marketingLeadId),
                eq(marketingLeads.tenantId, tenant.id)
              )
            )
            .limit(1);

          if (marketingLeadResult.length > 0) {
            foundLead = mapMarketingLead(marketingLeadResult[0]);
            leadType = "marketing";
            console.log(`✅ [Leads API] Found in marketing_leads table`);
          }
        }
      }

      // Step 3: Handle not found case
      if (!foundLead) {
        console.log(`❌ [Leads API] Lead not found in any table`);
        return res.status(404).json({
          success: false,
          error: "Not Found",
          message: `Lead with ID ${id} not found`,
        });
      }

      // Step 4: Verify scope for the found lead type
      if (leadType === "crm" && !hasCrmPermission) {
        console.log(`🚫 [Leads API] Found in CRM but missing leads:read scope`);
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message:
            "You don't have permission to access this CRM lead. Required scope: leads:read",
        });
      }

      if (leadType === "marketing" && !hasMarketingPermission) {
        console.log(
          `🚫 [Leads API] Found in marketing_leads but missing marketing_leads:read scope`
        );
        return res.status(403).json({
          success: false,
          error: "Forbidden",
          message:
            "You don't have permission to access this marketing lead. Required scope: marketing_leads:read",
        });
      }

      // Step 5: Return the unified lead
      console.log(`✅ [Leads API] Returning lead (type: ${leadType})`);
      res.json({
        success: true,
        data: foundLead,
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0",
          endpoint: "external/leads/:id",
          tenant: {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
          },
        },
      });
    } catch (error) {
      console.error("❌ [Leads API] Error fetching lead by ID:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch lead",
      });
    }
  }
);

/**
 * GET /external/leads
 * 
 * Endpoint unificato per recuperare lead da CRM e/o Marketing Leads
 * 
 * Query Parameters:
 * - type: 'crm' | 'marketing' | undefined (default: recupera da entrambe le tabelle)
 * - limit: numero massimo di risultati (default: 100, max: 1000)
 * - offset: offset per paginazione (default: 0)
 * - days: filtra lead degli ultimi N giorni (opzionale)
 * - source: filtra per sorgente (opzionale)
 * - campaign: filtra per campagna (solo marketing leads) (opzionale)
 * - status: filtra per status (opzionale)
 * - fields: campi da includere nella risposta, separati da virgola (opzionale)
 * 
 * Headers:
 * - Accept: text/csv per export CSV
 * - X-API-Key o Authorization: Bearer <token>
 * 
 * Scopes richiesti:
 * - leads:read (per accedere ai lead CRM)
 * - marketing_leads:read (per accedere ai marketing leads)
 * - Almeno uno dei due è richiesto
 */
router.get(
  "/external/leads",
  validateApiKey,
  requireAnyScope(["leads:read", "marketing_leads:read"]),
  async (req: ApiKeyRequest, res: Response) => {
    try {
      const tenant = req.tenant;
      const apiKey = req.apiKey;
      const apiScopes = req.apiScopes || [];

      if (!tenant || !tenant.id) {
        return res.status(400).json({
          success: false,
          error: "Tenant not found",
        });
      }

      console.log(
        `📊 [Leads API] Request from API key: ${apiKey?.name} (Tenant: ${tenant.name})`
      );
      console.log(`🔑 [Leads API] Scopes:`, apiScopes);

      // Parse query parameters
      const {
        type,
        limit = "100",
        offset = "0",
        days,
        source,
        campaign,
        status,
        fields,
      } = req.query;

      // Validate parameters
      const limitNum = Math.min(1000, Math.max(1, parseInt(limit as string)));
      const offsetNum = Math.max(0, parseInt(offset as string));

      console.log(`📋 [Leads API] Query params:`, {
        type,
        limit: limitNum,
        offset: offsetNum,
        days,
        source,
        campaign,
        status,
        fields,
      });

      // Check permissions based on type
      const hasCrmPermission = apiScopes.includes("leads:read");
      const hasMarketingPermission = apiScopes.includes("marketing_leads:read");

      // Determine which tables to query
      let queryCrm = false;
      let queryMarketing = false;

      if (!type || type === "both") {
        // Query both tables if permissions allow
        queryCrm = hasCrmPermission;
        queryMarketing = hasMarketingPermission;
      } else if (type === "crm") {
        if (!hasCrmPermission) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message:
              "You don't have permission to access CRM leads. Required scope: leads:read",
          });
        }
        queryCrm = true;
      } else if (type === "marketing") {
        if (!hasMarketingPermission) {
          return res.status(403).json({
            success: false,
            error: "Forbidden",
            message:
              "You don't have permission to access marketing leads. Required scope: marketing_leads:read",
          });
        }
        queryMarketing = true;
      } else {
        return res.status(400).json({
          success: false,
          error: "Invalid type parameter. Use 'crm', 'marketing', or omit for both",
        });
      }

      console.log(
        `🔍 [Leads API] Query plan: CRM=${queryCrm}, Marketing=${queryMarketing}`
      );

      // Build date filter
      let dateFilter: any = null;
      if (days) {
        const daysNum = parseInt(days as string);
        if (!isNaN(daysNum) && daysNum > 0) {
          dateFilter = sql`NOW() - INTERVAL '${sql.raw(daysNum.toString())} days'`;
        }
      }

      // Arrays to hold results
      let crmLeadsData: any[] = [];
      let marketingLeadsData: any[] = [];
      let totalCrm = 0;
      let totalMarketing = 0;

      // Query CRM leads if needed
      if (queryCrm) {
        const conditions: any[] = [eq(leads.tenantId, tenant.id)];

        if (dateFilter) {
          conditions.push(gte(leads.createdAt, dateFilter));
        }
        if (source) {
          conditions.push(eq(leads.source, source as string));
        }
        if (status) {
          conditions.push(eq(leads.status, status as string));
        }

        // Query without pagination to get all matching leads for merge
        const crmQuery = db
          .select()
          .from(leads)
          .where(and(...conditions))
          .orderBy(sql`${leads.createdAt} DESC`);

        crmLeadsData = await crmQuery;

        // Get total count
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(and(...conditions));

        const countResult = await countQuery;
        totalCrm = Number(countResult[0]?.count || 0);

        console.log(`✅ [Leads API] CRM leads: ${crmLeadsData.length} fetched, ${totalCrm} total`);
      }

      // Query Marketing leads if needed
      if (queryMarketing) {
        const conditions: any[] = [eq(marketingLeads.tenantId, tenant.id)];

        if (dateFilter) {
          conditions.push(gte(marketingLeads.createdAt, dateFilter));
        }
        if (source) {
          conditions.push(eq(marketingLeads.source, source as string));
        }
        if (campaign) {
          conditions.push(eq(marketingLeads.campaign, campaign as string));
        }
        if (status) {
          conditions.push(eq(marketingLeads.status, status as string));
        }

        // Query without pagination to get all matching leads for merge
        const marketingQuery = db
          .select()
          .from(marketingLeads)
          .where(and(...conditions))
          .orderBy(sql`${marketingLeads.createdAt} DESC`);

        marketingLeadsData = await marketingQuery;

        // Get total count
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(marketingLeads)
          .where(and(...conditions));

        const countResult = await countQuery;
        totalMarketing = Number(countResult[0]?.count || 0);

        console.log(
          `✅ [Leads API] Marketing leads: ${marketingLeadsData.length} fetched, ${totalMarketing} total`
        );
      }

      // Map to unified format
      const unifiedCrmLeads: UnifiedLead[] = crmLeadsData.map(mapCrmLead);
      const unifiedMarketingLeads: UnifiedLead[] =
        marketingLeadsData.map(mapMarketingLead);

      // Merge and sort by createdAt DESC
      const allLeads = [...unifiedCrmLeads, ...unifiedMarketingLeads];
      const sortedLeads = sortLeadsByDate(allLeads, "desc");

      console.log(
        `🔀 [Leads API] Merged and sorted: ${sortedLeads.length} total leads`
      );

      // Apply pagination AFTER merge
      const paginatedLeads = sortedLeads.slice(
        offsetNum,
        offsetNum + limitNum
      );

      console.log(
        `📄 [Leads API] Paginated: ${paginatedLeads.length} leads (offset: ${offsetNum}, limit: ${limitNum})`
      );

      // Filter fields if requested
      let finalLeads = paginatedLeads;
      if (fields) {
        const requestedFields = (fields as string).split(",").map((f) => f.trim());
        finalLeads = paginatedLeads.map((lead) => {
          const filtered: any = {};
          requestedFields.forEach((field) => {
            if (field in lead) {
              filtered[field] = (lead as any)[field];
            }
          });
          return filtered;
        });
        console.log(`🔍 [Leads API] Filtered fields: ${requestedFields.join(", ")}`);
      }

      // Prepare response
      const responseData = {
        success: true,
        data: finalLeads,
        pagination: {
          total: sortedLeads.length,
          totalCrm,
          totalMarketing,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < sortedLeads.length,
        },
        filters: {
          type: type || "both",
          source: source || null,
          campaign: campaign || null,
          status: status || null,
          days: days || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: "1.0",
          endpoint: "external/leads",
          tenant: {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
          },
        },
      };

      // Check if CSV export is requested
      const acceptHeader = req.headers.accept;
      if (acceptHeader && acceptHeader.includes("text/csv")) {
        console.log(`📤 [Leads API] CSV export requested`);

        // Generate CSV
        if (finalLeads.length === 0) {
          return res
            .status(200)
            .setHeader("Content-Type", "text/csv")
            .setHeader(
              "Content-Disposition",
              `attachment; filename="leads-${Date.now()}.csv"`
            )
            .send("No data available");
        }

        // CSV headers
        const csvHeaders = Object.keys(finalLeads[0]).join(",");

        // CSV rows
        const csvRows = finalLeads.map((lead) => {
          return Object.values(lead)
            .map((value) => {
              if (value === null || value === undefined) {
                return "";
              }
              if (typeof value === "object") {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              }
              const stringValue = String(value);
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(",");
        });

        const csvContent = [csvHeaders, ...csvRows].join("\n");

        return res
          .status(200)
          .setHeader("Content-Type", "text/csv; charset=utf-8")
          .setHeader(
            "Content-Disposition",
            `attachment; filename="leads-${tenant.domain}-${Date.now()}.csv"`
          )
          .send(csvContent);
      }

      // Return JSON response
      console.log(`✅ [Leads API] Response prepared successfully`);
      res.json(responseData);
    } catch (error) {
      console.error("❌ [Leads API] Error fetching leads:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: "Failed to fetch leads",
      });
    }
  }
);

export default router;
