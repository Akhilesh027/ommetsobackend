import { AdProduct } from "../../modules/revenue/models/AdProduct";
import { AdPlacement } from "../../modules/revenue/models/AdPlacement";
import { AdCampaign } from "../../modules/revenue/models/AdCampaign";
import { Listing } from "../../modules/listings/models/Listing";
import { User } from "../../modules/users/models/User";
import mongoose from "mongoose";

export async function seedAdConfiguration(): Promise<void> {
  try {
    const placements = [
      {
        placementId: "HOMEPAGE_HERO",
        name: "Homepage Hero Banner",
        campaignTypes: ["BANNER_AD"],
        aspectRatio: "16:9",
        minimumWidth: 1600,
        minimumHeight: 900,
        maximumFileSizeBytes: 3145728, // 3MB
        maximumActiveSlots: 10,
        active: true
      },
      {
        placementId: "CATEGORY_HEADER",
        name: "Category Header Banner",
        campaignTypes: ["BANNER_AD"],
        aspectRatio: "3:1",
        minimumWidth: 1500,
        minimumHeight: 500,
        maximumFileSizeBytes: 2097152, // 2MB
        maximumActiveSlots: 10,
        active: true
      },
      {
        placementId: "SEARCH_TOP",
        name: "Search Priority #1 Spot",
        campaignTypes: ["LISTING_BOOST"],
        aspectRatio: "CARD",
        minimumWidth: 400,
        minimumHeight: 400,
        maximumFileSizeBytes: 1048576,
        maximumActiveSlots: 20,
        active: true
      },
      {
        placementId: "HOMEPAGE_CAROUSEL",
        name: "Featured Deals Carousel",
        campaignTypes: ["LISTING_BOOST"],
        aspectRatio: "CARD",
        minimumWidth: 400,
        minimumHeight: 400,
        maximumFileSizeBytes: 1048576,
        maximumActiveSlots: 20,
        active: true
      },
      {
        placementId: "URGENT_BADGE",
        name: "Urgent Deal Highlight",
        campaignTypes: ["LISTING_BOOST"],
        aspectRatio: "BADGE",
        minimumWidth: 200,
        minimumHeight: 200,
        maximumFileSizeBytes: 524288,
        maximumActiveSlots: 25,
        active: true
      },
      {
        placementId: "STORE_BANNER",
        name: "Store Directory Spotlight",
        campaignTypes: ["BANNER_AD"],
        aspectRatio: "3:1",
        minimumWidth: 1200,
        minimumHeight: 400,
        maximumFileSizeBytes: 2097152,
        maximumActiveSlots: 10,
        active: true
      }
    ];

    for (const p of placements) {
      await AdPlacement.findOneAndUpdate(
        { placementId: p.placementId },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log("[Seeder] Synced 6 AdPlacement slots in MongoDB.");

    const products = [
      // --- Listing Boost Plans ---
      {
        name: "⚡ Starter Boost Plan (3 Days)",
        description: "Promote your listing card with a FEATURED badge and category top placement for 3 days.",
        campaignType: "LISTING_BOOST",
        durationDays: 3,
        priceInPaise: 9900, // ₹99
        permittedPlacements: ["CATEGORY_FEATURED", "HIGHLIGHTED_CARD"],
        active: true
      },
      {
        name: "🚀 Popular Growth Boost Plan (7 Days)",
        description: "Top search ranking, SPONSORED badge, and category header placement for 7 days. Most Popular!",
        campaignType: "LISTING_BOOST",
        durationDays: 7,
        priceInPaise: 24900, // ₹249
        permittedPlacements: ["SEARCH_TOP", "CATEGORY_FEATURED", "HIGHLIGHTED_CARD"],
        active: true
      },
      {
        name: "👑 Pro Mega Takeover Plan (15 Days)",
        description: "Homepage hero carousel, top search position, URGENT badge, and 10× visibility boost for 15 days.",
        campaignType: "LISTING_BOOST",
        durationDays: 15,
        priceInPaise: 49900, // ₹499
        permittedPlacements: ["HOMEPAGE_HERO", "SEARCH_TOP", "CATEGORY_FEATURED", "URGENT_BADGE"],
        active: true
      },
      // --- Banner Ad Packages ---
      {
        name: "🎨 7-Day Homepage Hero Banner Package",
        description: "Custom promotional banner image featured prominently on the main Omeetso Homepage Hero Carousel with direct link.",
        campaignType: "BANNER_AD",
        durationDays: 7,
        priceInPaise: 49900, // ₹499
        permittedPlacements: ["HOMEPAGE_HERO"],
        active: true
      },
      {
        name: "🏷️ 14-Day Category Top Header Banner Package",
        description: "Top header banner displayed across all category search pages targeting active local shoppers for 14 days.",
        campaignType: "BANNER_AD",
        durationDays: 14,
        priceInPaise: 89900, // ₹899
        permittedPlacements: ["CATEGORY_HEADER"],
        active: true
      },
      {
        name: "👑 30-Day Store Mega Takeover Banner Package",
        description: "Complete brand takeover featuring your banner across Homepage Hero, Category Top Headers, and Store Spotlight sections.",
        campaignType: "BANNER_AD",
        durationDays: 30,
        priceInPaise: 199900, // ₹1,999
        permittedPlacements: ["HOMEPAGE_HERO", "CATEGORY_HEADER", "STORE_BANNER"],
        active: true
      }
    ];

    for (const prod of products) {
      await AdProduct.findOneAndUpdate(
        { name: prod.name },
        { $set: prod },
        { upsert: true, new: true }
      );
    }
    console.log("[Seeder] Synced AdProduct pricing packages in MongoDB.");

    // Ensure a seed seller account exists
    let seller = await User.findOne({ role: "SELLER" });
    if (!seller) {
      seller = await User.findOne({ email: "admin@omeetso.com" });
    }
    if (!seller) {
      seller = await User.findOne({});
    }
    const sellerId = seller ? seller._id : new mongoose.Types.ObjectId();

    // --- 4 PRODUCTS PER EVERY CATEGORY (48 TOTAL) ---
    const categoryProducts = [
      // 1. CARS (4 Items)
      {
        title: "2022 Hyundai Creta SX (O) Turbo DCT",
        description: "Top model Hyundai Creta with panoramic sunroof, ventilated seats, 10.25 inch touchscreen and full service record at Hyundai.",
        priceInPaise: 145000000, // ₹14,50,000
        categoryId: "cars",
        subcategory: "SUV",
        city: "Adilabad",
        area: "Adilabad",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800", "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"],
        status: "APPROVED"
      },
      {
        title: "2021 Mahindra Thar LX Hard Top 4x4 Petrol",
        description: "Pristine condition Mahindra Thar LX 4x4 hardtop with upgraded alloys, offroad bumper and pioneer audio system.",
        priceInPaise: 132000000, // ₹13,20,000
        categoryId: "cars",
        subcategory: "SUV",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800"],
        status: "APPROVED"
      },
      {
        title: "2023 Tata Nexon EV Max Lux Teal Blue",
        description: "Zero maintenance EV with 453km range, fast charger included, leatherette seats, auto dimming IRVM and sunroof.",
        priceInPaise: 158000000, // ₹15,80,000
        categoryId: "cars",
        subcategory: "SUV",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1563720223185-11003d516935?w=800"],
        status: "APPROVED"
      },
      {
        title: "2020 BMW 3 Series 320d Luxury Line",
        description: "Immaculate BMW 3 Series 320d in Mineral White metallic finish. Full company service history, ceramic coated.",
        priceInPaise: 289000000, // ₹28,90,000
        categoryId: "cars",
        subcategory: "Sedan",
        city: "Hyderabad",
        area: "Banjara Hills",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800"],
        status: "APPROVED"
      },

      // 2. BIKES (4 Items)
      {
        title: "2023 Royal Enfield Hunter 350 Dapper Grey",
        description: "Single owner Hunter 350 with just 4,200 km driven. Fitted with genuine Royal Enfield touring seat and engine guard.",
        priceInPaise: 16500000, // ₹1,65,000
        categoryId: "bikes",
        subcategory: "Cruiser",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800"],
        status: "APPROVED"
      },
      {
        title: "2022 TVS Apache RTR 200 4V Dual ABS",
        description: "Apache 200 4V with ride modes, SmartXonnect Bluetooth, adjustable suspension and new rear radial tyre.",
        priceInPaise: 11800000, // ₹1,18,000
        categoryId: "bikes",
        subcategory: "Sports",
        city: "Hyderabad",
        area: "Ameerpet",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800"],
        status: "APPROVED"
      },
      {
        title: "2023 Ather 450X Gen 3 Space Grey Electric",
        description: "Ather 450X Gen 3 with Pro Pack, Warp Mode, Google Maps navigation, auto-hold and home charger kit.",
        priceInPaise: 13500000, // ₹1,35,000
        categoryId: "bikes",
        subcategory: "Electric",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800"],
        status: "APPROVED"
      },
      {
        title: "2021 KTM Duke 390 ABS White",
        description: "Powerful 373cc liquid-cooled engine, quickshifter+, TFT color display, Metzeler M7RR tires.",
        priceInPaise: 24500000, // ₹2,45,000
        categoryId: "bikes",
        subcategory: "Sports",
        city: "Hyderabad",
        area: "Kukatpally",
        condition: "good",
        images: ["https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=800"],
        status: "APPROVED"
      },

      // 3. MOBILES (4 Items)
      {
        title: "iPhone 15 Pro Max 256GB Natural Titanium",
        description: "Apple iPhone 15 Pro Max in Natural Titanium with bill, box, original cable and 98% battery health.",
        priceInPaise: 11200000, // ₹1,12,000
        categoryId: "mobiles",
        subcategory: "Smartphones",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"],
        status: "APPROVED"
      },
      {
        title: "Samsung Galaxy S24 Ultra 512GB Titanium Black",
        description: "Galaxy AI powered flagship S24 Ultra with S-Pen, 200MP camera, 100x zoom and 6 months Indian warranty left.",
        priceInPaise: 10800000, // ₹1,08,000
        categoryId: "mobiles",
        subcategory: "Smartphones",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800"],
        status: "APPROVED"
      },
      {
        title: "OnePlus 12 16GB RAM 512GB Storage Silky Black",
        description: "Snapdragon 8 Gen 3 flagship killer with 100W SuperVOOC charger, Hasselblad camera system.",
        priceInPaise: 5499900, // ₹54,999
        categoryId: "mobiles",
        subcategory: "Smartphones",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800"],
        status: "APPROVED"
      },
      {
        title: "Google Pixel 8 Pro 128GB Hazel",
        description: "Tensor G3 chip, best-in-class AI camera computational photography, 120Hz LTPO OLED display.",
        priceInPaise: 6200000, // ₹62,000
        categoryId: "mobiles",
        subcategory: "Smartphones",
        city: "Hyderabad",
        area: "Jubilee Hills",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800"],
        status: "APPROVED"
      },

      // 4. ELECTRONICS (4 Items)
      {
        title: "MacBook Pro 14\" M3 Max 36GB RAM 1TB SSD",
        description: "Apple MacBook Pro 14-inch Space Black with M3 Max 14-core CPU, 30-core GPU. Liquid Retina XDR display.",
        priceInPaise: 19500000, // ₹1,95,000
        categoryId: "electronics",
        subcategory: "Laptops",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"],
        status: "APPROVED"
      },
      {
        title: "Sony Bravia 65\" 4K Ultra HD Smart OLED TV A80L",
        description: "Cognitive Processor XR, Acoustic Surface Audio+, Dolby Vision Atmos. Pristine wall-mounted panel.",
        priceInPaise: 14500000, // ₹1,45,000
        categoryId: "electronics",
        subcategory: "TVs",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800"],
        status: "APPROVED"
      },
      {
        title: "Sony PlayStation 5 Slim Digital Edition + 2 Controllers",
        description: "PS5 Slim Digital Edition with 1TB SSD, 2 DualSense Wireless Controllers and God of War Ragnarok bundle.",
        priceInPaise: 3999900, // ₹39,999
        categoryId: "electronics",
        subcategory: "Gaming",
        city: "Hyderabad",
        area: "Ameerpet",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800"],
        status: "APPROVED"
      },
      {
        title: "Canon EOS R6 Mark II Mirrorless Camera + 24-105mm Lens",
        description: "24.2MP full-frame sensor, 40fps electronic shutter, 4K 60p uncropped video. Includes 2 original batteries.",
        priceInPaise: 18500000, // ₹1,85,000
        categoryId: "electronics",
        subcategory: "Cameras",
        city: "Hyderabad",
        area: "Banjara Hills",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800"],
        status: "APPROVED"
      },

      // 5. PROPERTIES (4 Items)
      {
        title: "3 BHK Luxury Apartment in My Home Bhooja",
        description: "2595 sqft semi-furnished 3 BHK flat with 2 car parkings, clubhouse access and panoramic view of HITEC City skyline.",
        priceInPaise: 3200000000, // ₹3.2 Cr
        categoryId: "properties",
        subcategory: "Apartments",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"],
        status: "APPROVED"
      },
      {
        title: "2 BHK Fully Furnished Flat in Prime Location",
        description: "1250 sqft 2 BHK with modular kitchen, ACs, sofa set, wardrobes and power backup near Mindspace IT Park.",
        priceInPaise: 2800000, // ₹28,000/mo
        categoryId: "properties",
        subcategory: "Apartments",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
        status: "APPROVED"
      },
      {
        title: "Commercial Office Space 2500 Sqft Plug & Play",
        description: "35 workstations, 2 manager cabins, 10 seater conference room, reception area and pantry in IT hub.",
        priceInPaise: 17500000, // ₹1,75,000/mo
        categoryId: "properties",
        subcategory: "Commercial",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
        status: "APPROVED"
      },
      {
        title: "Independent 4 BHK Gated Villa in Financial District",
        description: "4200 sqft corner villa with private garden, home theatre room, imported marble flooring and solar power.",
        priceInPaise: 4800000000, // ₹4.8 Cr
        categoryId: "properties",
        subcategory: "Houses",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
        status: "APPROVED"
      },

      // 6. FURNITURE (4 Items)
      {
        title: "Royal 6-Seater Teak Wood L-Shape Sofa Set",
        description: "Premium teak wood frame L-shape sofa in suede velvet upholstery with 6 matching cushions and glass center table.",
        priceInPaise: 4200000, // ₹42,000
        categoryId: "furniture",
        subcategory: "Sofa",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"],
        status: "APPROVED"
      },
      {
        title: "Solid Sheesham Wood King Size Bed with Storage",
        description: "Heavy duty Sheesham wood king size bed with hydraulic storage and Orthopedic Memory Foam Mattress.",
        priceInPaise: 2850000, // ₹28,500
        categoryId: "furniture",
        subcategory: "Beds",
        city: "Hyderabad",
        area: "Kukatpally",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"],
        status: "APPROVED"
      },
      {
        title: "Modern Ergonomic Mesh Executive Office Chair",
        description: "High-back office chair with adjustable lumbar support, 3D armrests, headrest and synchronous tilt mechanism.",
        priceInPaise: 849900, // ₹8,499
        categoryId: "furniture",
        subcategory: "Chairs",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800"],
        status: "APPROVED"
      },
      {
        title: "6-Seater Italian Marble Top Dining Table Set",
        description: "Imported Italian beige marble dining table with stainless steel gold electroplated base and 6 leatherette chairs.",
        priceInPaise: 3600000, // ₹36,000
        categoryId: "furniture",
        subcategory: "Tables",
        city: "Hyderabad",
        area: "Jubilee Hills",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800"],
        status: "APPROVED"
      },

      // 7. FASHION (4 Items)
      {
        title: "Designer Pure Kanchipuram Silk Bridal Saree",
        description: "Authentic pure Kanchipuram zari weave bridal silk saree in royal magenta and gold. Silk Mark certified.",
        priceInPaise: 2450000, // ₹24,500
        categoryId: "fashion",
        subcategory: "Ethnic",
        city: "Hyderabad",
        area: "Banjara Hills",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800"],
        status: "APPROVED"
      },
      {
        title: "Men's Italian Cut Custom Wedding Tuxedo Suit",
        description: "3-piece slim fit Italian wool tuxedo suit in navy blue with satin lapels, vest and matching trousers.",
        priceInPaise: 1499900, // ₹14,999
        categoryId: "fashion",
        subcategory: "Men",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800"],
        status: "APPROVED"
      },
      {
        title: "Nike Air Jordan 1 Retro High OG Chicago (Size UK 9)",
        description: "Deadstock authentic Nike Air Jordan 1 Chicago colorway with original box, laces and receipt.",
        priceInPaise: 1850000, // ₹18,500
        categoryId: "fashion",
        subcategory: "Footwear",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800"],
        status: "APPROVED"
      },
      {
        title: "Fossil Gen 6 Touchscreen Smartwatch Dark Brown Leather",
        description: "Snapdragon Wear 4100+ smartwatch with SPO2 monitoring, GPS, heart rate tracking and fast charging.",
        priceInPaise: 1120000, // ₹11,200
        categoryId: "fashion",
        subcategory: "Accessories",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
        status: "APPROVED"
      },

      // 8. BOOKS & HOBBIES (4 Items)
      {
        title: "Collector's Edition Harry Potter 7-Book Hardcover Boxset",
        description: "Special deluxe hardcover boxed set with gold foil lettering and custom trunk case. Mint unread condition.",
        priceInPaise: 650000, // ₹6,500
        categoryId: "books",
        subcategory: "Books",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800"],
        status: "APPROVED"
      },
      {
        title: "Yamaha F310 Acoustic Guitar Natural + Padded Bag",
        description: "Legendary Yamaha acoustic guitar with warm tone, low action, fresh D'Addario strings and padded gig bag.",
        priceInPaise: 899000, // ₹8,990
        categoryId: "books",
        subcategory: "Music",
        city: "Hyderabad",
        area: "Ameerpet",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800"],
        status: "APPROVED"
      },
      {
        title: "Tournament Weighted Staunton Wooden Chess Set",
        description: "Handcrafted Sheesham wood Staunton 3.75\" king chess set with folding wooden board and velvet interior.",
        priceInPaise: 320000, // ₹3,200
        categoryId: "books",
        subcategory: "Games",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800"],
        status: "APPROVED"
      },
      {
        title: "Celestron PowerSeeker 127EQ Newtonian Telescope",
        description: "German Equatorial mount telescope with 127mm aperture, 3x Barlow lens and smartphone adapter.",
        priceInPaise: 1680000, // ₹16,800
        categoryId: "books",
        subcategory: "Sports",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800"],
        status: "APPROVED"
      },

      // 9. SERVICES (4 Items)
      {
        title: "Professional Deep Home Cleaning & Pest Control Service",
        description: "Complete 3BHK deep cleaning including kitchen degreasing, bathroom sanitization, sofa shampooing and herbal pest control.",
        priceInPaise: 349900, // ₹3,499
        categoryId: "services",
        subcategory: "Home Services",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800"],
        status: "APPROVED"
      },
      {
        title: "Complete Modular Kitchen & Interior Design Execution",
        description: "Custom acrylic/laminate modular kitchen, wardrobes, false ceiling, LED lighting and 3D architectural renders.",
        priceInPaise: 15000000, // ₹1,50,000
        categoryId: "services",
        subcategory: "Home Services",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800"],
        status: "APPROVED"
      },
      {
        title: "Car Ceramic Coating & Paint Protection Film (PPF)",
        description: "9H German ceramic coating with 5-year warranty, anti-scratch self-healing TPU PPF installation.",
        priceInPaise: 1800000, // ₹18,000
        categoryId: "services",
        subcategory: "Other",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800"],
        status: "APPROVED"
      },
      {
        title: "Destination Wedding & Event Photography (4K Drone)",
        description: "Candid photography, 4K cinematic teaser, drone aerial shots, traditional video and photobook album.",
        priceInPaise: 4500000, // ₹45,000
        categoryId: "services",
        subcategory: "Events",
        city: "Hyderabad",
        area: "Jubilee Hills",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800"],
        status: "APPROVED"
      },

      // 10. JOBS (4 Items)
      {
        title: "Senior Full Stack React & Node.js Engineer (Remote)",
        description: "Hiring Senior Engineer with 4+ years experience in React, TypeScript, Node.js, GraphQL and MongoDB.",
        priceInPaise: 240000000, // ₹24,00,000/yr
        categoryId: "jobs",
        subcategory: "Full-time",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800"],
        status: "APPROVED"
      },
      {
        title: "Digital Marketing & Performance Ads Specialist",
        description: "Manage Meta Ads, Google PPC campaigns, SEO and conversion rate optimization for D2C brands.",
        priceInPaise: 90000000, // ₹9,00,000/yr
        categoryId: "jobs",
        subcategory: "Full-time",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"],
        status: "APPROVED"
      },
      {
        title: "UI/UX Product Designer (Figma & Webflow)",
        description: "Lead mobile app UI/UX design, wireframing, interactive prototyping and design system creation.",
        priceInPaise: 140000000, // ₹14,00,000/yr
        categoryId: "jobs",
        subcategory: "Full-time",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800"],
        status: "APPROVED"
      },
      {
        title: "Executive Office Coordinator & Admin Lead",
        description: "Oversee office operations, vendor management, calendar scheduling and client travel logistics.",
        priceInPaise: 55000000, // ₹5,50,000/yr
        categoryId: "jobs",
        subcategory: "Full-time",
        city: "Hyderabad",
        area: "Banjara Hills",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800"],
        status: "APPROVED"
      },

      // 11. HOME APPLIANCES (4 Items)
      {
        title: "LG 655L Side-by-Side Inverter Refrigerator (InstaView)",
        description: "InstaView Door-in-Door, Hygiene Fresh+, UVnano water dispenser, Smart ThinQ WiFi control.",
        priceInPaise: 8200000, // ₹82,000
        categoryId: "home_appliances",
        subcategory: "Cooling",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800"],
        status: "APPROVED"
      },
      {
        title: "Bosch 8kg Front Load Fully Automatic Washing Machine",
        description: "EcoSilence Drive, AntiTangle feature, 1400 RPM spin speed, Touch control panel.",
        priceInPaise: 3450000, // ₹34,500
        categoryId: "home_appliances",
        subcategory: "Laundry",
        city: "Hyderabad",
        area: "Kondapur",
        condition: "excellent",
        images: ["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800"],
        status: "APPROVED"
      },
      {
        title: "Daikin 1.5 Ton 5 Star Inverter Split AC (3D Airflow)",
        description: "100% copper condenser, PM 2.5 filter, Triple Display, quiet operation and 10 year compressor warranty.",
        priceInPaise: 3890000, // ₹38,900
        categoryId: "home_appliances",
        subcategory: "Cooling",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800"],
        status: "APPROVED"
      },
      {
        title: "Dyson V12 Detect Slim Cordless Vacuum Cleaner",
        description: "Laser reveals microscopic dust, LCD screen shows particle size count, 60 min run time.",
        priceInPaise: 4250000, // ₹42,500
        categoryId: "home_appliances",
        subcategory: "Cleaning",
        city: "Hyderabad",
        area: "Banjara Hills",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800"],
        status: "APPROVED"
      },

      // 12. PETS (4 Items)
      {
        title: "Purebred Golden Retriever Puppies (KCI Registered)",
        description: "Healthy 45-day-old Golden Retriever puppies, vaccinated, dewormed with KCI lineage pedigree microchip.",
        priceInPaise: 2200000, // ₹22,000
        categoryId: "pets",
        subcategory: "Dogs",
        city: "Hyderabad",
        area: "Kukatpally",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=800"],
        status: "APPROVED"
      },
      {
        title: "Persian Kitten Tri-Color Doll Face (Vaccinated)",
        description: "Playful 2-month-old Persian kitten, litter trained, eating solid kitten food, health record book included.",
        priceInPaise: 1500000, // ₹15,000
        categoryId: "pets",
        subcategory: "Cats",
        city: "Hyderabad",
        area: "Madhapur",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800"],
        status: "APPROVED"
      },
      {
        title: "100L Curved Glass Aquarium Tank + LED & Filter Setup",
        description: "Complete 100L glass fish tank with top filter, LED bar light, substrate sand and driftwood decor.",
        priceInPaise: 1250000, // ₹12,500
        categoryId: "pets",
        subcategory: "Fish & Aquariums",
        city: "Hyderabad",
        area: "Ameerpet",
        condition: "like_new",
        images: ["https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=800"],
        status: "APPROVED"
      },
      {
        title: "Pedigree & Royal Canin Dog Food + Grooming Accessories",
        description: "Includes 10kg Royal Canin Maxi Adult, stainless steel feeding bowls, nail clipper, slicker brush and leash.",
        priceInPaise: 380000, // ₹3,800
        categoryId: "pets",
        subcategory: "Pet Supplies",
        city: "Hyderabad",
        area: "Gachibowli",
        condition: "new",
        images: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800"],
        status: "APPROVED"
      }
    ];

    const createdListings: any[] = [];
    for (const item of categoryProducts) {
      const doc = await Listing.findOneAndUpdate(
        { title: item.title },
        {
          $set: {
            ...item,
            sellerId
          }
        },
        { upsert: true, new: true }
      );
      createdListings.push(doc);
    }
    console.log(`[Seeder] Seeded ${createdListings.length} products across 12 categories in MongoDB.`);

    // --- CREATE BOOST CAMPAIGNS FOR ALL PLACEMENT SLOTS ---
    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const boostPlacements = [
      "HOMEPAGE_HERO",
      "CATEGORY_HEADER",
      "SEARCH_TOP",
      "HOMEPAGE_CAROUSEL",
      "URGENT_BADGE",
      "STORE_BANNER"
    ];

    let campaignCount = 0;
    for (let i = 0; i < createdListings.length; i++) {
      const listing = createdListings[i];
      const placement = boostPlacements[i % boostPlacements.length];
      const isBanner = placement === "HOMEPAGE_HERO" || placement === "CATEGORY_HEADER" || placement === "STORE_BANNER";

      await AdCampaign.findOneAndUpdate(
        { listingId: listing._id, placementIds: [placement] },
        {
          $set: {
            campaignType: isBanner ? "BANNER_AD" : "LISTING_BOOST",
            advertiserUserId: sellerId,
            targetType: "LISTING",
            listingId: listing._id,
            placementIds: [placement],
            bannerUrl: listing.images[0],
            pricing: { amountInPaise: 24900, taxInPaise: 4482, totalInPaise: 29382 },
            paymentStatus: "PAID",
            status: "ACTIVE",
            startAt: now,
            endAt: future
          }
        },
        { upsert: true, new: true }
      );
      campaignCount++;
    }

    console.log(`[Seeder] Successfully created ${campaignCount} active boost & banner campaigns across all ad placement slots!`);
  } catch (error) {
    console.error("[Seeder] Error seeding ad configuration:", error);
  }
}
