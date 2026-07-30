"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedCategories = seedCategories;
const Category_1 = require("../../modules/categories/models/Category");
const SEED_CATEGORIES = [
    {
        categoryId: "cars",
        name: "Cars",
        row: 1,
        iconName: "Car",
        subcategories: ["Sedan", "SUV", "Hatchback", "Luxury", "MUV", "Coupe", "Convertible"],
        filters: ["Brand", "Model", "Year", "Fuel Type", "Transmission", "KM Driven", "Price", "Owners", "Location"],
        listingCardFields: ["year", "fuel", "transmission", "kmDriven"],
        detailsSpecFields: ["brand", "model", "variant", "year", "fuel", "transmission", "kmDriven", "owners", "registrationState", "insurance"],
        sellingFormFields: ["brand", "model", "year", "fuel", "transmission", "kmDriven", "owners"],
        verificationBadges: ["RC Verified", "Inspected"],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low", "Year: Newest First", "KM: Lowest First"]
    },
    {
        categoryId: "bikes",
        name: "Bikes & Scooters",
        row: 1,
        iconName: "Bike",
        subcategories: ["Sports", "Cruiser", "Commuter", "Scooter", "Electric"],
        filters: ["Brand", "Model", "Year", "KM Driven", "Engine Capacity", "Price", "Location"],
        listingCardFields: ["year", "kmDriven", "engineCapacity"],
        detailsSpecFields: ["brand", "model", "year", "kmDriven", "engineCapacity", "owners", "registrationState"],
        sellingFormFields: ["brand", "model", "year", "kmDriven"],
        verificationBadges: ["RC Verified"],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low", "Year: Newest First"]
    },
    {
        categoryId: "mobiles",
        name: "Mobiles",
        row: 1,
        iconName: "Smartphone",
        subcategories: ["Smartphones", "Feature Phones", "Tablets", "Accessories", "Smartwatches"],
        filters: ["Brand", "Storage", "RAM", "Condition", "Warranty", "Price", "Location"],
        listingCardFields: ["storage", "ram", "condition"],
        detailsSpecFields: ["brand", "model", "storage", "ram", "warranty", "batteryHealth", "accessoriesIncluded"],
        sellingFormFields: ["brand", "model", "storage", "ram"],
        verificationBadges: ["IMEI Checked"],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low", "Newest First"]
    },
    {
        categoryId: "electronics",
        name: "Electronics",
        row: 1,
        iconName: "Tv",
        subcategories: ["Laptops", "Cameras", "TVs", "Audio", "Gaming", "Other"],
        filters: ["Category", "Brand", "Condition", "Price", "Location"],
        listingCardFields: ["brand", "condition"],
        detailsSpecFields: ["brand", "model", "condition", "warranty"],
        sellingFormFields: ["brand", "model"],
        verificationBadges: ["Tested Working"],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "properties",
        name: "Properties",
        row: 1,
        iconName: "Home",
        subcategories: ["Apartments", "Houses", "PG/Hostels", "Commercial", "Plots", "Co-working"],
        filters: ["Property Type", "Bedrooms", "Baths", "Area", "Furnished", "Price", "Location"],
        listingCardFields: ["bedrooms", "sqftArea", "furnishedStatus"],
        detailsSpecFields: ["propertyType", "bedrooms", "bathrooms", "sqftArea", "floor", "parking", "facing"],
        sellingFormFields: ["propertyType", "bedrooms", "sqftArea"],
        verificationBadges: ["Verified Property"],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low", "Area: Low to High"]
    },
    {
        categoryId: "furniture",
        name: "Furniture & Décor",
        row: 2,
        iconName: "Armchair",
        subcategories: ["Sofa", "Beds", "Tables", "Chairs", "Wardrobe", "Décor"],
        filters: ["Material", "Condition", "Price", "Location"],
        listingCardFields: ["material", "condition"],
        detailsSpecFields: ["material", "dimensions", "condition"],
        sellingFormFields: ["material"],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "fashion",
        name: "Fashion",
        row: 2,
        iconName: "Shirt",
        subcategories: ["Men", "Women", "Kids", "Accessories", "Footwear", "Ethnic"],
        filters: ["Gender", "Size", "Brand", "Condition", "Price"],
        listingCardFields: ["size", "brand"],
        detailsSpecFields: ["gender", "size", "brand", "material", "condition"],
        sellingFormFields: ["size", "brand"],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "books",
        name: "Books & Hobbies",
        row: 2,
        iconName: "BookOpen",
        subcategories: ["Books", "Music", "Sports", "Art & Craft", "Games"],
        filters: ["Genre", "Condition", "Price"],
        listingCardFields: ["condition"],
        detailsSpecFields: ["genre", "author", "condition"],
        sellingFormFields: ["genre"],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "services",
        name: "Services",
        row: 2,
        iconName: "Wrench",
        subcategories: ["Home Services", "Personal Care", "Events", "Education", "Other"],
        filters: ["Service Type", "Location"],
        listingCardFields: ["serviceType"],
        detailsSpecFields: ["serviceType", "experience"],
        sellingFormFields: ["serviceType"],
        verificationBadges: ["Background Checked"],
        sortOptions: ["Relevance"]
    },
    {
        categoryId: "jobs",
        name: "Jobs",
        row: 2,
        iconName: "Briefcase",
        subcategories: ["Full-time", "Part-time", "Freelance", "Internship", "Work from Home"],
        filters: ["Job Type", "Salary", "Experience", "Location"],
        listingCardFields: ["jobType", "salaryRange"],
        detailsSpecFields: ["jobType", "salaryRange", "experienceRequired", "qualification"],
        sellingFormFields: ["jobType", "salaryRange"],
        verificationBadges: ["Verified Employer"],
        sortOptions: ["Relevance", "Salary: High to Low"]
    },
    {
        categoryId: "home_appliances",
        name: "Home Appliances",
        row: 3,
        iconName: "Refrigerator",
        subcategories: ["Kitchen", "Laundry", "Cooling", "Heating", "Cleaning"],
        filters: ["Brand", "Appliance Type", "Condition", "Price"],
        listingCardFields: ["brand", "condition"],
        detailsSpecFields: ["brand", "model", "condition", "warranty"],
        sellingFormFields: ["brand"],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "gym_sports",
        name: "Gym & Sports",
        row: 3,
        iconName: "Dumbbell",
        subcategories: ["Gym Equipment", "Outdoor Sports", "Indoor Games", "Cycling", "Swimming"],
        filters: ["Sport Type", "Condition", "Price"],
        listingCardFields: ["condition"],
        detailsSpecFields: ["sportType", "brand", "condition"],
        sellingFormFields: ["sportType"],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "kids",
        name: "Kids & Baby",
        row: 3,
        iconName: "Baby",
        subcategories: ["Toys", "Clothing", "Baby Gear", "School Supplies", "Safety"],
        filters: ["Age Group", "Condition", "Price"],
        listingCardFields: ["ageGroup", "condition"],
        detailsSpecFields: ["ageGroup", "brand", "condition"],
        sellingFormFields: ["ageGroup"],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    },
    {
        categoryId: "pets",
        name: "Pets",
        row: 3,
        iconName: "Dog",
        subcategories: ["Dogs", "Cats", "Birds", "Fish", "Accessories"],
        filters: ["Pet Type", "Breed", "Price"],
        listingCardFields: ["petType", "breed"],
        detailsSpecFields: ["petType", "breed", "age", "vaccinated"],
        sellingFormFields: ["petType"],
        verificationBadges: ["Vaccinated"],
        sortOptions: ["Relevance"]
    },
    {
        categoryId: "other",
        name: "Other",
        row: 3,
        iconName: "Package",
        subcategories: ["Miscellaneous", "Free Items", "Wanted"],
        filters: ["Price", "Condition"],
        listingCardFields: ["condition"],
        detailsSpecFields: ["condition"],
        sellingFormFields: [],
        verificationBadges: [],
        sortOptions: ["Relevance", "Price: Low to High", "Price: High to Low"]
    }
];
async function seedCategories() {
    try {
        const count = await Category_1.Category.countDocuments();
        if (count > 0) {
            return;
        }
        console.log("[Seeder] Seeding 15 master categories into MongoDB...");
        for (const item of SEED_CATEGORIES) {
            await Category_1.Category.create({
                categoryId: item.categoryId,
                name: item.name,
                row: item.row,
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
        console.log("[Seeder] 15 master categories seeded successfully.");
    }
    catch (error) {
        console.error("[Seeder] Failed to seed categories:", error);
    }
}
