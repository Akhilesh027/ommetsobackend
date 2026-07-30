import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../connect";
import { Category } from "../../modules/categories/models/Category";
import { SEED_CATEGORIES } from "./categorySeeder";
import { seedAdminUsers } from "./adminSeeder";

export async function purgeDatabaseAndSeedCategoriesOnly(): Promise<void> {
  console.log("[MongoDB Reset] Connecting to MongoDB...");
  await connectDatabase();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("[MongoDB Reset] Database connection failed");
  }

  console.log("[MongoDB Reset] Fetching all collections...");
  const collections = await db.listCollections().toArray();

  for (const collection of collections) {
    console.log(`[MongoDB Reset] Dropping collection: ${collection.name}...`);
    try {
      await db.collection(collection.name).drop();
    } catch (err: any) {
      // Ignore if collection was already dropped
      if (err.codeName !== "NamespaceNotFound") {
        console.warn(`[MongoDB Reset] Warning dropping ${collection.name}:`, err.message);
      }
    }
  }

  console.log("[MongoDB Reset] All collections dropped. Seeding ONLY categories...");

  for (const item of SEED_CATEGORIES) {
    await Category.create({
      categoryId: item.categoryId,
      name: item.name,
      row: item.row as 1 | 2 | 3,
      iconName: item.iconName,
      subcategories: item.subcategories,
      filters: item.filters,
      listingCardFields: item.listingCardFields,
      detailsSpecFields: item.detailsSpecFields,
      sellingFormFields: item.sellingFormFields,
      verificationBadges: item.verificationBadges,
      sortOptions: item.sortOptions,
      isActive: true
    });
  }

  const categoryCount = await Category.countDocuments();
  console.log(`[MongoDB Reset] Success! Database purged and ${categoryCount} master categories seeded into 'categories' collection.`);
  
  console.log("[MongoDB Reset] Seeding admin accounts...");
  await seedAdminUsers();

  await disconnectDatabase();
  console.log("[MongoDB Reset] Disconnected cleanly.");
}

// Run directly if invoked from command line
if (require.main === module) {
  purgeDatabaseAndSeedCategoriesOnly()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[MongoDB Reset] Fatal error:", err);
      process.exit(1);
    });
}
