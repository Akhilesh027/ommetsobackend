import bcrypt from "bcryptjs";
import { AdminUser } from "../../modules/admin/models/AdminUser";

const INITIAL_ADMINS = [
  {
    name: "System Admin",
    email: "admin@gmail.com",
    role: "Super Admin",
    passwordRaw: "22446688",
    permissions: ["*"]
  },
  {
    name: "Rajesh Sharma",
    email: "rajesh.sharma@omeetso.com",
    role: "Super Admin",
    passwordRaw: "SuperAdmin@123!",
    permissions: ["*"]
  },
  {
    name: "Meera Nair",
    email: "meera.nair@omeetso.com",
    role: "Platform Admin",
    passwordRaw: "PlatformAdmin@123",
    permissions: ["dashboard.view", "users.view", "users.edit", "listings.view", "listings.approve", "stores.view", "stores.approve"]
  },
  {
    name: "Priya Patel",
    email: "priya.patel@omeetso.com",
    role: "Listing Moderator",
    passwordRaw: "ListingMod@123",
    permissions: ["dashboard.view", "listings.view", "listings.approve", "listings.reject", "listings.request_changes"]
  },
  {
    name: "Arjun Kumar",
    email: "arjun.kumar@omeetso.com",
    role: "Store Moderator",
    passwordRaw: "StoreMod@123",
    permissions: ["dashboard.view", "stores.view", "stores.approve", "stores.reject", "stores.verify"]
  },
  {
    name: "Kavya Rao",
    email: "kavya.rao@omeetso.com",
    role: "Advertisement Manager",
    passwordRaw: "AdManager@123",
    permissions: ["dashboard.view", "ads.view", "ads.approve", "ads.reject", "promotions.view", "promotions.manage"]
  },
  {
    name: "Vikram Reddy",
    email: "vikram.reddy@omeetso.com",
    role: "Finance Manager",
    passwordRaw: "Finance@123",
    permissions: ["dashboard.view", "wallet.view", "wallet.adjust", "payments.view", "refunds.view", "refunds.approve"]
  },
  {
    name: "Sneha Iyer",
    email: "sneha.iyer@omeetso.com",
    role: "Support Agent",
    passwordRaw: "Support@123",
    permissions: ["dashboard.view", "support.view", "support.reply", "support.assign", "support.close"]
  },
  {
    name: "Ananya Rao",
    email: "ananya.rao@omeetso.com",
    role: "Safety and Fraud Officer",
    passwordRaw: "Safety@123",
    permissions: ["dashboard.view", "safety.view", "safety.investigate", "safety.restrict", "safety.suspend", "users.suspend"]
  },
  {
    name: "Rahul Gupta",
    email: "rahul.gupta@omeetso.com",
    role: "Analytics Viewer",
    passwordRaw: "Analytics@123",
    permissions: ["dashboard.view", "analytics.view", "analytics.export"]
  }
];

export async function seedAdminUsers(): Promise<void> {
  try {
    console.log("[Seeder] Verifying initial admin accounts in MongoDB...");
    for (const item of INITIAL_ADMINS) {
      const email = item.email.toLowerCase();
      const passwordHash = await bcrypt.hash(item.passwordRaw, 10);
      
      const existing = await AdminUser.findOne({ email });
      if (!existing) {
        await AdminUser.create({
          name: item.name,
          email,
          passwordHash,
          role: item.role,
          permissions: item.permissions,
          status: "active",
          twoFAEnabled: false
        });
        console.log(`[Seeder] Seeded admin account: ${email}`);
      } else {
        await AdminUser.updateOne(
          { email },
          {
            $set: {
              passwordHash,
              role: item.role,
              permissions: item.permissions,
              status: "active"
            }
          }
        );
        console.log(`[Seeder] Updated password/permissions for admin: ${email}`);
      }
    }
  } catch (error) {
    console.error("[Seeder] Failed to seed admin users:", error);
  }
}
