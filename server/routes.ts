import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateToken, verifyToken, requireRole, type AuthRequest } from "./auth";
import { TenantRequest, identifyTenant } from "./middleware/tenant";
import {
  insertUserSchema, insertPageSchema, insertBlogPostSchema,
  insertLeadSchema, insertCandidateSchema, insertServiceSchema,
  insertLandingPageSchema, insertBuilderPageSchema, insertProjectSchema, insertGlobalSeoSettingsSchema, users, tenants, projects, superadminGeminiConfig
} from "@shared/schema";
import { encrypt, decrypt } from "./encryption";
import { generateLandingPageContent, buildComponentsFromContent, AI_TEMPLATES, type TemplateId } from "./ai/landing-page-generator";
import { getSuperAdminGeminiKeys } from "./ai/gemini-keys";
import { db } from "./db";
import { eq, asc, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { SEOManager } from "./utils/seo";
import { sanitizeUserForResponse } from "./utils/sanitizeUser";
import marketingLeadsRouter from "./marketingLeads";
import marketingLeadsApiRouter from "./marketingLeadsApi";
import analyticsRouter from "./analytics";
import publicApiRouter from "./publicApi";
import leadsApiRouter from "./leadsApi";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Make storage available globally
  app.set('storage', storage);

  // Marketing Leads Routes - Registra prima le route specifiche
  app.use("/api/marketing-leads", marketingLeadsRouter);
  app.use("/api", marketingLeadsApiRouter);

  // Unified Leads API Routes (requires API key authentication)
  app.use("/api", leadsApiRouter);

  // Analytics Routes (with tenant identification for public tracking)
  app.use("/api/analytics", identifyTenant, analyticsRouter);

  // Public API Routes (requires API key authentication)
  app.use("/api/public", publicApiRouter);

  // Google Sheets Routes - Registra il router completo
  const googleSheetsRouter = await import('./googleSheets');
  app.use("/api/google-sheets", googleSheetsRouter.default);

  app.get("/api/clients", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const clients = await storage.getClientsByOwner(req.user!.id);
      res.json({ clients });
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Client name is required" });
      }

      const client = await storage.createClient({
        name,
        description: description || null,
        ownerId: req.user.id
      });

      res.json({ client });
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.delete("/api/clients/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      const deleted = await storage.deleteClientByOwner(clientId, req.user.id);

      if (deleted) {
        res.json({ message: "Client deleted successfully" });
      } else {
        res.status(404).json({ message: "Client not found" });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Auth Routes
  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      res.json(sanitizeUserForResponse(req.user));
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // Update user's Google Sheets API Key
  app.put("/api/auth/google-sheets-api-key", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ message: "API Key is required" });
      }

      const [updatedUser] = await db.update(users)
        .set({ googleSheetsApiKey: apiKey, updatedAt: new Date() })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json({ success: true, user: sanitizeUserForResponse(updatedUser) });
    } catch (error) {
      console.error("Error updating Google Sheets API Key:", error);
      res.status(500).json({ message: "Failed to update API Key" });
    }
  });

  // Update user's Telegram credentials
  app.put("/api/auth/telegram-config", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { botToken, chatId } = req.body;

      if (!botToken || !chatId) {
        return res.status(400).json({ message: "Bot Token e Chat ID sono richiesti" });
      }

      const [updatedUser] = await db.update(users)
        .set({ 
          telegramBotToken: botToken, 
          telegramChatId: chatId,
          updatedAt: new Date() 
        })
        .where(eq(users.id, req.user!.id))
        .returning();

      res.json({ success: true, user: sanitizeUserForResponse(updatedUser) });
    } catch (error) {
      console.error("Error updating Telegram config:", error);
      res.status(500).json({ message: "Failed to update Telegram configuration" });
    }
  });

  app.post("/api/auth/login", async (req: TenantRequest, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Use tenant from the current request (based on domain)
      if (!req.tenant?.id) {
        return res.status(400).json({
          message: "Tenant not identified. Please check the domain."
        });
      }

      // First try to find user in current tenant
      let user = await storage.getUserByUsername(username, req.tenant.id);

      // If not found in current tenant, search in all tenants (for admin/superadmin cross-tenant access)
      if (!user) {
        const allUsers = await db.select().from(users).where(eq(users.username, username));

        if (allUsers.length > 0) {
          // Find admin or superadmin user
          const adminUser = allUsers.find(u => u.role === 'admin' || u.role === 'superadmin');

          if (adminUser) {
            user = adminUser;
            console.log(`Cross-tenant login: ${username} from tenant ${adminUser.tenantId} accessing ${req.tenant.domain}`);
          }
        }
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);

      res.json({
        token,
        user: sanitizeUserForResponse(user)
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(userData.username, req.tenant!.id);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email, req.tenant!.id);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const allowedRoles = ['editor', 'admin'];
      if (req.user.role !== 'superadmin') {
        if (userData.role && !allowedRoles.includes(userData.role)) {
          return res.status(403).json({ message: "Insufficient permissions to assign this role" });
        }
      }

      const userDataWithTenant = {
        ...userData,
        tenantId: req.tenant!.id
      };

      const user = await storage.createUser(userDataWithTenant);
      const token = generateToken(user);

      res.status(201).json({
        token,
        user: sanitizeUserForResponse(user)
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Public endpoint to get list of active tenants (for login dropdown)
  app.get("/api/tenants/public", async (req: Request, res: Response) => {
    try {
      const activeTenants = await storage.getActiveTenants();
      res.json(activeTenants.map(t => ({
        id: t.id,
        name: t.name,
        domain: t.domain
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Get current tenant info (public - for logo and name in header/footer)
  app.get("/api/tenant/public", async (req: TenantRequest, res: Response) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json({
        id: req.tenant.id,
        name: req.tenant.name,
        domain: req.tenant.domain,
        logo: req.tenant.logo
      });
    } catch (error) {
      console.error("Error fetching tenant public info:", error);
      res.status(500).json({ message: "Failed to fetch tenant info" });
    }
  });

  // Get current tenant info (authenticated)
  app.get("/api/tenant/info", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json({
        id: req.tenant.id,
        name: req.tenant.name,
        domain: req.tenant.domain,
        logo: req.tenant.logo,
        isActive: req.tenant.isActive
      });
    } catch (error) {
      console.error("Error fetching tenant info:", error);
      res.status(500).json({ message: "Failed to fetch tenant info" });
    }
  });

  // Update tenant info (authenticated admin)
  app.put("/api/tenant/update", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { name, logo } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const updated = await storage.updateTenant(req.tenant!.id, {
        name,
        logo: logo || null
      });

      if (!updated) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // --- ROTTE PER LE IMPOSTAZIONI ---
  // Rotta pubblica per ottenere le info di contatto
  app.get("/api/settings/public", async (req: TenantRequest, res: Response) => {
    try {
      const contactInfo = await storage.getSetting('contactInfo', req.tenant!.id);
      res.json(contactInfo || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public settings" });
    }
  });

  // Rotta pubblica per ottenere i link della navbar
  app.get("/api/settings/navbar", async (req: TenantRequest, res: Response) => {
    try {
      const navbarItems = await storage.getSetting('navbarItems', req.tenant!.id);
      res.json(navbarItems || []);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch navbar settings" });
    }
  });

  // Rotta admin per ottenere tutte le impostazioni
  app.get("/api/settings", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const allSettings = await storage.getAllSettings(req.tenant!.id);
      res.json(allSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Rotta admin per aggiornare le impostazioni
  app.put("/api/settings", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ message: "Key and value are required" });
      }
      const setting = await storage.updateSetting(key, value, req.tenant!.id);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  // --- FINE NUOVE ROTTE ---

  // Global SEO Settings Routes
  app.get("/api/admin/global-seo-settings", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const settings = await storage.getGlobalSeoSettings(req.tenant!.id);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch global SEO settings" });
    }
  });

  app.post("/api/admin/global-seo-settings", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      // Rimuovi tenantId dal body se presente (verrà sovrascritto)
      const { tenantId: _, ...bodyWithoutTenant } = req.body;
      
      const settingsData = insertGlobalSeoSettingsSchema.parse(bodyWithoutTenant);
      const settings = await storage.upsertGlobalSeoSettings({ 
        ...settingsData, 
        updatedBy: req.user!.id
      }, req.tenant!.id);
      res.json(settings);
    } catch (error) {
      console.error('Error creating/updating global SEO settings:', error);
      res.status(400).json({ 
        message: "Failed to save global SEO settings",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put("/api/admin/global-seo-settings", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      // Rimuovi tenantId dal body se presente (verrà sovrascritto)
      const { tenantId: _, ...bodyWithoutTenant } = req.body;
      
      // Validate and parse the request body, excluding fields that shouldn't be updated manually
      const updates = insertGlobalSeoSettingsSchema.parse(bodyWithoutTenant);
      const settings = await storage.updateGlobalSeoSettings({ 
        ...updates, 
        updatedBy: req.user!.id 
      }, req.user!.tenantId); // Usa il tenantId dell'utente autenticato
      res.json(settings);
    } catch (error) {
      console.error('Error updating global SEO settings:', error);
      res.status(400).json({ 
        message: "Failed to update global SEO settings",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  // --- END Global SEO Settings Routes ---

  // --- Brand Voice Routes ---
  app.get("/api/brand-voice", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const data = await storage.getBrandVoice(req.tenant!.id);
      res.json(data || { businessInfo: {}, authority: {}, servicesInfo: {}, credentials: {}, voiceStyle: {} });
    } catch (error) {
      console.error("Error fetching brand voice:", error);
      res.status(500).json({ message: "Failed to fetch brand voice" });
    }
  });

  app.put("/api/brand-voice", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { businessInfo, authority, servicesInfo, credentials, voiceStyle } = req.body;
      const data = await storage.upsertBrandVoice(req.tenant!.id, {
        businessInfo: businessInfo || {},
        authority: authority || {},
        servicesInfo: servicesInfo || {},
        credentials: credentials || {},
        voiceStyle: voiceStyle || {},
      });
      res.json(data);
    } catch (error) {
      console.error("Error saving brand voice:", error);
      res.status(500).json({ message: "Failed to save brand voice" });
    }
  });

  app.post("/api/brand-voice/import", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const importData = req.body;
      if (!importData || typeof importData !== 'object' || Array.isArray(importData)) {
        return res.status(400).json({ message: "Il body deve essere un oggetto JSON valido" });
      }

      const validSections = ["businessInfo", "authority", "servicesInfo", "credentials", "voiceStyle"];
      const mapped: Record<string, any> = {};

      for (const key of validSections) {
        if (importData[key] && typeof importData[key] === 'object' && !Array.isArray(importData[key])) {
          mapped[key] = importData[key];
        }
      }

      if (Object.keys(mapped).length === 0) {
        return res.status(400).json({
          message: "Nessuna sezione Brand Voice valida trovata. Sezioni accettate: " + validSections.join(", ")
        });
      }

      const data = await storage.upsertBrandVoice(req.tenant!.id, mapped);
      res.json({ message: "Brand Voice importato con successo", data });
    } catch (error) {
      console.error("Error importing brand voice:", error);
      res.status(500).json({ message: "Failed to import brand voice" });
    }
  });
  // --- END Brand Voice Routes ---

  // Public SEO Settings endpoint (for frontend initialization)
  app.get("/api/seo-settings/public", async (req: TenantRequest, res: Response) => {
    try {
      // Priorità al tenant dell'utente autenticato se disponibile
      const authReq = req as AuthRequest;
      let tenantId = req.tenant!.id;

      if (authReq.user && authReq.user.tenantId) {
        tenantId = authReq.user.tenantId;
        console.log(`🔍 SEO Settings: Using authenticated user's tenant: ${tenantId}`);
      } else {
        console.log(`🔍 SEO Settings: Using domain tenant: ${tenantId}`);
      }

      const settings = await storage.getGlobalSeoSettings(tenantId);
      // Only return public SEO settings (no sensitive admin data)
      const publicSettings = {
        googleAnalyticsId: settings?.googleAnalyticsId || null,
        googleTagManagerId: settings?.googleTagManagerId || null,
        googleSearchConsoleCode: settings?.googleSearchConsoleCode || null,
        siteName: settings?.siteName || null,
        siteDescription: settings?.siteDescription || null,
        siteUrl: settings?.siteUrl || null,
        defaultMetaTitle: settings?.defaultMetaTitle || null,
        defaultMetaDescription: settings?.defaultMetaDescription || null,
        defaultOgImage: settings?.defaultOgImage || null,
        faviconUrl: settings?.faviconUrl || null,
        favicon16Url: settings?.favicon16Url || null,
        favicon32Url: settings?.favicon32Url || null,
        appleTouchIconUrl: settings?.appleTouchIconUrl || null,
        androidChrome192Url: settings?.androidChrome192Url || null,
        androidChrome512Url: settings?.androidChrome512Url || null,
        twitterHandle: settings?.twitterHandle || null,
        facebookAppId: settings?.facebookAppId || null,
        facebookPixelId: settings?.facebookPixelId || null,
        customHeadCode: settings?.customHeadCode || null,
        // Personal Branding
        enablePersonalBranding: settings?.enablePersonalBranding || false,
        personName: settings?.personName || null,
        personImage: settings?.personImage || null,
        personBio: settings?.personBio || null,
        personJobTitle: settings?.personJobTitle || null,
        personEmail: settings?.personEmail || null,
        personPhone: settings?.personPhone || null,
        personWebsite: settings?.personWebsite || null,
        personLinkedIn: settings?.personLinkedIn || null,
        personTwitter: settings?.personTwitter || null,
        personFacebook: settings?.personFacebook || null,
        personInstagram: settings?.personInstagram || null,
      };
      res.json(publicSettings);
    } catch (error) {
      console.error('Error fetching public SEO settings:', error);
      res.json({
        googleAnalyticsId: null,
        googleSearchConsoleCode: null,
        siteName: null,
        siteDescription: null,
        siteUrl: null,
        defaultMetaTitle: null,
        defaultMetaDescription: null,
        defaultOgImage: null,
        twitterHandle: null,
        facebookAppId: null,
        facebookPixelId: null,
        customHeadCode: null,
      });
    }
  });

  // Candidate form settings endpoints
  app.get('/api/candidate-form-settings', async (req, res) => {
    try {
      const candidateFormSettings = {
        title: "Candidatura Lead Generation",
        description: "Compila il form per accedere al nostro programma esclusivo di crescita digitale",
        badge: "Posti Limitati - Solo 20 Candidature al Mese",
        submitText: "Invia Candidatura",
        loadingText: "Invio candidatura in corso...",
        footerText: "La tua candidatura verrà esaminata entro 48 ore",
        successTitle: "Candidatura Inviata con Successo!",
        successDescription: "Grazie per il tuo interesse. Il nostro team esaminerà la tua candidatura e ti contatterà entro 48 ore."
      };

      res.json(candidateFormSettings);
    } catch (error) {
      console.error('Error fetching candidate form settings:', error);
      res.status(500).json({ error: 'Failed to fetch candidate form settings' });
    }
  });

  app.post('/api/candidate-form-settings', authenticateToken, async (req, res) => {
    try {
      const settings = req.body;

      // In this implementation, we'll store in a simple way
      // You could extend this to use a database table
      res.json({ message: 'Settings saved successfully', settings });
    } catch (error) {
      console.error('Error saving candidate form settings:', error);
      res.status(500).json({ error: 'Failed to save candidate form settings' });
    }
  });

  // Google Search Console HTML file verification - improved implementation
  app.get("/google*.html", async (req: TenantRequest, res: Response) => {
    try {
      const settings = await storage.getGlobalSeoSettings(req.tenant!.id);
      const fileName = req.path.substring(1); // Remove leading slash

      if (settings?.googleSearchConsoleCode) {
        // Extract verification token from the stored code (support both formats)
        let token: string;

        if (settings.googleSearchConsoleCode.includes('content=')) {
          // Meta tag format: <meta name="google-site-verification" content="TOKEN" />
          const tokenMatch = settings.googleSearchConsoleCode.match(/content="([^"]+)"/);
          token = tokenMatch ? tokenMatch[1] : '';
        } else {
          // Raw token format
          token = settings.googleSearchConsoleCode.trim();
        }

        if (token) {
          // Expected filename format: google{token}.html
          const expectedFileName = `google${token}.html`;

          if (fileName === expectedFileName) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(`google-site-verification: ${fileName}`);
            return;
          }
        }
      }

      res.status(404).send('Verification file not found');
    } catch (error) {
      console.error('Error serving Google verification file:', error);
      res.status(404).send('Verification file not found');
    }
  });

  // --- FINE NUOVA ROTTA ---

  // Pages Routes
  
  // Unified content endpoint - searches across all content types to avoid multiple 404s
  app.get("/api/content/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;
      const slug = req.params.slug;

      console.log(`🔍 [UNIFIED CONTENT] Looking for slug: "${slug}" in tenant: ${tenantId}`);

      // 1. Try to find in pages
      const page = await storage.getPageBySlug(slug, tenantId);
      if (page && page.tenantId === tenantId) {
        console.log(`✅ [UNIFIED CONTENT] Found as page: ${page.title}`);
        return res.json({
          type: 'page',
          content: page
        });
      }

      // 2. Try to find in landing pages
      const landingPage = await storage.getLandingPageBySlug(slug, tenantId);
      if (landingPage && landingPage.tenantId === tenantId && landingPage.isActive) {
        console.log(`✅ [UNIFIED CONTENT] Found as landing page: ${landingPage.title}`);
        return res.json({
          type: 'landing-page',
          content: landingPage
        });
      }

      // 3. Try to find in builder pages
      const builderPage = await storage.getBuilderPageBySlug(slug, tenantId);
      console.log(`🔍 [UNIFIED CONTENT] Builder page search result:`, builderPage ? {
        id: builderPage.id,
        title: builderPage.title,
        slug: builderPage.slug,
        tenantId: builderPage.tenantId,
        isActive: builderPage.isActive
      } : 'not found');
      
      if (builderPage && builderPage.tenantId === tenantId && builderPage.isActive) {
        console.log(`✅ [UNIFIED CONTENT] Found as builder page: ${builderPage.title}`);
        return res.json({
          type: 'builder-page',
          content: builderPage
        });
      }

      // 4. Try to find in projects
      const project = await storage.getProjectBySlug(slug, tenantId);
      if (project && project.tenantId === tenantId) {
        console.log(`✅ [UNIFIED CONTENT] Found as project: ${project.title}`);
        return res.json({
          type: 'project',
          content: project
        });
      }

      // If nothing found, return 404
      console.log(`❌ [UNIFIED CONTENT] No content found for slug: "${slug}" in tenant: ${tenantId}`);
      return res.status(404).json({ message: "Content not found" });
    } catch (error) {
      console.error("❌ [UNIFIED CONTENT] Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get("/api/pages", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getPages(req.tenant!.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  });

  app.get("/api/pages/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;
      let page;

      // Gestione speciale per la homepage - sempre /home
      if (req.params.slug === 'home') {
        const homepageMode = await storage.getSetting('homepageMode', tenantId);

        if (homepageMode === 'custom') {
          // Cerca prima la versione personalizzata della homepage con slug 'home'
          page = await storage.getPageBySlug('home', tenantId);
          // Se non esiste o non è personalizzata, usa quella normale
          if (!page || !page.isHomepageCustom) {
            page = await storage.getPageBySlug('home', tenantId);
          }
        } else {
          // Usa sempre la homepage con slug 'home'
          page = await storage.getPageBySlug('home', tenantId);
        }
      } else {
        page = await storage.getPageBySlug(req.params.slug, tenantId);
      }

      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }

      // TENANT ISOLATION CHECK
      if (page.tenantId !== tenantId) {
        console.log(`🚫 TENANT ISOLATION VIOLATION: User from tenant ${tenantId} tried to access page from tenant ${page.tenantId}`);
        return res.status(404).json({ message: "Page not found" });
      }

      // Track page view
      await storage.trackEvent("page_view", {}, tenantId, req.params.slug, undefined, req);

      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  // Rotta per ottenere pagina per path dinamico (per SEO)
  app.get("/api/pages/by-path/:path", async (req: TenantRequest, res: Response) => {
    try {
      // Gestisci path speciali
      let slug = req.params.path;
      if (slug === 'home' || slug === '') {
        slug = 'home';
      }

      const page = await storage.getPageBySlug(slug, req.tenant!.id);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }

      res.json({
        title: page.title,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        featuredImage: page.featuredImage,
        slug: page.slug
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });

  app.post("/api/pages", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const pageData = insertPageSchema.parse(req.body);
      const page = await storage.createPage({ ...pageData, authorId: req.user!.id, tenantId: req.tenant!.id });
      res.status(201).json(page);
    } catch (error) {
      res.status(400).json({ message: "Failed to create page" });
    }
  });

  app.post("/api/pages/homepage-custom", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const pageData = insertPageSchema.parse(req.body);

      // Controlla se esiste già una homepage con slug 'home'
      const existingHomepage = await storage.getPageBySlug('home', req.tenant!.id);

      if (existingHomepage) {
        // Aggiorna la homepage esistente con i nuovi contenuti personalizzati
        const updatedPage = await storage.updatePage(existingHomepage.id, req.tenant!.id, {
          ...pageData,
          slug: 'home',
          isHomepageCustom: true
        });
        res.json(updatedPage);
      } else {
        // Crea una nuova homepage personalizzata con slug 'home'
        const customPage = await storage.createPage({
          ...pageData,
          slug: 'home',
          authorId: req.user!.id,
          tenantId: req.tenant!.id,
          isHomepageCustom: true
        });
        res.status(201).json(customPage);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to create custom homepage" });
    }
  });

  app.put("/api/pages/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const updates = insertPageSchema.partial().parse(req.body);
      const page = await storage.updatePage(req.params.id, req.tenant!.id, updates);

      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }

      res.json(page);
    } catch (error) {
      res.status(400).json({ message: "Failed to update page" });
    }
  });

  app.delete("/api/pages/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deletePage(req.params.id, req.tenant!.id);
      if (!success) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete page" });
    }
  });

  app.post("/api/pages/activate-homepage", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { useCustom } = req.body;

      console.log('🔍 Activate homepage request:', { useCustom });

      // Salva la preferenza nelle impostazioni
      const result = await storage.updateSetting('homepageMode', useCustom ? 'custom' : 'static', req.tenant!.id);

      console.log('✅ Homepage mode updated:', result);

      res.json({ message: "Homepage mode updated successfully", mode: useCustom ? 'custom' : 'static' });
    } catch (error) {
      console.error('❌ Error in activate-homepage:', error);
      res.status(500).json({
        message: "Failed to update homepage mode",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Blog Posts Routes
  app.get("/api/blog", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      const result = await storage.getBlogPosts(req.tenant!.id, limit, offset, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/featured", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const posts = await storage.getFeaturedBlogPosts(tenantId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured posts" });
    }
  });

  // Endpoint pubblico per blog posts
  app.get("/api/blog/public", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      
      // Se l'utente è autenticato, usa SEMPRE il suo tenant (anche se è diverso dal dominio)
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = 'published'; // Solo post pubblicati per endpoint pubblico

      const result = await storage.getBlogPosts(tenantId, limit, offset, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const post = await storage.getBlogPostBySlug(req.params.slug, tenantId);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 Blog POST request received');
      console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Request body keys:', Object.keys(req.body));
      console.log('🔍 User ID:', req.user!.id);

      // Log specifici per i campi data
      console.log('🔍 Date fields analysis:');
      console.log('  - publishedAt:', req.body.publishedAt, 'type:', typeof req.body.publishedAt);
      console.log('  - scheduledAt:', req.body.scheduledAt, 'type:', typeof req.body.scheduledAt);

      console.log('🔍 Validating with schema...');
      console.log('🔍 Schema shape expected:', {
        title: 'string (required)',
        slug: 'string (required)',
        content: 'any (required)',
        excerpt: 'string (optional)',
        featuredImage: 'string (optional)',
        status: 'string (optional, default: draft)',
        isFeatured: 'boolean (optional, default: false)',
        categoryId: 'number (optional)',
        publishedAt: 'date (optional)',
        readingTime: 'number (optional)'
      });

      const postData = insertBlogPostSchema.parse(req.body);
      console.log('✅ Schema validation passed');
      console.log('🔍 Parsed data after schema validation:', JSON.stringify(postData, null, 2));

      // Log specifici per i campi data dopo validazione
      console.log('🔍 Date fields after schema validation:');
      console.log('  - publishedAt:', postData.publishedAt, 'type:', typeof postData.publishedAt);
      console.log('  - scheduledAt:', postData.scheduledAt, 'type:', typeof postData.scheduledAt);

      // Preparazione dati finali
      const finalData = { ...postData, authorId: req.user!.id, tenantId: req.tenant!.id };

      console.log('🔍 Final data before storage call:');
      console.log('  - publishedAt:', finalData.publishedAt, 'type:', typeof finalData.publishedAt);
      console.log('  - scheduledAt:', finalData.scheduledAt, 'type:', typeof finalData.scheduledAt);
      console.log('  - all fields:', Object.keys(finalData));

      console.log('🔍 Creating blog post in storage...');
      const post = await storage.createBlogPost(finalData);
      console.log('✅ Blog post created successfully:', post.id);

      res.status(201).json(post);
    } catch (error) {
      console.error('❌ Blog post creation failed:');
      console.error('Error type:', typeof error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

      if (error instanceof Error && error.message.includes('validation')) {
        console.error('🔍 Validation error details:', error);
      }

      if (error instanceof Error && error.message.includes('toISOString')) {
        console.error('🔍 Date conversion error - analyzing request data...');
        console.error('  - Original publishedAt:', req.body.publishedAt, typeof req.body.publishedAt);
        console.error('  - Original scheduledAt:', req.body.scheduledAt, typeof req.body.scheduledAt);
      }

      res.status(400).json({
        message: "Failed to create blog post"
      });
    }
  });

  app.put("/api/blog/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      console.log('Updating blog post with data:', req.body);

      // Validate the data
      const updates = insertBlogPostSchema.partial().parse(req.body);

      const post = await storage.updateBlogPost(parseInt(req.params.id), req.tenant!.id, updates);

      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      res.json(post);
    } catch (error) {
      console.error('Blog post update error:', error);
      res.status(400).json({
        message: "Failed to update blog post",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/blog/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteBlogPost(parseInt(req.params.id), req.tenant!.id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  

  // Leads Routes
  app.post("/api/leads", async (req: TenantRequest, res: Response) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead({ ...leadData, tenantId: req.tenant!.id } as any);

      // Track lead submission
      await storage.trackEvent("lead_submit", leadData, req.tenant!.id, undefined, undefined, req);

      // 🤖 INVIA NOTIFICA TELEGRAM PER NUOVO LEAD CRM
      try {
        console.log('🤖 [Telegram CRM] Invio notifica nuovo lead CRM...');
        
        // Recupera configurazione Telegram dell'owner del tenant
        const owner = await db.query.users.findFirst({
          where: and(
            eq(users.tenantId, req.tenant!.id),
            eq(users.role, 'admin')
          ),
          columns: {
            telegramBotToken: true,
            telegramChatId: true,
            username: true
          }
        });

        if (!owner?.telegramBotToken || !owner?.telegramChatId) {
          console.log('⚠️ [Telegram CRM] Configurazione Telegram non trovata per il tenant');
        } else {
          const telegramMessage = `🚨 NUOVO LEAD CRM!\n\n` +
            `👤 Nome: ${lead.name}\n` +
            `📧 Email: ${lead.email || 'N/A'}\n` +
            `📱 Telefono: ${lead.phone || 'N/A'}\n` +
            `🏢 Azienda: ${lead.company || 'N/A'}\n` +
            `📍 Fonte: ${lead.source || 'N/A'}\n` +
            `💬 Messaggio: ${lead.message || 'N/A'}\n` +
            `📊 Status: ${lead.status || 'new'}\n` +
            `🕐 Data: ${new Date().toLocaleString('it-IT')}`;

          const telegramUrl = `https://api.telegram.org/bot${owner.telegramBotToken}/sendMessage`;
          
          const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: owner.telegramChatId,
              text: telegramMessage,
              parse_mode: 'HTML'
            })
          });

          if (telegramResponse.ok) {
            console.log('✅ [Telegram CRM] Notifica nuovo lead inviata con successo!');
          } else {
            const errorData = await telegramResponse.text();
            console.error('❌ [Telegram CRM] Errore invio notifica:', errorData);
          }
        }
      } catch (telegramError) {
        console.error('❌ [Telegram CRM] Errore durante invio notifica Telegram:', telegramError);
      }

      res.status(201).json(lead);
    } catch (error) {
      res.status(400).json({ message: "Failed to create lead" });
    }
  });

  app.get("/api/leads", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      const result = await storage.getLeads(req.tenant!.id, limit, offset, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.put("/api/leads/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { status, notes } = req.body;
      const lead = await storage.updateLead(req.params.id, req.tenant!.id, { status, notes });

      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      res.json(lead);
    } catch (error) {
      res.status(400).json({ message: "Failed to update lead" });
    }
  });

  // Candidates Routes
  app.post("/api/candidates", async (req: TenantRequest, res: Response) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate({ ...candidateData, tenantId: req.tenant!.id });

      // Track candidate application
      await storage.trackEvent("candidate_apply", candidateData, req.tenant!.id, undefined, undefined, req);

      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ message: "Failed to create candidate" });
    }
  });

  app.get("/api/candidates", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      const result = await storage.getCandidates(req.tenant!.id, limit, offset, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  app.put("/api/candidates/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { status, reviewNotes } = req.body;
      const candidate = await storage.updateCandidate(req.params.id, req.tenant!.id, {
        status,
        reviewNotes,
        reviewedBy: req.user!.id
      });

      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      res.json(candidate);
    } catch (error) {
      res.status(400).json({ message: "Failed to update candidate" });
    }
  });

  // API Keys Routes
  app.get("/api/api-keys", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const apiKeys = await storage.getApiKeys(req.tenant!.id);
      res.json({ apiKeys });
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { name, scopes, environment } = req.body;

      if (!name || !scopes || !Array.isArray(scopes)) {
        return res.status(400).json({ message: "Name and scopes array are required" });
      }

      // Genera la chiave API
      const { generateApiKey } = await import('./utils/apiKey');
      const key = generateApiKey({ environment: environment || 'live' });

      const apiKey = await storage.createApiKey({
        tenantId: req.tenant!.id,
        key,
        name,
        scopes,
        isActive: true
      });

      console.log(`✅ [API Keys] New API key created: ${name} for tenant ${req.tenant!.name}`);

      res.status(201).json(apiKey);
    } catch (error) {
      console.error("Error creating API key:", error);
      res.status(400).json({ message: "Failed to create API key" });
    }
  });

  app.delete("/api/api-keys/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.revokeApiKey(id, req.tenant!.id);

      if (!success) {
        return res.status(404).json({ message: "API key not found" });
      }

      console.log(`✅ [API Keys] API key revoked: ID ${id} for tenant ${req.tenant!.name}`);

      res.json({ message: "API key revoked successfully" });
    } catch (error) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ message: "Failed to revoke API key" });
    }
  });

  // Media Routes
  app.post("/api/media", authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const mediaData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        alt: req.body.alt || "",
        uploadedBy: req.user!.id,
        tenantId: req.tenant!.id
      };

      const media = await storage.createMedia(mediaData);
      res.status(201).json(media);
    } catch (error) {
      res.status(400).json({ message: "Failed to upload file" });
    }
  });

  app.get("/api/media", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getMedia(req.tenant!.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media" });
    }
  });

  // Public endpoint to get route analytics (for frontend to fire events) - MUST BE BEFORE OTHER ANALYTICS ROUTES
  app.get("/api/analytics/routes/public", async (req: TenantRequest, res: Response) => {
    try {
      // Try to get authenticated user first
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      let tenantId = req.tenant!.id; // Default to domain tenant
      
      if (token) {
        try {
          const decoded = verifyToken(token);
          if (decoded && decoded.id) {
            const user = await storage.getUserById(decoded.id);
            if (user && user.tenantId) {
              tenantId = user.tenantId; // Use authenticated user's tenant
              console.log(`🔐 [ROUTE ANALYTICS] Using authenticated user's tenant: ${tenantId}`);
            }
          }
        } catch (jwtError) {
          console.log('⚠️ [ROUTE ANALYTICS] JWT verification failed, using domain tenant');
        }
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [SERVER API] GET /api/analytics/routes/public');
      console.log('🏢 Tenant ID:', tenantId);
      console.log('👤 Token present:', !!token);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const routes = await storage.getAllRouteAnalytics(tenantId);
      
      console.log(`\n✅ [SERVER API] Found ${routes.length} route analytics configurations for tenant ${tenantId}`);
      
      if (routes.length > 0) {
        routes.forEach((r, idx) => {
          console.log(`\n📍 [ROUTE ${idx + 1}/${routes.length}]`);
          console.log('  - Route:', r.route);
          console.log('  - Name:', r.name);
          console.log('  - Is Active:', r.isActive);
          console.log('  - FB Pixel Events:', r.facebookPixelEvents?.length || 0);
          
          if (r.facebookPixelEvents && r.facebookPixelEvents.length > 0) {
            r.facebookPixelEvents.forEach((event, eventIdx) => {
              console.log(`    🎯 Event ${eventIdx + 1}:`, {
                name: event.eventName,
                active: event.isActive,
                hasData: !!event.eventData,
                data: event.eventData
              });
            });
          } else {
            console.log('    ❌ No events configured');
          }
        });
      } else {
        console.log('❌ [SERVER API] No route analytics found for tenant:', tenantId);
      }
      
      console.log('\n📤 [SERVER API] Response data:');
      console.log(JSON.stringify(routes, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Ensure we send JSON with proper headers
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(routes);
    } catch (error) {
      console.error('❌ [SERVER ERROR] Failed to fetch route analytics:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ message: "Failed to fetch route analytics", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all available routes for analytics tracking (filtrato per tenant utente)
  app.get("/api/analytics/available-routes", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      // Usa il tenantId dell'utente autenticato
      const tenantId = req.user!.tenantId;

      console.log(`🔍 [ROUTES] Fetching available routes for user tenant: ${tenantId}`);

      // Collect all routes from different sources - SOLO dal tenant dell'utente
      const [pages, builderPages, landingPages] = await Promise.all([
        storage.getPages(tenantId, 100, 0),
        storage.getBuilderPages(tenantId, 100, 0),
        storage.getLandingPages(tenantId, 100, 0)
      ]);

      const routes: Array<{ route: string; name: string; type: string }> = [];

      // Add pages (già filtrate per tenant)
      pages.pages.forEach(page => {
        routes.push({
          route: `/${page.slug}`,
          name: page.title,
          type: 'page'
        });
      });

      // Add builder pages (già filtrate per tenant)
      builderPages.pages.forEach(page => {
        routes.push({
          route: `/${page.slug}`,
          name: page.title,
          type: 'builder-page'
        });
      });

      // Add landing pages (già filtrate per tenant)
      landingPages.landingPages.forEach(page => {
        routes.push({
          route: `/${page.slug}`,
          name: page.title,
          type: 'landing-page'
        });
      });

      // Add hardcoded routes that are always available
      const hardcodedRoutes = [
        { route: '/home', name: 'Homepage', type: 'hardcoded' },
        { route: '/orbitale', name: 'Landing Page Orbitale', type: 'hardcoded' },
        { route: '/thank-you', name: 'Thank You Page', type: 'hardcoded' },
        { route: '/candidatura', name: 'Form Candidatura', type: 'hardcoded' },
        { route: '/patrimonio', name: 'Patrimonio Page', type: 'hardcoded' },
        { route: '/relume', name: 'Relume Page', type: 'hardcoded' },
        { route: '/components', name: 'Components Showcase', type: 'hardcoded' },
        { route: '/blog', name: 'Blog', type: 'hardcoded' }
      ];

      // Add hardcoded routes, avoiding duplicates
      hardcodedRoutes.forEach(hardcodedRoute => {
        const exists = routes.some(r => r.route === hardcodedRoute.route);
        if (!exists) {
          routes.push(hardcodedRoute);
        }
      });
      
      console.log(`✅ [ROUTES] Found ${routes.length} routes for tenant ${tenantId} (including hardcoded routes)`);
      console.log(`📋 [ROUTES] Routes:`, routes.map(r => r.route));

      res.json(routes);
    } catch (error) {
      console.error('Error fetching available routes:', error);
      res.status(500).json({ message: "Failed to fetch available routes" });
    }
  });

  // Analytics Routes (general - moved after public endpoints)
  app.get("/api/analytics", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(req.query.endDate as string || new Date());

      const analytics = await storage.getAnalytics(req.tenant!.id, startDate, endDate);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get analytics summary (filtrato per tenant utente)
  app.get("/api/analytics/summary", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      // Usa il tenantId dell'utente autenticato
      const tenantId = req.user!.tenantId;
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      console.log(`🔍 [ANALYTICS SUMMARY] Fetching for user tenant: ${tenantId}`);
      const analytics = await storage.getAnalytics(tenantId, startDate, endDate);
      
      res.json({
        totalPageViews: analytics.totalViews || 0,
        totalUniqueVisitors: 0,
        avgSessionDuration: 0,
        topPerformingRoutes: analytics.pageViews?.slice(0, 5).map((pv: any) => ({
          route: pv.slug,
          views: pv.count,
          conversionRate: 0
        })) || [],
        recentActivity: []
      });
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  // Get route analytics (filtrato per tenant dell'utente autenticato)
  app.get("/api/analytics/routes", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      // Usa il tenantId dell'utente autenticato, non quello del dominio
      const tenantId = req.user!.tenantId;
      console.log(`🔍 [ANALYTICS ROUTES] Fetching routes for user tenant: ${tenantId}`);
      
      const routes = await storage.getAllRouteAnalytics(tenantId);
      console.log(`✅ [ANALYTICS ROUTES] Found ${routes.length} routes for tenant ${tenantId}`);
      
      res.json(routes);
    } catch (error) {
      console.error('Error fetching route analytics:', error);
      res.status(500).json({ message: "Failed to fetch route analytics" });
    }
  });

  // Create new route analytics
  app.post("/api/analytics/routes", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { route, name, isActive, facebookPixelEvents } = req.body;
      const tenantId = req.user!.tenantId;

      console.log(`🔍 [CREATE ROUTE] Creating route analytics for tenant: ${tenantId}`, { route, name });

      const newRoute = await storage.createRouteAnalytics({
        route,
        name,
        pageViews: 0,
        uniqueVisitors: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        isActive: isActive ?? true,
        facebookPixelEvents: facebookPixelEvents || [],
        customEvents: [],
        tenantId
      });

      console.log(`✅ [CREATE ROUTE] Route created with ID: ${newRoute.id}`);
      
      res.json({
        success: true,
        action: 'create',
        data: newRoute
      });
    } catch (error) {
      console.error('Error creating route analytics:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create route analytics" 
      });
    }
  });

  // Update route analytics (verifica tenant utente)
  app.put("/api/analytics/routes/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const routeId = parseInt(req.params.id);
      const updates = req.body;

      // Usa il tenantId dell'utente autenticato per sicurezza
      const tenantId = req.user!.tenantId;
      console.log(`🔍 [UPDATE ROUTE] Updating route ${routeId} for user tenant: ${tenantId}`);

      const updated = await storage.updateRouteAnalytics(routeId, tenantId, updates);
      
      if (!updated) {
        return res.status(404).json({ 
          success: false,
          message: "Route analytics not found" 
        });
      }

      res.json({
        success: true,
        action: 'update',
        data: updated
      });
    } catch (error) {
      console.error('Error updating route analytics:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to update route analytics" 
      });
    }
  });

  // Services Routes
  app.get("/api/services", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const category = req.query.category as string;
      const services = await storage.getServices(req.tenant!.id, category);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Public endpoint for services (for public pages like /servizi)
  app.get("/api/services/public", async (req: TenantRequest, res: Response) => {
    try {
      const category = req.query.category as string;
      const services = await storage.getServices(req.tenant!.id, category, true);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const service = await storage.getServiceBySlug(req.params.slug, req.tenant!.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 Creating service with data:', JSON.stringify(req.body, null, 2));
      console.log('🔍 User:', req.user?.username);
      console.log('🔍 User tenant ID:', req.tenant?.id);
      console.log('🔍 Request body fields:', Object.keys(req.body));

      // Validate the schema
      const serviceData = insertServiceSchema.parse(req.body);
      console.log('✅ Schema validation passed');
      console.log('🔍 Validated service data:', JSON.stringify(serviceData, null, 2));

      // Add tenantId from authenticated user
      const finalServiceData = { ...serviceData, tenantId: req.tenant!.id };
      console.log('🔍 Final service data with tenantId:', JSON.stringify(finalServiceData, null, 2));

      const service = await storage.createService(finalServiceData);
      console.log('✅ Service created successfully:', service.id);

      res.status(201).json(service);
    } catch (error) {
      console.error('❌ Service creation failed:');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

      // Special handling for Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error('🔍 Zod validation issues:', JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          message: "Errore di validazione",
          error: "I dati inseriti non sono validi",
          details: (error as any).issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      // Database or storage errors
      if (error instanceof Error) {
        return res.status(400).json({
          message: "Impossibile creare il servizio",
          error: error.message
        });
      }

      res.status(400).json({
        message: "Errore sconosciuto durante la creazione del servizio",
        error: String(error)
      });
    }
  });

  app.put("/api/services/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const updates = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(parseInt(req.params.id), req.tenant!.id, updates);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
    } catch (error) {
      res.status(400).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteService(parseInt(req.params.id), req.tenant!.id);
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Projects Routes
  app.get("/api/projects", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const projectType = req.query.projectType as string;
      const isFeatured = req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined;

      const result = await storage.getProjects(req.tenant!.id, limit, offset, status, projectType, isFeatured);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/featured", async (req: TenantRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      const projects = await storage.getFeaturedProjects(req.tenant!.id, limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured projects" });
    }
  });

  app.get("/api/projects/category/:category", async (req: TenantRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const projects = await storage.getProjectsByCategory(req.params.category, req.tenant!.id, limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects by category" });
    }
  });

  app.get("/api/projects/type/:type", async (req: TenantRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const projects = await storage.getProjectsByType(req.params.type, req.tenant!.id, limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects by type" });
    }
  });

  // Endpoint pubblico per progetti - SEMPRE usa tenant dell'utente autenticato se disponibile
  app.get("/api/projects/public", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      
      // Se l'utente è autenticato, usa SEMPRE il suo tenant
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;
      const projectType = req.query.projectType as string;
      const isFeatured = req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined;

      const result = await storage.getProjects(tenantId, limit, offset, status, projectType, isFeatured);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/public/featured", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const limit = parseInt(req.query.limit as string) || 6;
      const projects = await storage.getFeaturedProjects(tenantId, limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured projects" });
    }
  });

  app.get("/api/projects/public/category/:category", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const limit = parseInt(req.query.limit as string) || 10;
      const projects = await storage.getProjectsByCategory(req.params.category, tenantId, limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects by category" });
    }
  });

  app.get("/api/projects/public/type/:type", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      const limit = parseInt(req.query.limit as string) || 10;
      const projects = await storage.getProjectsByType(req.params.type, tenantId, limit);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects by type" });
    }
  });

  app.get("/api/projects/slug/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;

      console.log(`🔍 Fetching project by slug: ${req.params.slug} for tenant: ${tenantId}`);

      const project = await storage.getProjectBySlug(req.params.slug, tenantId);

      if (!project) {
        console.log(`❌ Project not found: ${req.params.slug}`);
        return res.status(404).json({ message: "Project not found" });
      }

      // TENANT ISOLATION CHECK: Verify project belongs to the requesting tenant
      if (project.tenantId !== tenantId) {
        console.log(`🚫 TENANT ISOLATION VIOLATION: User from tenant ${tenantId} tried to access project from tenant ${project.tenantId}`);
        return res.status(404).json({ message: "Project not found" });
      }

      console.log(`✅ Project found: ${project.title} (ID: ${project.id})`);
      res.json(project);
    } catch (error) {
      console.error('Error fetching project by slug:', error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 [PROJECT CREATE] Request received');
      console.log('🔍 [PROJECT CREATE] Request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 [PROJECT CREATE] Request body keys:', Object.keys(req.body));
      console.log('🔍 [PROJECT CREATE] User ID:', req.user!.id);

      // Validate required fields manually first
      if (!req.body.title || !req.body.description) {
        console.error('❌ [PROJECT CREATE] Missing required fields');
        console.error('🔍 [PROJECT CREATE] Title:', req.body.title);
        console.error('🔍 [PROJECT CREATE] Description:', req.body.description);
        return res.status(400).json({
          message: "Missing required fields",
          details: "title and description are required",
          received: Object.keys(req.body)
        });
      }

      // Convert date strings to Date objects or null before validation
      const dataToValidate = { ...req.body };
      
      // Handle dates - convert empty strings to null, valid strings to Date
      if ('startDate' in dataToValidate) {
        if (!dataToValidate.startDate || dataToValidate.startDate === '') {
          dataToValidate.startDate = null;
        } else if (typeof dataToValidate.startDate === 'string') {
          dataToValidate.startDate = new Date(dataToValidate.startDate);
        }
      }
      
      if ('endDate' in dataToValidate) {
        if (!dataToValidate.endDate || dataToValidate.endDate === '') {
          dataToValidate.endDate = null;
        } else if (typeof dataToValidate.endDate === 'string') {
          dataToValidate.endDate = new Date(dataToValidate.endDate);
        }
      }
      
      if ('completionDate' in dataToValidate) {
        if (!dataToValidate.completionDate || dataToValidate.completionDate === '') {
          dataToValidate.completionDate = null;
        } else if (typeof dataToValidate.completionDate === 'string') {
          dataToValidate.completionDate = new Date(dataToValidate.completionDate);
        }
      }

      console.log('🔍 [PROJECT CREATE] Data after date conversion:', JSON.stringify(dataToValidate, null, 2));
      console.log('🔍 [PROJECT CREATE] Validating with schema...');
      
      const projectData = insertProjectSchema.parse(dataToValidate);
      console.log('✅ [PROJECT CREATE] Schema validation passed');
      console.log('🔍 [PROJECT CREATE] Parsed data:', JSON.stringify(projectData, null, 2));

      const finalData = {
        ...projectData,
        authorId: req.user!.id,
        tenantId: req.tenant!.id
      };

      console.log('🔍 [PROJECT CREATE] Final data to be saved:', JSON.stringify(finalData, null, 2));
      console.log('🔍 [PROJECT CREATE] Creating project in storage...');
      const project = await storage.createProject(finalData);
      console.log('✅ [PROJECT CREATE] Project created successfully:', project.id);

      res.status(201).json(project);
    } catch (error) {
      console.error('❌ [PROJECT CREATE] Failed:');
      console.error('Error type:', typeof error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

      // Special handling for Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error('🔍 [PROJECT CREATE] Zod validation issues:', JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          error: "Schema validation error",
          details: error.issues
        });
      }

      if (error instanceof Error && error.message.includes('validation')) {
        console.error('🔍 [PROJECT CREATE] Validation error details:', error);
      }

      res.status(400).json({
        message: "Failed to create project",
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Update project
  app.put("/api/projects/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      
      console.log('🔍 [PROJECT UPDATE] Request received for ID:', projectId);
      console.log('🔍 [PROJECT UPDATE] Tenant ID:', req.tenant!.id);
      console.log('🔍 [PROJECT UPDATE] Request body keys:', Object.keys(req.body));

      // Convert date strings to Date objects or null before validation
      const dataToValidate = { ...req.body };
      
      // Handle dates - convert empty strings to null, valid strings to Date
      if ('startDate' in dataToValidate) {
        if (!dataToValidate.startDate || dataToValidate.startDate === '') {
          dataToValidate.startDate = null;
        } else if (typeof dataToValidate.startDate === 'string') {
          dataToValidate.startDate = new Date(dataToValidate.startDate);
        }
      }
      
      if ('endDate' in dataToValidate) {
        if (!dataToValidate.endDate || dataToValidate.endDate === '') {
          dataToValidate.endDate = null;
        } else if (typeof dataToValidate.endDate === 'string') {
          dataToValidate.endDate = new Date(dataToValidate.endDate);
        }
      }
      
      if ('completionDate' in dataToValidate) {
        if (!dataToValidate.completionDate || dataToValidate.completionDate === '') {
          dataToValidate.completionDate = null;
        } else if (typeof dataToValidate.completionDate === 'string') {
          dataToValidate.completionDate = new Date(dataToValidate.completionDate);
        }
      }

      console.log('🔍 [PROJECT UPDATE] Data after date conversion:', JSON.stringify(dataToValidate, null, 2));

      // Parse and validate data, allowing partial updates
      const updates = insertProjectSchema.partial().parse(dataToValidate);
      
      console.log('✅ [PROJECT UPDATE] Schema validation passed');
      console.log('🔍 [PROJECT UPDATE] Calling storage.updateProject...');

      const updated = await storage.updateProject(projectId, req.tenant!.id, updates);

      if (!updated) {
        console.error('❌ [PROJECT UPDATE] Project not found');
        return res.status(404).json({ message: "Project not found" });
      }

      console.log('✅ [PROJECT UPDATE] Success:', updated.id);
      res.json(updated);
    } catch (error: any) {
      console.error("❌ [PROJECT UPDATE] Error:", error);
      console.error("❌ [PROJECT UPDATE] Stack:", error.stack);
      
      // Log validation errors specifically if they are Zod errors
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error("🔍 [PROJECT UPDATE] Zod validation error details:", JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      // Generic error handling
      res.status(400).json({
        message: "Failed to update project",
        error: error.message || String(error)
      });
    }
  });

  app.delete("/api/projects/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteProject(parseInt(req.params.id), req.tenant!.id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Landing Pages Routes
  app.get("/api/landing-pages", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const includeTemplates = req.query.includeTemplates === 'true';

      const result = await storage.getLandingPages(req.tenant!.id, limit, offset, includeTemplates);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch landing pages" });
    }
  });

  app.get("/api/landing-pages/templates", async (req: TenantRequest, res: Response) => {
    try {
      const templates = await storage.getLandingPageTemplates(req.tenant!.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch landing page templates" });
    }
  });

  app.get("/api/landing-pages/:id", async (req: TenantRequest, res: Response) => {
    try {
      const landingPage = await storage.getLandingPageById(parseInt(req.params.id), req.tenant!.id);
      if (!landingPage) {
        return res.status(404).json({ message: "Landing page not found" });
      }
      res.json(landingPage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch landing page" });
    }
  });

  app.get("/api/landing-pages/slug/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;
      
      const landingPage = await storage.getLandingPageBySlug(req.params.slug, tenantId);
      if (!landingPage) {
        return res.status(404).json({ message: "Landing page not found" });
      }

      // TENANT ISOLATION CHECK
      if (landingPage.tenantId !== tenantId) {
        console.log(`🚫 TENANT ISOLATION VIOLATION: User from tenant ${tenantId} tried to access landing page from tenant ${landingPage.tenantId}`);
        return res.status(404).json({ message: "Landing page not found" });
      }
      
      res.json(landingPage);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch landing page" });
    }
  });

  app.post("/api/landing-pages", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const landingPageData = insertLandingPageSchema.parse(req.body);
      const landingPage = await storage.createLandingPage({
        ...landingPageData,
        authorId: req.user!.id,
        tenantId: req.tenant!.id
      } as any);
      res.status(201).json(landingPage);
    } catch (error) {
      console.error('Landing page creation error:', error);
      res.status(400).json({
        message: "Failed to create landing page",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put("/api/landing-pages/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      console.log('Updating landing page with data:', req.body);

      // Validate the data
      const updates = insertLandingPageSchema.partial().parse(req.body);

      const landingPage = await storage.updateLandingPage(parseInt(req.params.id), req.tenant!.id, updates);

      if (!landingPage) {
        return res.status(404).json({ message: "Landing page not found" });
      }

      res.json(landingPage);
    } catch (error) {
      console.error('Landing page update error:', error);
      res.status(400).json({
        message: "Failed to update landing page",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/landing-pages/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteLandingPage(parseInt(req.params.id), req.tenant!.id);
      if (!success) {
        return res.status(404).json({ message: "Landing page not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete landing page" });
    }
  });

  app.post("/api/landing-pages/:id/duplicate", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { title, slug } = req.body;

      if (!title || !slug) {
        return res.status(400).json({ message: "Title and slug are required" });
      }

      const duplicatedLandingPage = await storage.duplicateLandingPage(
        parseInt(req.params.id),
        req.tenant!.id,
        title,
        slug,
        req.user!.id
      );

      if (!duplicatedLandingPage) {
        return res.status(404).json({ message: "Original landing page not found" });
      }

      res.status(201).json(duplicatedLandingPage);
    } catch (error) {
      res.status(400).json({ message: "Failed to duplicate landing page" });
    }
  });

  app.post("/api/landing-pages/:id/toggle-status", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const landingPage = await storage.toggleLandingPageStatus(parseInt(req.params.id), req.tenant!.id);
      if (!landingPage) {
        return res.status(404).json({ message: "Landing page not found" });
      }
      res.json(landingPage);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle landing page status" });
    }
  });

  app.post("/api/landing-pages/:id/track-conversion", async (req: TenantRequest, res: Response) => {
    try {
      await storage.trackLandingPageConversion(parseInt(req.params.id), req.tenant!.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to track conversion" });
    }
  });

  // Get landing pages with aggregated stats
  app.get("/api/landing-pages/stats", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenant!.id;
      
      // Get all landing pages for this tenant
      const landingPagesResult = await storage.getLandingPages(tenantId, 1000, 0, false);
      
      // For each landing page, aggregate analytics data
      const landingPagesWithStats = await Promise.all(
        landingPagesResult.landingPages.map(async (page) => {
          // Count page views from analytics table
          const viewsResult = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE tenant_id = ${tenantId}
              AND page_slug = ${page.slug}
              AND event = 'page_view'
          `);
          const analyticsViews = parseInt(String(viewsResult.rows[0]?.count || '0'));
          
          // Count conversions from analytics table
          const conversionsResult = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE tenant_id = ${tenantId}
              AND (
                page_slug LIKE ${'thank-you-' + page.slug + '%'}
                OR (data->>'landingPageSlug')::text = ${page.slug}
                OR (data->>'campaign')::text = ${page.slug}
              )
              AND event = 'conversion'
          `);
          const analyticsConversions = parseInt(String(conversionsResult.rows[0]?.count || '0'));
          
          // Combine with existing counters (use max of both)
          const totalViews = Math.max(page.views || 0, analyticsViews);
          const totalConversions = Math.max(page.conversions || 0, analyticsConversions);
          const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(2) : '0.00';
          
          return {
            id: page.id,
            title: page.title,
            slug: page.slug,
            isActive: page.isActive,
            views: totalViews,
            conversions: totalConversions,
            conversionRate: parseFloat(conversionRate),
            updatedAt: page.updatedAt,
            createdAt: page.createdAt
          };
        })
      );
      
      res.json({ landingPages: landingPagesWithStats });
    } catch (error) {
      console.error('Error fetching landing pages stats:', error);
      res.status(500).json({ message: "Failed to fetch landing pages statistics" });
    }
  });

  // Duplicate from Patrimonio template
  app.post("/api/landing-pages/duplicate-from-patrimonio", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { title, slug } = req.body;

      if (!title || !slug) {
        return res.status(400).json({ message: "Title and slug are required" });
      }

      // Check if slug already exists
      const existingPage = await storage.getLandingPageBySlug(slug, req.tenant!.id);
      if (existingPage) {
        return res.status(400).json({ message: "Slug already exists" });
      }

      const duplicatedLandingPage = await storage.duplicateFromPatrimonioTemplate(
        title,
        slug,
        req.user!.id,
        req.tenant!.id
      );

      res.json(duplicatedLandingPage);
    } catch (error) {
      console.error('Error duplicating from Patrimonio template:', error);
      res.status(400).json({ message: "Failed to duplicate from Patrimonio template" });
    }
  });

  // Builder Pages Routes
  app.get("/api/builder-pages", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getBuilderPages(req.tenant!.id, limit, offset);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch builder pages" });
    }
  });

  app.get("/api/builder-pages/:id", async (req: TenantRequest, res: Response) => {
    try {
      const page = await storage.getBuilderPageById(parseInt(req.params.id), req.tenant!.id);
      if (!page) {
        return res.status(404).json({ message: "Builder page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch builder page" });
    }
  });

  app.get("/api/builder-pages/slug/:slug", async (req: TenantRequest, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user?.tenantId || req.tenant!.id;
      
      console.log(`🔍 Searching builder page with slug: ${req.params.slug} in tenant: ${tenantId}`);
      const page = await storage.getBuilderPageBySlug(req.params.slug, tenantId);
      console.log(`📄 Builder page found:`, page ? `ID ${page.id}` : 'NOT FOUND');
      
      if (!page) {
        return res.status(404).json({ message: "Builder page not found" });
      }

      // TENANT ISOLATION CHECK: Verify page belongs to the requesting tenant
      if (page.tenantId !== tenantId) {
        console.log(`🚫 TENANT ISOLATION VIOLATION: User from tenant ${tenantId} tried to access builder page from tenant ${page.tenantId}`);
        return res.status(404).json({ message: "Builder page not found" });
      }
      
      res.json(page);
    } catch (error) {
      console.error('❌ Error fetching builder page:', error);
      res.status(500).json({ message: "Failed to fetch builder page" });
    }
  });

  app.post("/api/builder-pages", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 Builder page POST request received');
      console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 Request body keys:', Object.keys(req.body));
      console.log('🔍 User ID:', req.user!.id);

      // Validate required fields manually first
      if (!req.body.title || !req.body.slug) {
        console.error('❌ Missing required fields');
        return res.status(400).json({
          message: "Missing required fields",
          details: "title and slug are required",
          received: Object.keys(req.body)
        });
      }

      console.log('🔍 Validating with schema...');
      // Extract authorId from request body if present, then validate the rest
      const { authorId: _, ...bodyWithoutAuthorId } = req.body;
      const pageData = insertBuilderPageSchema.parse(bodyWithoutAuthorId);
      console.log('✅ Schema validation passed');
      console.log('🔍 Parsed data:', JSON.stringify(pageData, null, 2));

      const finalData = {
        ...pageData,
        authorId: req.user!.id,
        tenantId: req.tenant!.id
      };

      console.log('🔍 Final data to be saved:', JSON.stringify(finalData, null, 2));
      console.log('🔍 Creating builder page in storage...');
      const page = await storage.createBuilderPage(finalData);
      console.log('✅ Builder page created successfully:', page.id);

      res.status(201).json(page);
    } catch (error) {
      console.error('❌ Builder page creation failed:');
      console.error('Error type:', typeof error);
      console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

      // Special handling for Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        console.error('🔍 Zod validation issues:', JSON.stringify(error.issues, null, 2));
        return res.status(400).json({
          message: "Validation failed",
          error: "Schema validation error",
          details: error.issues
        });
      }

      if (error instanceof Error && error.message.includes('validation')) {
        console.error('🔍 Validation error details:', error);
      }

      res.status(400).json({
        message: "Failed to create builder page",
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.put("/api/builder-pages/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const updates = insertBuilderPageSchema.partial().parse(req.body);
      const page = await storage.updateBuilderPage(parseInt(req.params.id), req.tenant!.id, updates);

      if (!page) {
        return res.status(404).json({ message: "Builder page not found" });
      }

      res.json(page);
    } catch (error) {
      res.status(400).json({
        message: "Failed to update builder page",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete("/api/builder-pages/:id", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const success = await storage.deleteBuilderPage(parseInt(req.params.id), req.tenant!.id);
      if (!success) {
        return res.status(404).json({ message: "Builder page not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete builder page" });
    }
  });

  app.post("/api/builder-pages/:id/toggle-status", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const page = await storage.toggleBuilderPageStatus(parseInt(req.params.id), req.tenant!.id);
      if (!page) {
        return res.status(404).json({ message: "Builder page not found" });
      }
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle builder page status" });
    }
  });

  // ========== SUPER ADMIN ROUTES ==========

  // Superadmin check endpoint (no tenant restriction)
  app.get("/api/superadmin/check", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      console.log('🔍 [SUPERADMIN API] ==========================================');
      console.log('🔍 [SUPERADMIN API] Check endpoint called');
      console.log('🔍 [SUPERADMIN API] Headers:', req.headers);
      console.log('🔍 [SUPERADMIN API] User object:', req.user);
      console.log('🔍 [SUPERADMIN API] User username:', req.user?.username);
      console.log('🔍 [SUPERADMIN API] User role:', req.user?.role);
      console.log('🔍 [SUPERADMIN API] User ID:', req.user?.id);
      console.log('🔍 [SUPERADMIN API] User tenantId:', req.user?.tenantId);
      
      if (!req.user) {
        console.log('❌ [SUPERADMIN API] No user in request!');
        return res.status(401).json({ 
          isSuperadmin: false,
          message: "Not authenticated" 
        });
      }
      
      if (req.user.role !== 'superadmin') {
        console.log('❌ [SUPERADMIN API] Check failed - user is not superadmin');
        console.log('❌ [SUPERADMIN API] Actual role:', req.user.role);
        console.log('❌ [SUPERADMIN API] Returning 403 with isSuperadmin: false');
        return res.status(403).json({ 
          isSuperadmin: false,
          message: "Superadmin access required" 
        });
      }
      
      console.log('✅ [SUPERADMIN API] Check passed - user is superadmin');
      console.log('✅ [SUPERADMIN API] Returning 200 with isSuperadmin: true');
      console.log('🔍 [SUPERADMIN API] ==========================================');
      res.json({ isSuperadmin: true });
    } catch (error) {
      console.error('❌ [SUPERADMIN API] Check error:', error);
      console.error('❌ [SUPERADMIN API] Error stack:', error instanceof Error ? error.stack : 'No stack');
      res.status(500).json({ 
        isSuperadmin: false,
        message: "Failed to check superadmin status" 
      });
    }
  });

  // Get all tenants (superadmin only)
  app.get("/api/superadmin/tenants", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json(allTenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Create new tenant (superadmin only)
  app.post("/api/superadmin/tenants", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const { name, domain, isActive } = req.body;
      const tenant = await storage.createTenant({ name, domain, isActive: isActive ?? true });
      res.status(201).json(tenant);
    } catch (error) {
      res.status(400).json({ message: "Failed to create tenant", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Update tenant (superadmin only)
  app.put("/api/superadmin/tenants/:id", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const { name, domain, isActive } = req.body;
      const [tenant] = await db.update(tenants as any)
        .set({ name, domain, isActive, updatedAt: new Date() })
        .where(eq((tenants as any).id, parseInt(req.params.id)))
        .returning();

      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      res.status(400).json({ message: "Failed to update tenant" });
    }
  });

  // Delete tenant (superadmin only)
  app.delete("/api/superadmin/tenants/:id", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      await db.delete(tenants as any).where(eq((tenants as any).id, parseInt(req.params.id)));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Get all users (superadmin only)
  app.get("/api/superadmin/users", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        createdAt: users.createdAt,
        tenantName: (tenants as any).name,
        tenantDomain: (tenants as any).domain
      })
      .from(users)
      .leftJoin(tenants as any, eq(users.tenantId, (tenants as any).id))
      .orderBy(asc(users.tenantId), asc(users.username));

      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (superadmin only)
  app.post("/api/superadmin/users", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, password, role, tenantId } = req.body;

      const existingUser = await storage.getUserByUsername(username, tenantId);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists in this tenant" });
      }

      const user = await storage.createUser({ username, email, password, role: role || 'admin', tenantId });
      res.status(201).json(sanitizeUserForResponse(user));
    } catch (error) {
      res.status(400).json({ message: "Failed to create user", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Delete user (superadmin only)
  app.delete("/api/superadmin/users/:id", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      await db.delete(users).where(eq(users.id, req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put("/api/superadmin/users/:id/password", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const targetUser = await storage.getUserById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, req.params.id));
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.post("/api/superadmin/users/:id/login-as", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const targetUser = await storage.getUserById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const token = generateToken(targetUser);
      res.json({ token, user: { id: targetUser.id, username: targetUser.username, role: targetUser.role, tenantId: targetUser.tenantId } });
    } catch (error) {
      res.status(500).json({ message: "Failed to impersonate user" });
    }
  });

  // GET Gemini config (superadmin only)
  app.get("/api/superadmin/gemini-config", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const configs = await db.select().from(superadminGeminiConfig).limit(1);
      if (!configs.length) {
        return res.json({ configured: false, enabled: false, keyPreview: null });
      }
      const config = configs[0];
      let keyPreview: string | null = null;
      let keyCount = 0;
      try {
        const keys = JSON.parse(decrypt(config.apiKeysEncrypted)) as string[];
        keyCount = keys.length;
        if (keys.length > 0) {
          const firstKey = keys[0];
          keyPreview = firstKey.substring(0, 8) + "••••••••••••••••";
        }
      } catch (decryptError) {
        console.error("Gemini config decrypt error — config may be corrupted:", decryptError);
        return res.json({ configured: true, enabled: config.enabled, keyPreview: null, keyCount: 0, decryptError: true });
      }
      res.json({ configured: true, enabled: config.enabled, keyPreview, keyCount });
    } catch (error) {
      console.error("Error fetching Gemini config:", error);
      res.status(500).json({ message: "Failed to fetch Gemini config" });
    }
  });

  // POST Gemini config (superadmin only)
  app.post("/api/superadmin/gemini-config", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const { apiKeys, enabled } = req.body as { apiKeys?: string[]; enabled: boolean };
      const existing = await db.select().from(superadminGeminiConfig).limit(1);
      const hasNewKeys = Array.isArray(apiKeys) && apiKeys.map((k: string) => k.trim()).filter(Boolean).length > 0;

      if (existing.length > 0) {
        const updatePayload: any = { enabled: enabled !== false, updatedAt: new Date() };
        if (hasNewKeys) {
          const cleanKeys = (apiKeys as string[]).map((k: string) => k.trim()).filter(Boolean);
          updatePayload.apiKeysEncrypted = encrypt(JSON.stringify(cleanKeys));
        }
        await db.update(superadminGeminiConfig)
          .set(updatePayload)
          .where(eq(superadminGeminiConfig.id, existing[0].id));
      } else {
        if (!hasNewKeys) {
          return res.status(400).json({ message: "Inserisci almeno una API key" });
        }
        const cleanKeys = (apiKeys as string[]).map((k: string) => k.trim()).filter(Boolean);
        const encrypted = encrypt(JSON.stringify(cleanKeys));
        await db.insert(superadminGeminiConfig).values({ apiKeysEncrypted: encrypted, enabled: enabled !== false });
      }
      res.json({ message: "Configurazione AI salvata con successo" });
    } catch (error) {
      console.error("Error saving Gemini config:", error);
      res.status(500).json({ message: "Failed to save Gemini config" });
    }
  });

  // DELETE Gemini config (superadmin only)
  app.delete("/api/superadmin/gemini-config", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      await db.delete(superadminGeminiConfig);
      res.json({ message: "Configurazione AI rimossa" });
    } catch (error) {
      console.error("Error deleting Gemini config:", error);
      res.status(500).json({ message: "Failed to delete Gemini config" });
    }
  });

  // GET check if AI (Gemini) key is configured (admin only)
  app.get("/api/ai/check-config", authenticateToken, requireRole("admin"), async (_req: AuthRequest, res: Response) => {
    try {
      const keys = await getSuperAdminGeminiKeys();
      const hasEnvKey = !!process.env.GEMINI_API_KEY;
      const configured = (keys && keys.enabled && keys.keys.length > 0) || hasEnvKey;
      res.json({ configured: !!configured });
    } catch {
      res.json({ configured: !!process.env.GEMINI_API_KEY });
    }
  });

  // GET templates list for AI landing page generator (admin only)
  app.get("/api/ai/landing-page-templates", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    const templates = Object.values(AI_TEMPLATES).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      colors: t.colors,
    }));
    res.json({ templates });
  });

  // POST generate landing page with AI (admin only)
  app.post("/api/ai/generate-landing-page", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response) => {
    try {
      const { description, templateId } = req.body as { description: string; templateId: string };
      if (!description || description.trim().length < 10) {
        return res.status(400).json({ message: "Descrizione troppo breve. Inserisci almeno 10 caratteri." });
      }

      const safeTemplateId = (templateId && AI_TEMPLATES[templateId as TemplateId]) ? templateId as TemplateId : "bianco";

      const brandVoiceData = await storage.getBrandVoice(req.tenant!.id);
      const content = await generateLandingPageContent(description.trim(), safeTemplateId, brandVoiceData);
      const components = buildComponentsFromContent(content, safeTemplateId);

      res.json({
        content,
        components,
        suggestedTitle: content.meta.title,
        suggestedSlug: content.meta.slug,
        suggestedMetaTitle: content.meta.title,
        suggestedMetaDescription: content.meta.description,
      });
    } catch (error: any) {
      console.error("Error generating landing page with AI:", error);
      if (error.message?.includes("chiave API")) {
        return res.status(503).json({ message: error.message });
      }
      res.status(500).json({ message: "Errore nella generazione AI. Riprova tra qualche secondo.", detail: error.message });
    }
  });

  // Get all content across tenants (superadmin only)
  app.get("/api/superadmin/content/all", authenticateToken, requireRole("superadmin"), async (req: AuthRequest, res: Response) => {
    try {
      const [allPages, allBlogPosts, allServices, allLandingPages, allBuilderPages, allProjects, allLeads, allCandidates] = await Promise.all([
        storage.getAllPagesForSuperadmin(),
        storage.getAllBlogPostsForSuperadmin(),
        storage.getAllServicesForSuperadmin(),
        storage.getAllLandingPagesForSuperadmin(),
        storage.getAllBuilderPagesForSuperadmin(),
        storage.getAllProjectsForSuperadmin(),
        storage.getAllLeadsForSuperadmin(),
        storage.getAllCandidatesForSuperadmin()
      ]);

      res.json({
        pages: allPages,
        blogPosts: allBlogPosts,
        services: allServices,
        landingPages: allLandingPages,
        builderPages: allBuilderPages,
        projects: allProjects,
        leads: allLeads,
        candidates: allCandidates
      });
    } catch (error) {
      console.error('Error fetching all content:', error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // SEO Routes - Public endpoints for sitemap and robots
  app.get("/sitemap.xml", async (req: TenantRequest, res: Response) => {
    try {
      if (!req.tenant?.id) {
        return res.status(400).send('Tenant not identified');
      }

      const sitemap = await SEOManager.generateSitemap(req.tenant.id);
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  app.get("/robots.txt", async (req: TenantRequest, res: Response) => {
    try {
      if (!req.tenant?.id) {
        return res.status(400).send('Tenant not identified');
      }

      const robotsTxt = await SEOManager.generateRobotsTxt(req.tenant.id);
      res.header('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error) {
      console.error('Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}