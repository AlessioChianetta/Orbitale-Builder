import { db } from "./db";
import { tenants, users, type InsertTenant, type InsertUser } from "@shared/schema";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedTenants() {
  console.log("🌱 Starting tenant seeding...");

  try {
    const existingTenants = await db.select().from(tenants);
    console.log(`📊 Found ${existingTenants.length} existing tenant(s)`);

    const tenantsToCreate: InsertTenant[] = [
      {
        name: "Alessio's Website",
        domain: "alessio.it",
        isActive: true
      },
      {
        name: "Fabio's Website", 
        domain: "fabio.it",
        isActive: true
      },
      {
        name: "Marco's Website",
        domain: "marco.it",
        isActive: true
      }
    ];

    for (const tenantData of tenantsToCreate) {
      const existing = existingTenants.find(t => t.domain === tenantData.domain);
      
      if (existing) {
        console.log(`⏭️  Tenant "${tenantData.name}" (${tenantData.domain}) already exists, skipping...`);
        continue;
      }

      const tenant = await storage.createTenant(tenantData);
      console.log(`✅ Created tenant: ${tenant.name} (${tenant.domain}) with ID ${tenant.id}`);

      const adminUsername = tenantData.domain.split('.')[0] + '_admin';
      const adminEmail = `admin@${tenantData.domain}`;
      
      const existingAdmin = await db.select().from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (existingAdmin.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = await db.insert(users).values({
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          tenantId: tenant.id
        }).returning();

        console.log(`👤 Created admin user: ${adminUser[0].username} (${adminUser[0].email}) for tenant ${tenant.name}`);
      } else {
        console.log(`👤 Admin user for ${tenantData.domain} already exists, skipping...`);
      }
    }

    console.log("\n📋 Current tenants in database:");
    const allTenants = await db.select().from(tenants);
    allTenants.forEach(t => {
      console.log(`  - ${t.name} (${t.domain}) - ID: ${t.id} - Active: ${t.isActive}`);
    });

    console.log("\n👥 Current admin users:");
    const allAdmins = await db.select().from(users).where(eq(users.role, 'admin'));
    for (const admin of allAdmins) {
      const tenant = allTenants.find(t => t.id === admin.tenantId);
      console.log(`  - ${admin.username} (${admin.email}) - Tenant: ${tenant?.name || 'Unknown'} (ID: ${admin.tenantId})`);
    }

    console.log("\n✅ Tenant seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding tenants:", error);
    process.exit(1);
  }
}

seedTenants();
