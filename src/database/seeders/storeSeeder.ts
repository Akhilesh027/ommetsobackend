import { Store } from "../../modules/stores/models/Store";
import { User } from "../../modules/users/models/User";
import { StoreStatus } from "@omeetso/contracts";
import mongoose from "mongoose";

export async function seedStores(): Promise<void> {
  try {
    let owner = await User.findOne({ role: "SELLER" });
    if (!owner) {
      owner = await User.findOne({ email: "admin@omeetso.com" });
    }
    if (!owner) {
      owner = await User.findOne({});
    }
    const ownerId = owner ? owner._id : new mongoose.Types.ObjectId();

    const sampleStores = [
      {
        name: "⚡ Apex Digital & Mobiles",
        slug: "apex-digital-mobiles",
        tagline: "Hyderabad's Most Trusted Premium Mobile Hub",
        description: "Authorized retailer for Apple, Samsung, OnePlus & Pixel flagships. Instant exchange offers & 0% EMI available.",
        businessType: "Retailer & Distributor",
        logo: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300",
        cover: "https://images.unsplash.com/photo-1556742049-0a67daf64f42?w=1200",
        primaryCategory: "mobiles",
        supportingCategories: ["electronics", "gadgets"],
        pincode: "500081",
        area: "Madhapur",
        city: "Hyderabad",
        address: "Plot 42, Main Road, opposite Inorbit Mall, Madhapur, Hyderabad",
        location: { type: "Point", coordinates: [78.3871, 17.4399] },
        businessMobile: "+919876543210",
        email: "sales@apexdigital.com",
        workingHours: [
          { day: "Mon", closed: false, open: "10:00", close: "21:30" },
          { day: "Tue", closed: false, open: "10:00", close: "21:30" },
          { day: "Wed", closed: false, open: "10:00", close: "21:30" },
          { day: "Thu", closed: false, open: "10:00", close: "21:30" },
          { day: "Fri", closed: false, open: "10:00", close: "21:30" },
          { day: "Sat", closed: false, open: "10:00", close: "22:00" },
          { day: "Sun", closed: false, open: "11:00", close: "21:00" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 15, chargeInPaise: 9900, freeAboveInPaise: 1000000 },
        status: StoreStatus.APPROVED,
        rating: 4.9,
        reviewCount: 142,
        followersCount: 380
      },
      {
        name: "💻 TechZone Laptops & Electronics",
        slug: "techzone-laptops-electronics",
        tagline: "Custom Gaming Rigs, MacBooks & Pro Audio Setup",
        description: "Specialists in gaming laptops, MacBook Pro upgrades, Sony OLED TVs, PS5 consoles, and professional studio equipment.",
        businessType: "Electronics Showroom",
        logo: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300",
        cover: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200",
        primaryCategory: "electronics",
        supportingCategories: ["laptops", "gaming"],
        pincode: "500032",
        area: "Gachibowli",
        city: "Hyderabad",
        address: "Level 2, DLF Cyber City, Gachibowli, Hyderabad",
        location: { type: "Point", coordinates: [78.3489, 17.4401] },
        businessMobile: "+919876543211",
        email: "support@techzone.in",
        workingHours: [
          { day: "Mon", closed: false, open: "10:30", close: "21:00" },
          { day: "Tue", closed: false, open: "10:30", close: "21:00" },
          { day: "Wed", closed: false, open: "10:30", close: "21:00" },
          { day: "Thu", closed: false, open: "10:30", close: "21:00" },
          { day: "Fri", closed: false, open: "10:30", close: "21:00" },
          { day: "Sat", closed: false, open: "10:00", close: "21:30" },
          { day: "Sun", closed: true, open: "10:00", close: "21:00" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 20, chargeInPaise: 14900, freeAboveInPaise: 2000000 },
        status: StoreStatus.APPROVED,
        rating: 4.8,
        reviewCount: 98,
        followersCount: 240
      },
      {
        name: "🛋️ UrbanLiving Furniture Studio",
        slug: "urbanliving-furniture-studio",
        tagline: "Luxury Teak Wood & Modern Home Decor",
        description: "Bespoke L-shape sofa sets, Italian marble dining tables, Solid Sheesham beds, and complete home interior furnishing solutions.",
        businessType: "Furniture Studio",
        logo: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300",
        cover: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200",
        primaryCategory: "furniture",
        supportingCategories: ["decor", "home_appliances"],
        pincode: "500033",
        area: "Jubilee Hills",
        city: "Hyderabad",
        address: "Road No 36, Jubilee Hills, Hyderabad",
        location: { type: "Point", coordinates: [78.4074, 17.4319] },
        businessMobile: "+919876543212",
        email: "contact@urbanliving.co.in",
        workingHours: [
          { day: "Mon", closed: false, open: "10:00", close: "20:30" },
          { day: "Tue", closed: false, open: "10:00", close: "20:30" },
          { day: "Wed", closed: false, open: "10:00", close: "20:30" },
          { day: "Thu", closed: false, open: "10:00", close: "20:30" },
          { day: "Fri", closed: false, open: "10:00", close: "20:30" },
          { day: "Sat", closed: false, open: "10:00", close: "21:00" },
          { day: "Sun", closed: false, open: "10:00", close: "21:00" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 25, chargeInPaise: 49900, freeAboveInPaise: 5000000 },
        status: StoreStatus.APPROVED,
        rating: 4.9,
        reviewCount: 115,
        followersCount: 520
      },
      {
        name: "🏎️ Supreme Motors & Superbikes",
        slug: "supreme-motors-superbikes",
        tagline: "Certified Pre-Owned Luxury Cars & Superbikes",
        description: "150-point inspection certified luxury cars & superBikes (BMW, Audi, Mercedes, Royal Enfield & KTM). Full warranty included.",
        businessType: "Automobile Dealership",
        logo: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300",
        cover: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200",
        primaryCategory: "cars",
        supportingCategories: ["bikes", "services"],
        pincode: "500034",
        area: "Banjara Hills",
        city: "Hyderabad",
        address: "Road No 12, Banjara Hills, Hyderabad",
        location: { type: "Point", coordinates: [78.4483, 17.4156] },
        businessMobile: "+919876543213",
        email: "info@suprememotors.in",
        workingHours: [
          { day: "Mon", closed: false, open: "09:30", close: "20:00" },
          { day: "Tue", closed: false, open: "09:30", close: "20:00" },
          { day: "Wed", closed: false, open: "09:30", close: "20:00" },
          { day: "Thu", closed: false, open: "09:30", close: "20:00" },
          { day: "Fri", closed: false, open: "09:30", close: "20:00" },
          { day: "Sat", closed: false, open: "09:30", close: "20:30" },
          { day: "Sun", closed: false, open: "10:00", close: "19:00" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 50, chargeInPaise: 0, freeAboveInPaise: 0 },
        status: StoreStatus.APPROVED,
        rating: 4.9,
        reviewCount: 210,
        followersCount: 890
      },
      {
        name: "✨ Silk & Style Fashion Boutique",
        slug: "silk-style-fashion-boutique",
        tagline: "Pure Kanchipuram Silks & Bridal Designer Wear",
        description: "Handwoven Kanchipuram sarees, wedding lehengas, custom men's tuxedos, and designer Indo-Western ethnic wear.",
        businessType: "Fashion Boutique",
        logo: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300",
        cover: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200",
        primaryCategory: "fashion",
        supportingCategories: ["ethnic", "accessories"],
        pincode: "500034",
        area: "Banjara Hills",
        city: "Hyderabad",
        address: "Road No 1, Banjara Hills, Hyderabad",
        location: { type: "Point", coordinates: [78.4491, 17.4162] },
        businessMobile: "+919876543214",
        email: "orders@silkandstyle.com",
        workingHours: [
          { day: "Mon", closed: false, open: "11:00", close: "21:00" },
          { day: "Tue", closed: false, open: "11:00", close: "21:00" },
          { day: "Wed", closed: false, open: "11:00", close: "21:00" },
          { day: "Thu", closed: false, open: "11:00", close: "21:00" },
          { day: "Fri", closed: false, open: "11:00", close: "21:00" },
          { day: "Sat", closed: false, open: "10:30", close: "21:30" },
          { day: "Sun", closed: false, open: "11:00", close: "21:00" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 15, chargeInPaise: 9900, freeAboveInPaise: 500000 },
        status: StoreStatus.APPROVED,
        rating: 4.8,
        reviewCount: 86,
        followersCount: 310
      },
      {
        name: "🏠 Prime Heights Realty & Interiors",
        slug: "prime-heights-realty-interiors",
        tagline: "Gated Community Apartments & Commercial Spaces",
        description: "Verified luxury apartments, independent villas, and plug & play commercial office spaces across Hyderabad IT corridor.",
        businessType: "Real Estate & Interior Consultancy",
        logo: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300",
        cover: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
        primaryCategory: "properties",
        supportingCategories: ["commercial", "villas"],
        pincode: "500081",
        area: "HITEC City",
        city: "Hyderabad",
        address: "Tower B, Mindspace IT Park, HITEC City, Hyderabad",
        location: { type: "Point", coordinates: [78.3812, 17.4435] },
        businessMobile: "+919876543215",
        email: "leads@primeheightsrealty.com",
        workingHours: [
          { day: "Mon", closed: false, open: "09:00", close: "19:30" },
          { day: "Tue", closed: false, open: "09:00", close: "19:30" },
          { day: "Wed", closed: false, open: "09:00", close: "19:30" },
          { day: "Thu", closed: false, open: "09:00", close: "19:30" },
          { day: "Fri", closed: false, open: "09:00", close: "19:30" },
          { day: "Sat", closed: false, open: "09:00", close: "19:30" },
          { day: "Sun", closed: false, open: "10:00", close: "17:00" }
        ],
        is24x7: false,
        delivery: { pickup: false, localDelivery: false, buyerPickup: true, radiusKm: 0, chargeInPaise: 0, freeAboveInPaise: 0 },
        status: StoreStatus.APPROVED,
        rating: 4.7,
        reviewCount: 74,
        followersCount: 180
      },
      {
        name: "❄️ CoolCare Home Appliances World",
        slug: "coolcare-home-appliances-world",
        tagline: "LG, Bosch, Daikin & Dyson Authorised Store",
        description: "Side-by-side refrigerators, 5-star inverter ACs, front load washing machines, and cordless vacuum cleaners with free installation.",
        businessType: "Appliance Mega Store",
        logo: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=300",
        cover: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200",
        primaryCategory: "home_appliances",
        supportingCategories: ["electronics", "cooling"],
        pincode: "500072",
        area: "Kukatpally",
        city: "Hyderabad",
        address: "KPHB Phase 3, Main Road, Kukatpally, Hyderabad",
        location: { type: "Point", coordinates: [78.4011, 17.4947] },
        businessMobile: "+919876543216",
        email: "sales@coolcareappliances.com",
        workingHours: [
          { day: "Mon", closed: false, open: "10:00", close: "21:30" },
          { day: "Tue", closed: false, open: "10:00", close: "21:30" },
          { day: "Wed", closed: false, open: "10:00", close: "21:30" },
          { day: "Thu", closed: false, open: "10:00", close: "21:30" },
          { day: "Fri", closed: false, open: "10:00", close: "21:30" },
          { day: "Sat", closed: false, open: "10:00", close: "22:00" },
          { day: "Sun", closed: false, open: "10:00", close: "21:30" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 20, chargeInPaise: 19900, freeAboveInPaise: 3000000 },
        status: StoreStatus.APPROVED,
        rating: 4.8,
        reviewCount: 130,
        followersCount: 410
      },
      {
        name: "🐾 Paws & Claws Pet Care & Aquatics",
        slug: "paws-claws-pet-care-aquatics",
        tagline: "KCI Pedigree Puppies, Kittens & Marine Aquariums",
        description: "Health-certified Golden Retrievers, Persian kittens, imported pet foods, aquarium setups, and veterinary grooming accessories.",
        businessType: "Pet Care & Veterinary Store",
        logo: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=300",
        cover: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200",
        primaryCategory: "pets",
        supportingCategories: ["dogs", "cats", "aquariums"],
        pincode: "500081",
        area: "Madhapur",
        city: "Hyderabad",
        address: "Near Metro Pillar 1724, Madhapur, Hyderabad",
        location: { type: "Point", coordinates: [78.3882, 17.4412] },
        businessMobile: "+919876543217",
        email: "care@pawsandclaws.in",
        workingHours: [
          { day: "Mon", closed: false, open: "09:30", close: "21:00" },
          { day: "Tue", closed: false, open: "09:30", close: "21:00" },
          { day: "Wed", closed: false, open: "09:30", close: "21:00" },
          { day: "Thu", closed: false, open: "09:30", close: "21:00" },
          { day: "Fri", closed: false, open: "09:30", close: "21:00" },
          { day: "Sat", closed: false, open: "09:00", close: "21:30" },
          { day: "Sun", closed: false, open: "09:00", close: "21:00" }
        ],
        is24x7: false,
        delivery: { pickup: true, localDelivery: true, buyerPickup: true, radiusKm: 15, chargeInPaise: 4900, freeAboveInPaise: 150000 },
        status: StoreStatus.APPROVED,
        rating: 4.9,
        reviewCount: 92,
        followersCount: 275
      }
    ];

    let seededCount = 0;
    for (const storeData of sampleStores) {
      await Store.findOneAndUpdate(
        { slug: storeData.slug },
        {
          $set: {
            ...storeData,
            ownerId,
            publishedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      seededCount++;
    }

    console.log(`[Seeder] Seeded ${seededCount} approved business stores in MongoDB.`);
  } catch (error) {
    console.error("[Seeder] Error seeding stores:", error);
  }
}
