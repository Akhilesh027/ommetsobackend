"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminUsers = seedAdminUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AdminUser_1 = require("../../modules/admin/models/AdminUser");
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
async function seedAdminUsers() {
    try {
        console.log("[Seeder] Verifying initial admin accounts in MongoDB...");
        for (const item of INITIAL_ADMINS) {
            const email = item.email.toLowerCase();
            const existing = await AdminUser_1.AdminUser.findOne({ email });
            if (!existing) {
                const passwordHash = await bcryptjs_1.default.hash(item.passwordRaw, 10);
                await AdminUser_1.AdminUser.create({
                    name: item.name,
                    email,
                    passwordHash,
                    role: item.role,
                    permissions: item.permissions,
                    status: "active",
                    twoFAEnabled: false
                });
                console.log(`[Seeder] Seeded admin account: ${email}`);
            }
        }
    }
    catch (error) {
        console.error("[Seeder] Failed to seed admin users:", error);
    }
}
