import { db } from "./db";
import {
  tenants, users, pages, blogPosts, leads, candidates, media, analytics,
  categories, tags, blogPostTags, services, landingPages, builderPages, projects, globalSeoSettings,
  settings, routeAnalytics, clients, googleSheetsCampaigns, marketingLeads, apiKeys, brandVoice,
  type InsertTenant, type Tenant, type InsertUser, type User, type InsertPage, type Page,
  type InsertBlogPost, type BlogPost, type BlogPostWithRelations,
  type InsertLead, type Lead, type InsertCandidate, type Candidate,
  type InsertMedia, type Media, type InsertService, type Service,
  type InsertLandingPage, type LandingPage, type InsertBuilderPage, type BuilderPage,
  type InsertProject, type Project,
  type InsertGlobalSeoSettings, type GlobalSeoSettings,
  type InsertRouteAnalytics, type RouteAnalytics,
  type InsertClient, type Client,
  type InsertGoogleSheetsCampaign, type GoogleSheetsCampaign,
  type InsertApiKey, type ApiKey,
  type BrandVoice
} from "@shared/schema";
import { eq, desc, asc, like, and, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

export class Storage {
  // Tenant operations
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    try {
      const [tenant] = await db.select().from(tenants as any).where(eq((tenants as any).domain, domain));
      return tenant || null;
    } catch (error) {
      console.error('[STORAGE] Error in getTenantByDomain:', error);
      return null;
    }
  }

  async getTenantById(id: number): Promise<Tenant | null> {
    const [tenant] = await db.select().from(tenants as any).where(eq((tenants as any).id, id));
    return tenant || null;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(asc(tenants.id));
  }

  async getActiveTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).where(eq(tenants.isActive, true)).orderBy(asc(tenants.name));
  }

  async updateTenant(id: number, updates: Partial<InsertTenant>): Promise<Tenant | null> {
    const [updated] = await db.update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated || null;
  }

  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async getUserByUsername(username: string, tenantId: number): Promise<User | null> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.username, username), eq(users.tenantId, tenantId)));
    return user || null;
  }

  async getUserByEmail(email: string, tenantId: number): Promise<User | null> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)));
    return user || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Page operations
  async createPage(pageData: InsertPage & { authorId: string; tenantId: number }): Promise<Page> {
    const [page] = await db.insert(pages).values({
      ...pageData,
      updatedAt: new Date(),
    }).returning();
    return page;
  }

  async getPages(tenantId: number, limit = 10, offset = 0): Promise<{ pages: Page[], total: number }> {
    const [pagesResult, totalResult] = await Promise.all([
      db.select().from(pages)
        .where(eq(pages.tenantId, tenantId))
        .orderBy(desc(pages.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(pages)
        .where(eq(pages.tenantId, tenantId))
    ]);

    return {
      pages: pagesResult,
      total: totalResult[0].count
    };
  }

  async getPageBySlug(slug: string, tenantId: number): Promise<Page | null> {
    const [page] = await db.select().from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.tenantId, tenantId)));
    return page || null;
  }

  async getPageById(id: string, tenantId: number): Promise<Page | null> {
    const [page] = await db.select().from(pages)
      .where(and(eq(pages.id, id), eq(pages.tenantId, tenantId)));
    return page || null;
  }

  async updatePage(id: string, tenantId: number, updates: Partial<InsertPage>): Promise<Page | null> {
    const [page] = await db.update(pages)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(pages.id, id), eq(pages.tenantId, tenantId)))
      .returning();
    return page || null;
  }

  async deletePage(id: string, tenantId: number): Promise<boolean> {
    const result = await db.delete(pages)
      .where(and(eq(pages.id, id), eq(pages.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Blog post operations
  async createBlogPost(postData: InsertBlogPost): Promise<BlogPostWithRelations> {
    try {
      const processedData = { ...postData };

      if (processedData.publishedAt && typeof processedData.publishedAt === 'string') {
        processedData.publishedAt = new Date(processedData.publishedAt);
      }

      if (processedData.scheduledAt && typeof processedData.scheduledAt === 'string') {
        processedData.scheduledAt = new Date(processedData.scheduledAt);
      }

      const [post] = await db.insert(blogPosts).values(processedData as any).returning();

      const fullPost = await this.getBlogPostById(post.id, post.tenantId) as BlogPostWithRelations;

      return fullPost;
    } catch (error) {
      console.error('❌ Storage: createBlogPost failed:');
      console.error('Storage error:', error);
      console.error('Storage error name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Storage error message:', error instanceof Error ? error.message : error);
      console.error('Storage error stack:', error instanceof Error ? error.stack : 'No stack');

      if (error instanceof Error && error.message.includes('toISOString')) {
        console.error('🔍 Storage: toISOString error details:');
        console.error('  - postData.publishedAt:', postData.publishedAt, typeof postData.publishedAt);
        console.error('  - postData.scheduledAt:', postData.scheduledAt, typeof postData.scheduledAt);
      }

      throw error;
    }
  }

  async getBlogPosts(tenantId: number, limit = 10, offset = 0, status?: string): Promise<{ posts: BlogPostWithRelations[], total: number }> {
    const conditions = [];
    conditions.push(eq(blogPosts.tenantId, tenantId));
    if (status) conditions.push(eq(blogPosts.status, status));

    const [postsResult, totalResult] = await Promise.all([
      db.select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        scheduledAt: blogPosts.scheduledAt,
        isFeatured: blogPosts.isFeatured,
        categoryId: blogPosts.categoryId,
        authorId: blogPosts.authorId,
        views: blogPosts.views,
        readingTime: blogPosts.readingTime,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        author: {
          username: users.username
        },
        category: {
          name: categories.name,
          slug: categories.slug
        }
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(categories, eq(blogPosts.categoryId, categories.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset),
      db.select({ count: count() }).from(blogPosts).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    // Fetch tags for each post
    const postsWithTags = await Promise.all(
      postsResult.map(async (post) => {
        const postTags = await db.select({
          name: tags.name,
          slug: tags.slug
        })
        .from(blogPostTags)
        .innerJoin(tags, eq(blogPostTags.tagId, tags.id))
        .where(eq(blogPostTags.blogPostId, post.id));

        return {
          ...post,
          tags: postTags
        };
      })
    );

    return {
      posts: postsWithTags,
      total: totalResult[0].count
    };
  }

  async getBlogPostBySlug(slug: string, tenantId: number): Promise<BlogPost | null> {
    const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.tenantId, tenantId)));
    if (post) {
      // Increment view count
      await db.update(blogPosts)
        .set({ views: sql`${blogPosts.views} + 1` })
        .where(and(eq(blogPosts.id, post.id), eq(blogPosts.tenantId, tenantId)));
    }
    return post || null;
  }

  async getBlogPostById(id: number, tenantId: number): Promise<BlogPost | null> {
    const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.tenantId, tenantId)));
    return post || null;
  }

  async updateBlogPost(id: number, tenantId: number, updates: Partial<InsertBlogPost>): Promise<BlogPost | null> {
    try {
      // Prepare update data
      const updateData: any = { ...updates, updatedAt: new Date() };

      // Auto-set publishedAt if status is published and not already set
      if (updateData.status === 'published' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }

      // Handle publishedAt conversion
      if (updateData.publishedAt && typeof updateData.publishedAt === 'string') {
        updateData.publishedAt = new Date(updateData.publishedAt);
      }

      // Handle scheduledAt conversion
      if (updateData.scheduledAt && typeof updateData.scheduledAt === 'string') {
        updateData.scheduledAt = new Date(updateData.scheduledAt);
      }

      // Remove undefined values to avoid database errors
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const [post] = await db.update(blogPosts)
        .set(updateData)
        .where(and(eq(blogPosts.id, id), eq(blogPosts.tenantId, tenantId)))
        .returning();

      return post || null;
    } catch (error) {
      console.error('Error updating blog post in storage:', error);
      throw error;
    }
  }

  async deleteBlogPost(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(and(eq(blogPosts.id, id), eq(blogPosts.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getFeaturedBlogPosts(tenantId: number, limit = 3): Promise<BlogPost[]> {
    return db.select().from(blogPosts)
      .where(and(eq(blogPosts.isFeatured, true), eq(blogPosts.status, "published"), eq(blogPosts.tenantId, tenantId)))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  }

  // Lead operations
  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async getLeads(tenantId: number, limit = 50, offset = 0, status?: string): Promise<{ leads: Lead[], total: number }> {
    const conditions = [];
    conditions.push(eq(leads.tenantId, tenantId));
    if (status) conditions.push(eq(leads.status, status));

    const [leadsResult, totalResult] = await Promise.all([
      db.select().from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(leads.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(leads).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      leads: leadsResult,
      total: totalResult[0].count
    };
  }

  async getLeadById(id: string, tenantId: number): Promise<Lead | null> {
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
    return lead || null;
  }

  async updateLead(id: string, tenantId: number, updates: Partial<InsertLead & { status: string, notes: string }>): Promise<Lead | null> {
    const [lead] = await db.update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)))
      .returning();
    return lead || null;
  }

  // Marketing Leads operations
  async getMarketingLeads(tenantId: number, limit = 50, offset = 0): Promise<{ leads: any[], total: number }> {
    const [leadsResult, totalResult] = await Promise.all([
      db.select().from(marketingLeads)
        .where(eq(marketingLeads.tenantId, tenantId))
        .orderBy(desc(marketingLeads.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(marketingLeads).where(eq(marketingLeads.tenantId, tenantId))
    ]);

    return {
      leads: leadsResult,
      total: totalResult[0].count
    };
  }

  // Public API - Filtered CRM leads with source filter in SQL
  async getFilteredCrmLeads(tenantId: number, limit = 50, offset = 0, source?: string, status?: string): Promise<{ leads: Lead[], total: number }> {
    const conditions = [];
    conditions.push(eq(leads.tenantId, tenantId));
    if (status) conditions.push(eq(leads.status, status));
    if (source) conditions.push(like(leads.source, `%${source}%`));

    const [leadsResult, totalResult] = await Promise.all([
      db.select().from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(leads.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(leads).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      leads: leadsResult,
      total: totalResult[0].count
    };
  }

  // Public API - Filtered marketing leads with source filter in SQL
  async getFilteredMarketingLeads(tenantId: number, limit = 50, offset = 0, source?: string): Promise<{ leads: any[], total: number }> {
    const conditions = [];
    conditions.push(eq(marketingLeads.tenantId, tenantId));
    if (source) conditions.push(like(marketingLeads.source, `%${source}%`));

    const [leadsResult, totalResult] = await Promise.all([
      db.select().from(marketingLeads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(marketingLeads.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(marketingLeads).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      leads: leadsResult,
      total: totalResult[0].count
    };
  }

  // Public API - Combined leads with UNION query
  async getCombinedLeads(tenantId: number, limit = 50, offset = 0, source?: string, status?: string): Promise<{ leads: any[], total: number }> {
    // Build WHERE conditions for CRM leads
    const crmConditions = [sql`tenant_id = ${tenantId}`];
    if (status) crmConditions.push(sql`status = ${status}`);
    if (source) crmConditions.push(sql`source ILIKE ${`%${source}%`}`);
    
    // Build WHERE conditions for marketing leads
    const marketingConditions = [sql`tenant_id = ${tenantId}`];
    if (source) marketingConditions.push(sql`source ILIKE ${`%${source}%`}`);

    // Build the WHERE clause for CRM leads
    const crmWhere = crmConditions.length > 0 ? sql.join(crmConditions, sql` AND `) : sql`TRUE`;
    
    // Build the WHERE clause for marketing leads
    const marketingWhere = marketingConditions.length > 0 ? sql.join(marketingConditions, sql` AND `) : sql`TRUE`;

    // Use parameterized SQL for UNION query
    const unionQuery = sql`
      (
        SELECT 
          id::text,
          name,
          email,
          phone,
          company,
          message,
          source,
          status,
          notes,
          created_at,
          updated_at,
          'crm' as lead_type,
          NULL as business_name,
          NULL as first_name,
          NULL as last_name,
          NULL as campaign
        FROM leads
        WHERE ${crmWhere}
      )
      UNION ALL
      (
        SELECT 
          id::text,
          COALESCE(first_name || ' ' || last_name, business_name) as name,
          email,
          phone,
          NULL as company,
          NULL as message,
          source,
          status,
          NULL as notes,
          created_at,
          updated_at as updated_at,
          'marketing' as lead_type,
          business_name,
          first_name,
          last_name,
          campaign
        FROM marketing_leads
        WHERE ${marketingWhere}
      )
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Count total (without limit/offset)
    const countQuery = sql`
      SELECT COUNT(*) as count FROM (
        SELECT id FROM leads WHERE ${crmWhere}
        UNION ALL
        SELECT id FROM marketing_leads WHERE ${marketingWhere}
      ) as combined
    `;

    const [leadsResult, totalResult] = await Promise.all([
      db.execute(unionQuery),
      db.execute(countQuery)
    ]);

    return {
      leads: leadsResult.rows as any[],
      total: parseInt((totalResult.rows[0] as any).count)
    };
  }

  // Public API - CRM leads aggregate statistics
  async getCrmLeadsStats(tenantId: number): Promise<{ total: number, byStatus: Record<string, number> }> {
    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(leads)
      .where(eq(leads.tenantId, tenantId));

    // Get counts by status using GROUP BY
    const statusCounts = await db.select({
      status: leads.status,
      count: count()
    })
      .from(leads)
      .where(eq(leads.tenantId, tenantId))
      .groupBy(leads.status);

    // Convert to object
    const byStatus: Record<string, number> = {};
    statusCounts.forEach(row => {
      byStatus[row.status || 'unknown'] = row.count;
    });

    return {
      total: totalResult.count,
      byStatus
    };
  }

  // Public API - Marketing leads aggregate statistics
  async getMarketingLeadsStats(tenantId: number): Promise<{ total: number, byCampaign: Record<string, number>, bySource: Record<string, number> }> {
    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(marketingLeads)
      .where(eq(marketingLeads.tenantId, tenantId));

    // Get counts by campaign using GROUP BY
    const campaignCounts = await db.select({
      campaign: marketingLeads.campaign,
      count: count()
    })
      .from(marketingLeads)
      .where(eq(marketingLeads.tenantId, tenantId))
      .groupBy(marketingLeads.campaign);

    // Get counts by source using GROUP BY
    const sourceCounts = await db.select({
      source: marketingLeads.source,
      count: count()
    })
      .from(marketingLeads)
      .where(eq(marketingLeads.tenantId, tenantId))
      .groupBy(marketingLeads.source);

    // Convert to objects
    const byCampaign: Record<string, number> = {};
    campaignCounts.forEach(row => {
      byCampaign[row.campaign || 'unknown'] = row.count;
    });

    const bySource: Record<string, number> = {};
    sourceCounts.forEach(row => {
      bySource[row.source || 'unknown'] = row.count;
    });

    return {
      total: totalResult.count,
      byCampaign,
      bySource
    };
  }

  // Candidate operations
  async createCandidate(candidateData: InsertCandidate): Promise<Candidate> {
    const [candidate] = await db.insert(candidates).values(candidateData as any).returning();
    return candidate;
  }

  async getCandidates(tenantId: number, limit = 50, offset = 0, status?: string): Promise<{ candidates: Candidate[], total: number }> {
    const conditions = [];
    conditions.push(eq(candidates.tenantId, tenantId));
    if (status) conditions.push(eq(candidates.status, status));

    const [candidatesResult, totalResult] = await Promise.all([
      db.select().from(candidates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(candidates.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(candidates).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      candidates: candidatesResult,
      total: totalResult[0].count
    };
  }

  async getCandidateById(id: string, tenantId: number): Promise<Candidate | null> {
    const [candidate] = await db.select().from(candidates).where(and(eq(candidates.id, id), eq(candidates.tenantId, tenantId)));
    return candidate || null;
  }

  async updateCandidate(id: string, tenantId: number, updates: Partial<{
    status: string,
    reviewNotes: string,
    reviewedBy: string
  }>): Promise<Candidate | null> {
    const [candidate] = await db.update(candidates)
      .set({
        ...updates,
        reviewedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(candidates.id, id), eq(candidates.tenantId, tenantId)))
      .returning();
    return candidate || null;
  }

  // Media operations
  async createMedia(mediaData: InsertMedia & { uploadedBy: string }): Promise<Media> {
    const [mediaFile] = await db.insert(media).values(mediaData).returning();
    return mediaFile;
  }

  async getMedia(tenantId: number, limit = 50, offset = 0): Promise<{ media: Media[], total: number }> {
    const [mediaResult, totalResult] = await Promise.all([
      db.select().from(media)
        .where(eq(media.tenantId, tenantId))
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(media).where(eq(media.tenantId, tenantId))
    ]);

    return {
      media: mediaResult,
      total: totalResult[0].count
    };
  }

  async getMediaById(id: number, tenantId: number): Promise<Media | null> {
    const [mediaFile] = await db.select().from(media).where(and(eq(media.id, id), eq(media.tenantId, tenantId)));
    return mediaFile || null;
  }

  async deleteMedia(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(media).where(and(eq(media.id, id), eq(media.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics operations
  async trackEvent(event: string, data: any, tenantId: number, pageSlug?: string, postSlug?: string, request?: any): Promise<void> {
    await db.insert(analytics).values({
      tenantId,
      pageSlug,
      postSlug,
      event,
      data,
      userAgent: request?.headers?.['user-agent'],
      ip: request?.ip,
      referrer: request?.headers?.referer,
    });
  }

  async getAnalytics(tenantId: number, startDate: Date, endDate: Date): Promise<any> {
    const pageViews = await db.select({
      slug: analytics.pageSlug,
      count: count()
    })
    .from(analytics)
    .where(
      and(
        eq(analytics.tenantId, tenantId),
        eq(analytics.event, 'page_view'),
        sql`${analytics.createdAt} >= ${startDate}`,
        sql`${analytics.createdAt} <= ${endDate}`
      )
    )
    .groupBy(analytics.pageSlug);

    const totalViews = await db.select({ count: count() })
      .from(analytics)
      .where(
        and(
          eq(analytics.tenantId, tenantId),
          eq(analytics.event, 'page_view'),
          sql`${analytics.createdAt} >= ${startDate}`,
          sql`${analytics.createdAt} <= ${endDate}`
        )
      );

    return {
      pageViews,
      totalViews: totalViews[0].count,
    };
  }

  // Service operations
  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(serviceData as any).returning();
    return service;
  }

  async getServices(tenantId: number, category?: string, isPublic: boolean = false): Promise<Service[]> {
    try {
      const conditions = [eq(services.tenantId, tenantId)];
      
      if (category) {
        conditions.push(eq(services.category, category));
      }
      
      // Se è una chiamata pubblica, filtra solo i servizi attivi
      if (isPublic) {
        conditions.push(eq(services.isActive, true));
      }

      const result = await db.select()
        .from(services)
        .where(and(...conditions))
        .orderBy(asc(services.order));
      
      return result;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async getServiceBySlug(slug: string, tenantId: number): Promise<Service | null> {
    const [service] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.tenantId, tenantId)));
    return service || null;
  }

  async getServiceById(id: number, tenantId: number): Promise<Service | null> {
    const [service] = await db.select().from(services).where(and(eq(services.id, id), eq(services.tenantId, tenantId)));
    return service || null;
  }

  async updateService(id: number, tenantId: number, updates: Partial<InsertService>): Promise<Service | null> {
    const [service] = await db.update(services)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(and(eq(services.id, id), eq(services.tenantId, tenantId)))
      .returning();
    return service || null;
  }

  async deleteService(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(services).where(and(eq(services.id, id), eq(services.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Landing Page operations
  async createLandingPage(landingPageData: InsertLandingPage & { authorId: string }): Promise<LandingPage> {
    const [landingPage] = await db.insert(landingPages).values(landingPageData).returning();
    return landingPage;
  }

  async getLandingPages(tenantId: number, limit = 10, offset = 0, includeTemplates = false): Promise<{ landingPages: LandingPage[], total: number }> {
    const conditions = [];
    conditions.push(eq(landingPages.tenantId, tenantId));
    if (!includeTemplates) conditions.push(eq(landingPages.isTemplate, false));

    const [landingPagesResult, totalResult] = await Promise.all([
      db.select().from(landingPages)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(landingPages.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(landingPages).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      landingPages: landingPagesResult,
      total: totalResult[0].count
    };
  }

  async getLandingPageById(id: number, tenantId: number): Promise<LandingPage | null> {
    const [landingPage] = await db.select().from(landingPages).where(and(eq(landingPages.id, id), eq(landingPages.tenantId, tenantId)));
    return landingPage || null;
  }

  async getLandingPageBySlug(slug: string, tenantId: number): Promise<LandingPage | null> {
    const [landingPage] = await db.select().from(landingPages).where(and(eq(landingPages.slug, slug), eq(landingPages.tenantId, tenantId)));
    if (landingPage) {
      // Increment view count
      await db.update(landingPages)
        .set({ views: sql`${landingPages.views} + 1` })
        .where(and(eq(landingPages.id, landingPage.id), eq(landingPages.tenantId, tenantId)));
    }
    return landingPage || null;
  }

  async updateLandingPage(id: number, tenantId: number, updates: Partial<InsertLandingPage>): Promise<LandingPage | null> {
    try {
      // Remove undefined values to avoid database errors
      const updateData: any = { ...updates };
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const [landingPage] = await db.update(landingPages)
        .set(updateData)
        .where(and(eq(landingPages.id, id), eq(landingPages.tenantId, tenantId)))
        .returning();

      return landingPage || null;
    } catch (error) {
      console.error('Error updating landing page in storage:', error);
      throw error;
    }
  }

  async deleteLandingPage(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(landingPages).where(and(eq(landingPages.id, id), eq(landingPages.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async duplicateLandingPage(id: number, tenantId: number, newTitle: string, newSlug: string, authorId: string): Promise<LandingPage | null> {
    try {
      // Get the original landing page
      const originalLandingPage = await this.getLandingPageById(id, tenantId);
      if (!originalLandingPage) {
        return null;
      }

      // Create a new landing page with the same data but different title and slug
      const duplicateData: InsertLandingPage & { authorId: string } = {
        title: newTitle,
        slug: newSlug,
        description: `Copia di: ${originalLandingPage.title}`,
        sections: originalLandingPage.sections as any, // Type assertion for JSONB field
        metaTitle: originalLandingPage.metaTitle,
        metaDescription: originalLandingPage.metaDescription,
        ogImage: originalLandingPage.ogImage,
        isActive: false, // Start as inactive for editing
        isTemplate: false,
        templateName: null,
        authorId: authorId,
        parentLandingPageId: originalLandingPage.id // Track the original
      };

      const [duplicatedLandingPage] = await db.insert(landingPages).values(duplicateData).returning();
      return duplicatedLandingPage;
    } catch (error) {
      console.error('Error duplicating landing page:', error);
      throw error;
    }
  }

  async getLandingPageTemplates(tenantId: number): Promise<LandingPage[]> {
    return db.select().from(landingPages)
      .where(and(eq(landingPages.isTemplate, true), eq(landingPages.tenantId, tenantId)))
      .orderBy(asc(landingPages.templateName));
  }

  async toggleLandingPageStatus(id: number, tenantId: number): Promise<LandingPage | null> {
    const landingPage = await this.getLandingPageById(id, tenantId);
    if (!landingPage) return null;

    const [updated] = await db.update(landingPages)
      .set({ isActive: !landingPage.isActive })
      .where(and(eq(landingPages.id, id), eq(landingPages.tenantId, tenantId)))
      .returning();

    return updated || null;
  }

  // Track conversion for landing page
  async trackLandingPageConversion(id: number, tenantId: number): Promise<void> {
    await db.update(landingPages)
      .set({ conversions: sql`${landingPages.conversions} + 1` })
      .where(and(eq(landingPages.id, id), eq(landingPages.tenantId, tenantId)));
  }

  // Duplicate from Patrimonio template
  async duplicateFromPatrimonioTemplate(newTitle: string, newSlug: string, authorId: string, tenantId: number): Promise<LandingPage | null> {
    try {
      // Load the patrimonio template from JSON file
      const fs = await import('fs');
      const path = await import('path');

      const templatePath = path.join(process.cwd(), 'server', 'templates', 'patrimonio-template.json');

      if (!fs.existsSync(templatePath)) {
        throw new Error('Patrimonio template file not found');
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const template = JSON.parse(templateContent);

      // Create a new landing page based on the template
      const duplicateData: InsertLandingPage & { authorId: string } = {
        title: newTitle,
        slug: newSlug,
        description: `Landing page basata sul template Patrimonio`,
        sections: template.sections, // Use sections from JSON template
        metaTitle: newTitle.length <= 60 ? newTitle : newTitle.substring(0, 57) + '...',
        metaDescription: `Landing page personalizzata basata sul Metodo ORBITALE per ${newTitle}`,
        ogImage: null,
        isActive: false, // Start as inactive for editing
        isTemplate: false,
        templateName: null,
        authorId: authorId,
        tenantId: tenantId,
        parentLandingPageId: null // No parent since we're using JSON template
      };

      const [duplicatedLandingPage] = await db.insert(landingPages).values(duplicateData).returning();
      return duplicatedLandingPage;
    } catch (error) {
      console.error('Error duplicating from Patrimonio template:', error);
      throw error;
    }
  }

  // Builder Pages operations
  async createBuilderPage(pageData: InsertBuilderPage & { authorId: string }): Promise<BuilderPage> {
    const [page] = await db.insert(builderPages).values({
      ...pageData,
      updatedAt: new Date(),
    }).returning();
    return page;
  }

  async getBuilderPages(tenantId: number, limit = 10, offset = 0): Promise<{ pages: BuilderPage[], total: number }> {
    const [pagesResult, totalResult] = await Promise.all([
      db.select().from(builderPages)
        .where(eq(builderPages.tenantId, tenantId))
        .orderBy(desc(builderPages.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(builderPages).where(eq(builderPages.tenantId, tenantId))
    ]);

    return {
      pages: pagesResult,
      total: totalResult[0].count
    };
  }

  async getBuilderPageById(id: number, tenantId: number): Promise<BuilderPage | null> {
    const [page] = await db.select().from(builderPages).where(and(eq(builderPages.id, id), eq(builderPages.tenantId, tenantId)));
    return page || null;
  }

  async getBuilderPageBySlug(slug: string, tenantId: number): Promise<BuilderPage | null> {
    const [page] = await db.select().from(builderPages).where(and(eq(builderPages.slug, slug), eq(builderPages.tenantId, tenantId)));
    return page || null;
  }

  async updateBuilderPage(id: number, tenantId: number, updates: Partial<InsertBuilderPage>): Promise<BuilderPage | null> {
    const [page] = await db.update(builderPages)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(builderPages.id, id), eq(builderPages.tenantId, tenantId)))
      .returning();
    return page || null;
  }

  async deleteBuilderPage(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(builderPages).where(and(eq(builderPages.id, id), eq(builderPages.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async toggleBuilderPageStatus(id: number, tenantId: number): Promise<BuilderPage | null> {
    const page = await this.getBuilderPageById(id, tenantId);
    if (!page) return null;

    const [updated] = await db.update(builderPages)
      .set({ isActive: !page.isActive })
      .where(and(eq(builderPages.id, id), eq(builderPages.tenantId, tenantId)))
      .returning();

    return updated || null;
  }

  // Project operations
  async createProject(projectData: InsertProject & { authorId: string }): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData as any).returning();
    return project;
  }

  async getProjects(tenantId: number, limit = 10, offset = 0, status?: string, projectType?: string, isFeatured?: boolean): Promise<{ projects: Project[], total: number }> {
    const conditions = [];
    conditions.push(eq(projects.tenantId, tenantId));
    if (status) conditions.push(eq(projects.status, status));
    if (projectType) conditions.push(eq(projects.projectType, projectType));
    if (isFeatured !== undefined) conditions.push(eq(projects.isFeatured, isFeatured));
    if (conditions.length === 1) conditions.push(eq(projects.isActive, true));

    const [projectsResult, totalResult] = await Promise.all([
      db.select().from(projects)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(projects.order), desc(projects.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(projects).where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    return {
      projects: projectsResult,
      total: totalResult[0].count
    };
  }

  async getProjectBySlug(slug: string, tenantId: number): Promise<Project | null> {
    const [project] = await db.select().from(projects).where(and(eq(projects.slug, slug), eq(projects.tenantId, tenantId)));
    return project || null;
  }

  async getProjectById(id: number, tenantId: number): Promise<Project | null> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    return project || null;
  }

  async updateProject(id: number, tenantId: number, updates: Partial<InsertProject>): Promise<Project | null> {
    try {
      // Prepare update data
      const updateData: any = { ...updates, updatedAt: new Date() };

      // Handle date conversions
      if (updateData.startDate && typeof updateData.startDate === 'string') {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate && typeof updateData.endDate === 'string') {
        updateData.endDate = new Date(updateData.endDate);
      }

      // Remove undefined values to avoid database errors
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const [project] = await db.update(projects)
        .set(updateData)
        .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)))
        .returning();

      return project || null;
    } catch (error) {
      console.error('Error updating project in storage:', error);
      throw error;
    }
  }

  async deleteProject(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getFeaturedProjects(tenantId: number, limit = 6): Promise<Project[]> {
    return db.select().from(projects)
      .where(and(eq(projects.isFeatured, true), eq(projects.status, "published"), eq(projects.isActive, true), eq(projects.tenantId, tenantId)))
      .orderBy(asc(projects.order), desc(projects.createdAt))
      .limit(limit);
  }

  async getProjectsByCategory(category: string, tenantId: number, limit = 10): Promise<Project[]> {
    return db.select().from(projects)
      .where(and(eq(projects.category, category), eq(projects.status, "published"), eq(projects.isActive, true), eq(projects.tenantId, tenantId)))
      .orderBy(asc(projects.order), desc(projects.createdAt))
      .limit(limit);
  }

  async getProjectsByType(projectType: string, tenantId: number, limit = 10): Promise<Project[]> {
    return db.select().from(projects)
      .where(and(eq(projects.projectType, projectType), eq(projects.status, "published"), eq(projects.isActive, true), eq(projects.tenantId, tenantId)))
      .orderBy(asc(projects.order), desc(projects.createdAt))
      .limit(limit);
  }

  // Global SEO Settings operations
  async getGlobalSeoSettings(tenantId: number): Promise<GlobalSeoSettings | null> {
    const [settings] = await db.select().from(globalSeoSettings).where(eq(globalSeoSettings.tenantId, tenantId)).limit(1);
    return settings || null;
  }

  async upsertGlobalSeoSettings(settingsData: InsertGlobalSeoSettings & { updatedBy: string }, tenantId: number): Promise<GlobalSeoSettings> {
    const existingSettings = await this.getGlobalSeoSettings(tenantId);

    if (existingSettings) {
      // Update existing settings
      const updateData = { ...settingsData };
      delete (updateData as any).id; // Remove id from update data

      const [updated] = await db.update(globalSeoSettings)
        .set(updateData as any)
        .where(and(eq(globalSeoSettings.id, existingSettings.id), eq(globalSeoSettings.tenantId, tenantId)))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db.insert(globalSeoSettings)
        .values(settingsData as any)
        .returning();
      return created;
    }
  }

  async updateGlobalSeoSettings(updates: Partial<InsertGlobalSeoSettings> & { updatedBy: string }, tenantId: number): Promise<GlobalSeoSettings | null> {
    const existingSettings = await this.getGlobalSeoSettings(tenantId);

    if (!existingSettings) {
      // Create if doesn't exist
      return this.upsertGlobalSeoSettings(updates as InsertGlobalSeoSettings & { updatedBy: string }, tenantId);
    }

    const updateData = { ...updates };
    // Remove fields that shouldn't be updated manually
    delete (updateData as any).id;
    delete (updateData as any).updatedAt;

    // Set updatedAt to current time
    (updateData as any).updatedAt = new Date();

    const [updated] = await db.update(globalSeoSettings)
      .set(updateData as any)
      .where(and(eq(globalSeoSettings.id, existingSettings.id), eq(globalSeoSettings.tenantId, tenantId)))
      .returning();

    return updated || null;
  }

  // Settings operations (assuming 'settings' table exists and is imported)
  // NOTE: This section assumes a 'settings' table and related schema types are available.
  // If not, these methods would need to be implemented based on the actual schema.
  async getSetting(key: string, tenantId: number): Promise<any> {
    try {
      const result = await db.select().from(settings).where(and(eq(settings.key, key), eq(settings.tenantId, tenantId))).limit(1);
      if (result.length === 0) return null;

      try {
        return JSON.parse(result[0].value);
      } catch {
        return result[0].value;
      }
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  async updateSetting(key: string, value: any, tenantId: number): Promise<any> {
    try {
      // Check if setting exists
      const existingSetting = await this.getSetting(key, tenantId);

      if (existingSetting !== null) {
        // Update existing setting
        const [updated] = await db.update(settings)
          .set({
            value: JSON.stringify(value),
            updatedAt: new Date()
          })
          .where(and(eq(settings.key, key), eq(settings.tenantId, tenantId)))
          .returning();
        return updated;
      } else {
        // Create new setting
        const [created] = await db.insert(settings)
          .values({
            key,
            value: JSON.stringify(value),
            tenantId,
            updatedAt: new Date()
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Error in updateSetting:', error);
      throw new Error(`Failed to update setting ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllSettings(tenantId: number): Promise<any> {
    try {
      const allSettings = await db.select().from(settings).where(eq(settings.tenantId, tenantId));
      const settingsObj: any = {};

      allSettings.forEach(setting => {
        try {
          settingsObj[setting.key] = JSON.parse(setting.value || '');
        } catch {
          settingsObj[setting.key] = setting.value;
        }
      });

      return settingsObj;
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }

  // Route Analytics operations
  async createRouteAnalytics(routeData: InsertRouteAnalytics): Promise<RouteAnalytics> {
    const [route] = await db.insert(routeAnalytics).values(routeData).returning();
    return route;
  }

  async getAllRouteAnalytics(tenantId: number): Promise<RouteAnalytics[]> {
    return await db.select().from(routeAnalytics).where(eq(routeAnalytics.tenantId, tenantId)).orderBy(asc(routeAnalytics.route));
  }

  async getRouteAnalyticsByRoute(route: string, tenantId: number): Promise<RouteAnalytics | null> {
    const [result] = await db.select().from(routeAnalytics).where(and(eq(routeAnalytics.route, route), eq(routeAnalytics.tenantId, tenantId)));
    return result || null;
  }

  async getRouteAnalyticsById(id: number, tenantId: number): Promise<RouteAnalytics | null> {
    const [result] = await db.select().from(routeAnalytics).where(and(eq(routeAnalytics.id, id), eq(routeAnalytics.tenantId, tenantId)));
    return result || null;
  }

  async updateRouteAnalytics(id: number, tenantId: number, updates: Partial<InsertRouteAnalytics>): Promise<RouteAnalytics | null> {
    const [route] = await db.update(routeAnalytics)
      .set(updates as any)
      .where(and(eq(routeAnalytics.id, id), eq(routeAnalytics.tenantId, tenantId)))
      .returning();
    return route || null;
  }

  async deleteRouteAnalytics(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(routeAnalytics).where(and(eq(routeAnalytics.id, id), eq(routeAnalytics.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Superadmin methods to get all content across tenants
  async getAllPagesForSuperadmin() {
    return await db.select({
      id: pages.id,
      title: pages.title,
      slug: pages.slug,
      status: pages.status,
      createdAt: pages.createdAt,
      updatedAt: pages.updatedAt,
      tenantId: pages.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(pages)
    .leftJoin(tenants, eq(pages.tenantId, tenants.id))
    .orderBy(desc(pages.createdAt));
  }

  async getAllBlogPostsForSuperadmin() {
    return await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      tenantId: blogPosts.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(blogPosts)
    .leftJoin(tenants, eq(blogPosts.tenantId, tenants.id))
    .orderBy(desc(blogPosts.createdAt));
  }

  async getAllServicesForSuperadmin() {
    return await db.select({
      id: services.id,
      title: services.title,
      slug: services.slug,
      isActive: services.isActive,
      createdAt: services.createdAt,
      tenantId: services.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(services)
    .leftJoin(tenants, eq(services.tenantId, tenants.id))
    .orderBy(desc(services.createdAt));
  }

  async getAllLandingPagesForSuperadmin() {
    return await db.select({
      id: landingPages.id,
      title: landingPages.title,
      slug: landingPages.slug,
      isActive: landingPages.isActive,
      createdAt: landingPages.createdAt,
      tenantId: landingPages.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(landingPages)
    .leftJoin(tenants, eq(landingPages.tenantId, tenants.id))
    .orderBy(desc(landingPages.createdAt));
  }

  async getAllBuilderPagesForSuperadmin() {
    return await db.select({
      id: builderPages.id,
      title: builderPages.title,
      slug: builderPages.slug,
      isPublished: builderPages.isPublished,
      createdAt: builderPages.createdAt,
      tenantId: builderPages.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(builderPages)
    .leftJoin(tenants, eq(builderPages.tenantId, tenants.id))
    .orderBy(desc(builderPages.createdAt));
  }

  async getAllProjectsForSuperadmin() {
    return await db.select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      isActive: projects.isActive,
      createdAt: projects.createdAt,
      tenantId: projects.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(projects)
    .leftJoin(tenants, eq(projects.tenantId, tenants.id))
    .orderBy(desc(projects.createdAt));
  }

  async getAllLeadsForSuperadmin() {
    return await db.select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      company: leads.company,
      status: leads.status,
      source: leads.source,
      createdAt: leads.createdAt,
      tenantId: leads.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(leads)
    .leftJoin(tenants, eq(leads.tenantId, tenants.id))
    .orderBy(desc(leads.createdAt));
  }

  async getAllCandidatesForSuperadmin() {
    return await db.select({
      id: candidates.id,
      name: candidates.name,
      email: candidates.email,
      company: candidates.company,
      status: candidates.status,
      createdAt: candidates.createdAt,
      tenantId: candidates.tenantId,
      tenantName: tenants.name,
      tenantDomain: tenants.domain
    })
    .from(candidates)
    .leftJoin(tenants, eq(candidates.tenantId, tenants.id))
    .orderBy(desc(candidates.createdAt));
  }
// Google Sheets Configuration Methods
  async getGoogleSheetsConfigs(): Promise<GoogleSheetsCampaign[]> {
    return await db.select().from(googleSheetsCampaigns).orderBy(asc(googleSheetsCampaigns.id));
  }

  async getActiveGoogleSheetsConfigs(): Promise<GoogleSheetsCampaign[]> {
    return await db.select().from(googleSheetsCampaigns)
      .where(and(eq(googleSheetsCampaigns.isActive, true), eq(googleSheetsCampaigns.archived, false)))
      .orderBy(asc(googleSheetsCampaigns.id));
  }

  async getGoogleSheetsConfig(id: number): Promise<GoogleSheetsCampaign | null> {
    const [config] = await db.select().from(googleSheetsCampaigns)
      .where(eq(googleSheetsCampaigns.id, id));
    return config || null;
  }

  async createGoogleSheetsConfig(configData: InsertGoogleSheetsCampaign): Promise<GoogleSheetsCampaign> {
    const [config] = await db.insert(googleSheetsCampaigns).values(configData).returning();
    return config;
  }

  async updateGoogleSheetsConfig(id: number, updates: Partial<InsertGoogleSheetsCampaign>): Promise<GoogleSheetsCampaign | null> {
    const [config] = await db.update(googleSheetsCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(googleSheetsCampaigns.id, id))
      .returning();
    return config || null;
  }

  async deleteGoogleSheetsConfig(id: number): Promise<boolean> {
    const result = await db.delete(googleSheetsCampaigns)
      .where(eq(googleSheetsCampaigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async archiveGoogleSheetsConfig(id: number): Promise<GoogleSheetsCampaign | null> {
    const [config] = await db.update(googleSheetsCampaigns)
      .set({ archived: true, isActive: false, updatedAt: new Date() })
      .where(eq(googleSheetsCampaigns.id, id))
      .returning();
    return config || null;
  }

  async dearchiveGoogleSheetsConfig(id: number): Promise<GoogleSheetsCampaign | null> {
    const [config] = await db.update(googleSheetsCampaigns)
      .set({ archived: false, isActive: true, updatedAt: new Date() })
      .where(eq(googleSheetsCampaigns.id, id))
      .returning();
    return config || null;
  }

  async checkCampaignHasLeads(campaign: string): Promise<boolean> {
    const [result] = await db.select({ count: count() })
      .from(marketingLeads)
      .where(eq(marketingLeads.campaign, campaign));
    return (result?.count ?? 0) > 0;
  }

  // Client Methods
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(asc(clients.id));
  }

  async getClientsByOwner(ownerId: string): Promise<Client[]> {
    return await db.select().from(clients)
      .where(eq(clients.ownerId, ownerId))
      .orderBy(asc(clients.id));
  }

  async getClient(id: number): Promise<Client | null> {
    const [client] = await db.select().from(clients)
      .where(eq(clients.id, id));
    return client || null;
  }

  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients)
      .where(eq(clients.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteClientByOwner(id: number, ownerId: string): Promise<boolean> {
    const result = await db.delete(clients)
      .where(and(eq(clients.id, id), eq(clients.ownerId, ownerId)));
    return (result.rowCount ?? 0) > 0;
  }

  // API Key Methods
  async createApiKey(apiKeyData: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db.insert(apiKeys).values(apiKeyData).returning();
    return apiKey;
  }

  async getApiKeys(tenantId: number): Promise<ApiKey[]> {
    const { maskApiKey } = await import('./utils/apiKey');
    const keys = await db.select().from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));
    
    return keys.map(apiKey => ({
      ...apiKey,
      key: maskApiKey(apiKey.key)
    }));
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | null> {
    const [apiKey] = await db.select().from(apiKeys)
      .where(eq(apiKeys.key, key));
    return apiKey || null;
  }

  async getApiKeyById(id: number, tenantId: number): Promise<ApiKey | null> {
    const [apiKey] = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)));
    return apiKey || null;
  }

  async updateApiKey(id: number, tenantId: number, updates: Partial<InsertApiKey>): Promise<ApiKey | null> {
    const [apiKey] = await db.update(apiKeys)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)))
      .returning();
    return apiKey || null;
  }

  async revokeApiKey(id: number, tenantId: number): Promise<ApiKey | null> {
    const [apiKey] = await db.update(apiKeys)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)))
      .returning();
    return apiKey || null;
  }

  async deleteApiKey(id: number, tenantId: number): Promise<boolean> {
    const result = await db.delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async getBrandVoice(tenantId: number): Promise<BrandVoice | null> {
    const [result] = await db.select().from(brandVoice).where(eq(brandVoice.tenantId, tenantId));
    return result || null;
  }

  async upsertBrandVoice(tenantId: number, data: Partial<{
    businessInfo: any;
    authority: any;
    servicesInfo: any;
    credentials: any;
    voiceStyle: any;
  }>): Promise<BrandVoice> {
    const existing = await this.getBrandVoice(tenantId);
    if (existing) {
      const [updated] = await db.update(brandVoice)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(brandVoice.tenantId, tenantId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(brandVoice)
        .values({ tenantId, ...data })
        .returning();
      return created;
    }
  }
}

export const storage = new Storage();
