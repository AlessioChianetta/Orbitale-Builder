import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  json,
  serial,
  jsonb,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table - for multi-domain/multi-tenant support
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  domain: varchar("domain", { length: 255 }).unique().notNull(), // alessio.it, fabio.it
  name: varchar("name", { length: 255 }).notNull(),
  logo: varchar("logo", { length: 500 }),
  settings: jsonb("settings").$type<{
    primaryColor?: string;
    secondaryColor?: string;
    customCss?: string;
    [key: string]: any;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"), // admin, editor
  googleSheetsApiKey: text("google_sheets_api_key"), // API Key personale per Google Sheets
  telegramBotToken: text("telegram_bot_token"), // Token del bot Telegram per notifiche
  telegramChatId: text("telegram_chat_id"), // Chat ID Telegram per ricevere notifiche
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pages table
export const pages = pgTable("pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: json("content"), // Rich content structure
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  featuredImage: text("featured_image"),
  status: text("status").notNull().default("draft"), // draft, published, scheduled
  publishedAt: timestamp("published_at"),
  authorId: varchar("author_id").references(() => users.id),
  isHomepageCustom: boolean("is_homepage_custom").default(false),
  facebookPixelEvents: jsonb("facebook_pixel_events").$type<{eventName: string; eventData?: any}[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),

  // SEO Meta Tags
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),

  status: varchar("status", { length: 20 }).default("draft"), // draft, published, scheduled, archived
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  isFeatured: boolean("is_featured").default(false),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  authorId: varchar("author_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  views: integer("views").default(0),
  readingTime: integer("reading_time"), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leads table
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  source: text("source"), // contact-form, landing-page, etc.
  status: text("status").notNull().default("new"), // new, contacted, qualified, converted
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Candidates table (for lead generation program)
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  website: text("website"),
  industry: text("industry"),
  monthlyRevenue: text("monthly_revenue"),
  currentMarketing: json("current_marketing").$type<string[]>().default([]),
  goals: text("goals"),
  budget: text("budget"),
  timeline: text("timeline"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, contacted
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Media table for file uploads
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  size: integer("size").notNull(), // in bytes
  url: varchar("url", { length: 500 }).notNull(),
  alt: text("alt").default(""),
  uploadedBy: varchar("uploaded_by", { length: 50 }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Analytics table for tracking
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  pageSlug: varchar("page_slug", { length: 100 }),
  postSlug: varchar("post_slug", { length: 100 }),
  event: varchar("event", { length: 50 }).notNull(), // page_view, form_submit, etc.
  data: jsonb("data"), // Additional event data
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 45 }),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings table for CMS configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  key: varchar("key", { length: 100 }).notNull(),
  value: text("value"),
  type: varchar("type", { length: 20 }).default("string"), // string, number, boolean, json
  description: text("description"),
  updatedBy: varchar("updated_by", { length: 50 }).references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantKeyUnique: unique("settings_tenant_key_unique").on(table.tenantId, table.key),
}));

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // welcome, lead_notification, candidate_approval, etc.
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 50 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories for blog posts
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#000000"), // hex color
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tags for blog posts
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Many-to-many relationship for blog posts and tags
export const blogPostTags = pgTable("blog_post_tags", {
  blogPostId: integer("blog_post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.blogPostId, table.tagId] }),
}));

// Marketing Leads table - for Google Sheets integration
export const marketingLeads = pgTable("marketing_leads", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  businessName: varchar("business_name", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }).default("google-sheets"),
  campaign: varchar("campaign", { length: 100 }).notNull(),
  additionalData: jsonb("additional_data").$type<Record<string, any>>(),
  status: varchar("status", { length: 50 }).default("new"),
  emailSent: boolean("email_sent").default(false),
  whatsappSent: boolean("whatsapp_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description").notNull(),
  shortDescription: varchar("short_description", { length: 500 }),
  price: varchar("price", { length: 100 }),
  priceDescription: varchar("price_description", { length: 100 }),
  icon: varchar("icon", { length: 100 }), // Lucide icon name
  features: jsonb("features").$type<string[]>().default([]),
  benefits: jsonb("benefits").$type<string[]>().default([]),
  isPopular: boolean("is_popular").default(false),
  isFeatured: boolean("is_featured").default(false),
  category: varchar("category", { length: 100 }).default("main"), // main, additional
  landingPageSlug: varchar("landing_page_slug", { length: 255 }), // Custom landing page slug
  ctaText: varchar("cta_text", { length: 100 }).default("Scopri di più"),
  order: integer("order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// SEO data table
export const seoData = pgTable("seo_data", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  entityType: varchar("entity_type", { length: 20 }).notNull(), // page, blog_post
  entityId: integer("entity_id").notNull(),
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  canonicalUrl: varchar("canonical_url", { length: 255 }),
  ogTitle: varchar("og_title", { length: 60 }),
  ogDescription: varchar("og_description", { length: 160 }),
  ogImage: varchar("og_image", { length: 255 }),
  twitterCard: varchar("twitter_card", { length: 20 }).default("summary"),
  schemaMarkup: jsonb("schema_markup"),
  robots: varchar("robots", { length: 100 }).default("index,follow"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Navigation menus
export const navigationMenus = pgTable("navigation_menus", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 50 }).notNull(), // header, footer, sidebar
  items: jsonb("items").notNull(), // array of menu items
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Landing pages table - dedicated table for landing pages with modular structure
export const landingPages = pgTable("landing_pages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"), // Brief description for admin

  // Modular sections - JSON structure based on PatrimonioPage components
  sections: jsonb("sections").notNull().default('[]'), // Array of section objects

  // SEO and meta
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  ogImage: varchar("og_image", { length: 255 }),

  // Settings
  isActive: boolean("is_active").default(true),
  isTemplate: boolean("is_template").default(false), // Can be used as template for duplication
  templateName: varchar("template_name", { length: 100 }), // Name when used as template

  // Tracking
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),

  // Metadata
  authorId: varchar("author_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  parentLandingPageId: integer("parent_landing_page_id"), // Self-reference, will add constraint later
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Builder pages table - for drag & drop page builder
export const builderPages = pgTable("builder_pages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),

  // Drag & Drop components structure
  components: jsonb("components").notNull().default('[]'), // Array of component objects with type, props, and position

  // SEO and meta
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),
  ogImage: text("og_image"),

  // Settings
  isActive: boolean("is_active").default(true),

  // Tracking
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),

  // Metadata
  authorId: varchar("author_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description").notNull(),
  shortDescription: varchar("short_description", { length: 500 }),
  fullDescription: text("full_description"), // Rich text HTML content
  challenge: text("challenge"), // Project challenge/problem
  solution: text("solution"), // Solution implemented
  clientName: varchar("client_name", { length: 255 }),
  projectType: varchar("project_type", { length: 100 }).default("project"), // project, partnership
  category: varchar("category", { length: 100 }).default("development"), // development, marketing, consulting
  featuredImage: text("featured_image"),
  images: jsonb("images").$type<string[]>().default([]),
  technologies: jsonb("technologies").$type<string[]>().default([]),
  results: jsonb("results").$type<{metric: string, value: string, description?: string}[]>().default([]),
  testimonial: jsonb("testimonial").$type<{text: string, author: string, role: string, company?: string}>(),
  projectUrl: text("project_url"),
  caseStudyUrl: text("case_study_url"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  completionDate: timestamp("completion_date"), // Alias for endDate for display
  duration: varchar("duration", { length: 100 }), // "3 mesi", "6 settimane", etc.

  // SEO Meta Tags
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: varchar("meta_description", { length: 160 }),

  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  status: varchar("status", { length: 20 }).default("published"), // draft, published
  authorId: varchar("author_id", { length: 50 }).references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Global SEO Settings table
export const globalSeoSettings = pgTable("global_seo_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  // Site Info
  siteName: varchar("site_name", { length: 100 }),
  siteDescription: text("site_description"),
  siteUrl: varchar("site_url", { length: 255 }),

  // Default Meta Tags
  defaultMetaTitle: varchar("default_meta_title", { length: 60 }),
  defaultMetaDescription: varchar("default_meta_description", { length: 160 }),
  defaultOgImage: varchar("default_og_image", { length: 255 }),

  // Social Media
  twitterHandle: varchar("twitter_handle", { length: 50 }),
  facebookAppId: varchar("facebook_app_id", { length: 50 }),

  // Analytics & Tracking
  googleAnalyticsId: varchar("google_analytics_id", { length: 50 }),
  googleTagManagerId: varchar("google_tag_manager_id", { length: 50 }),
  facebookPixelId: varchar("facebook_pixel_id", { length: 50 }),
  googleSearchConsoleCode: text("google_search_console_code"),
  bingWebmasterCode: varchar("bing_webmaster_code", { length: 100 }),

  // Technical SEO
  robotsTxtCustom: text("robots_txt_custom"),
  canonicalDomain: varchar("canonical_domain", { length: 255 }),
  hreflangEnabled: boolean("hreflang_enabled").default(false),

  // Schema Markup Defaults
  organizationName: varchar("organization_name", { length: 100 }),
  organizationLogo: varchar("organization_logo", { length: 255 }),
  organizationType: varchar("organization_type", { length: 50 }).default("Organization"), // Organization, LocalBusiness, etc.
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 100 }),
  address: jsonb("address").$type<{
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  }>(),

  // Advanced Settings
  noindexPages: jsonb("noindex_pages").$type<string[]>().default([]), // Array of slugs to noindex
  customHeadCode: text("custom_head_code"), // Custom HTML for <head>
  
  // Favicon URLs for different sizes
  faviconUrl: varchar("favicon_url", { length: 255 }), // Standard favicon.ico or 32x32 PNG
  favicon16Url: varchar("favicon_16_url", { length: 255 }), // 16x16 PNG
  favicon32Url: varchar("favicon_32_url", { length: 255 }), // 32x32 PNG
  favicon96Url: varchar("favicon_96_url", { length: 255 }), // 96x96 PNG
  appleTouchIconUrl: varchar("apple_touch_icon_url", { length: 255 }), // 180x180 for iOS
  androidChrome192Url: varchar("android_chrome_192_url", { length: 255 }), // 192x192 for Android
  androidChrome512Url: varchar("android_chrome_512_url", { length: 255 }), // 512x512 for PWA

  // Personal Branding (Schema.org Person)
  enablePersonalBranding: boolean("enable_personal_branding").default(false),
  personName: varchar("person_name", { length: 100 }),
  personImage: varchar("person_image", { length: 255 }),
  personBio: text("person_bio"),
  personJobTitle: varchar("person_job_title", { length: 100 }),
  personEmail: varchar("person_email", { length: 100 }),
  personPhone: varchar("person_phone", { length: 50 }),
  personWebsite: varchar("person_website", { length: 255 }),
  personLinkedIn: varchar("person_linkedin", { length: 255 }),
  personTwitter: varchar("person_twitter", { length: 255 }),
  personFacebook: varchar("person_facebook", { length: 255 }),
  personInstagram: varchar("person_instagram", { length: 255 }),
  personSkills: jsonb("person_skills").$type<string[]>().default([]),
  personYearsExperience: integer("person_years_experience"),
  personSameAs: jsonb("person_same_as").$type<string[]>().default([]), // Array of social profile URLs for Knowledge Graph

  // Metadata
  updatedBy: varchar("updated_by", { length: 50 }).references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Route Analytics table
export const routeAnalytics = pgTable("route_analytics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  route: varchar("route", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  avgTimeOnPage: integer("avg_time_on_page").default(0),
  bounceRate: integer("bounce_rate").default(0),
  isActive: boolean("is_active").default(true),
  facebookPixelEvents: jsonb("facebook_pixel_events").$type<Array<{
    eventName: string;
    eventData?: any;
    isActive: boolean;
  }>>().default([]),
  customEvents: jsonb("custom_events").$type<Array<{
    name: string;
    description: string;
    triggerCondition: string;
    isActive: boolean;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clients table - for managing campaign clients/owners
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Sheets Campaigns table - for managing Google Sheets sync configurations
export const googleSheetsCampaigns = pgTable("google_sheets_campaigns", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  campaignName: varchar("campaign_name", { length: 255 }).notNull(),
  sheetId: varchar("sheet_id", { length: 255 }).notNull(),
  sheetRange: varchar("sheet_range", { length: 100 }),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  syncFrequency: varchar("sync_frequency", { length: 50 }),
  mappingConfig: jsonb("mapping_config").$type<Record<string, any>>(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  ownerId: varchar("owner_id").references(() => users.id, { onDelete: "set null" }),
  archived: boolean("archived").default(false),
  emailTemplate: varchar("email_template", { length: 255 }),
  maxLeadsPerSync: integer("max_leads_per_sync"),
  syncIntervalMinutes: integer("sync_interval_minutes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Sheets Sync Log table - for tracking sync operations
export const googleSheetsSyncLog = pgTable("google_sheets_sync_log", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => googleSheetsCampaigns.id, { onDelete: "cascade" }),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  syncStatus: varchar("sync_status", { length: 50 }),
  leadsImported: integer("leads_imported"),
  leadsFailed: integer("leads_failed"),
  errorMessage: text("error_message"),
  syncStartedAt: timestamp("sync_started_at").defaultNow().notNull(),
  syncCompletedAt: timestamp("sync_completed_at"),
});

// API Keys table - for authenticating public API requests
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  key: varchar("key", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  scopes: jsonb("scopes").$type<string[]>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  tenantId: true,
});
// ... (dopo gli schemi Zod)

export const insertPageSchema = createInsertSchema(pages).pick({
  title: true,
  slug: true,
  content: true,
  metaTitle: true,
  metaDescription: true,
  featuredImage: true,
  status: true,
  publishedAt: true,
  isHomepageCustom: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  featuredImage: true,
  metaTitle: true,
  metaDescription: true,
  categoryId: true,
  status: true,
  isFeatured: true,
  readingTime: true,
}).extend({
  publishedAt: z.union([z.date(), z.string()]).optional().nullable(),
  scheduledAt: z.union([z.date(), z.string()]).optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featuredImage: z.string().optional(), // Override to remove length limit
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  company: true,
  message: true,
  source: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  status: true,
  reviewNotes: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaSchema = createInsertSchema(media);
export const insertAnalyticsSchema = createInsertSchema(analytics);
export const insertSettingsSchema = createInsertSchema(settings);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);
export const insertCategorySchema = createInsertSchema(categories);
export const insertTagSchema = createInsertSchema(tags);
export const insertSeoDataSchema = createInsertSchema(seoData);
export const insertNavigationMenuSchema = createInsertSchema(navigationMenus);
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Ensure optional fields are properly typed
  shortDescription: z.string().optional().nullable(),
  price: z.string().optional().nullable(),
  priceDescription: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  features: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  landingPageSlug: z.string().optional().nullable(),
  ctaText: z.string().optional().default("Scopri di più"),
  order: z.number().optional().default(0),
});

export const insertLandingPageSchema = createInsertSchema(landingPages).omit({
  id: true,
  views: true,
  conversions: true,
  authorId: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBuilderPageSchema = createInsertSchema(builderPages).omit({
  id: true,
  views: true,
  conversions: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  tenantId: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  authorId: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalSeoSettingsSchema = createInsertSchema(globalSeoSettings).omit({
  id: true,
  tenantId: true,
  updatedBy: true,
  updatedAt: true,
});

export const insertRouteAnalyticsSchema = createInsertSchema(routeAnalytics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketingLeadSchema = createInsertSchema(marketingLeads).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleSheetsCampaignSchema = createInsertSchema(googleSheetsCampaigns).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleSheetsSyncLogSchema = createInsertSchema(googleSheetsSyncLog).omit({
  id: true,
  tenantId: true,
  syncStartedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostWithRelations = BlogPost & {
  author: { username: string } | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
};
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
export type Media = typeof media.$inferSelect;
export type Analytics = typeof analytics.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type SeoData = typeof seoData.$inferSelect;
export type NavigationMenu = typeof navigationMenus.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertLandingPage = z.infer<typeof insertLandingPageSchema>;
export type LandingPage = typeof landingPages.$inferSelect;
export type InsertBuilderPage = z.infer<typeof insertBuilderPageSchema>;
export type BuilderPage = typeof builderPages.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertGlobalSeoSettings = z.infer<typeof insertGlobalSeoSettingsSchema>;
export type GlobalSeoSettings = typeof globalSeoSettings.$inferSelect;
export type InsertRouteAnalytics = z.infer<typeof insertRouteAnalyticsSchema>;
export type RouteAnalytics = typeof routeAnalytics.$inferSelect;
export type InsertMarketingLead = z.infer<typeof insertMarketingLeadSchema>;
export type MarketingLead = typeof marketingLeads.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertGoogleSheetsCampaign = z.infer<typeof insertGoogleSheetsCampaignSchema>;
export type GoogleSheetsCampaign = typeof googleSheetsCampaigns.$inferSelect;
export type InsertGoogleSheetsSyncLog = z.infer<typeof insertGoogleSheetsSyncLogSchema>;
export type GoogleSheetsSyncLog = typeof googleSheetsSyncLog.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;