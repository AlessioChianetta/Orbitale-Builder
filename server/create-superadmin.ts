
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createSuperAdmin() {
  const username = "superadmin";
  const email = "superadmin@example.com";
  const password = "superadmin123";
  const role = "superadmin";
  const tenantId = 1; // Default tenant

  console.log("🔐 Creating superadmin user...");

  // Check if superadmin already exists
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (existing.length > 0) {
    console.log("⚠️  Superadmin user already exists!");
    console.log("Username:", existing[0].username);
    console.log("Email:", existing[0].email);
    console.log("Role:", existing[0].role);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create superadmin
  const [superadmin] = await db.insert(users).values({
    username,
    email,
    password: hashedPassword,
    role,
    tenantId
  }).returning();

  console.log("✅ Superadmin created successfully!");
  console.log("📧 Username:", superadmin.username);
  console.log("📧 Email:", superadmin.email);
  console.log("🔑 Password:", password);
  console.log("👤 Role:", superadmin.role);
  console.log("\n🌐 Access at: /superadmin");
  console.log("🔐 Login with:");
  console.log("   Username:", username);
  console.log("   Password:", password);
}

createSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error creating superadmin:", error);
    process.exit(1);
  });
