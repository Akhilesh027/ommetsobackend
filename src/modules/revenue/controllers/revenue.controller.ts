import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Wallet } from "../models/Wallet";
import { WalletTransaction } from "../models/WalletTransaction";
import { WalletHold } from "../models/WalletHold";
import { AdProduct } from "../models/AdProduct";
import { AdPlacement } from "../models/AdPlacement";
import { AdCampaign } from "../models/AdCampaign";
import { Listing } from "../../listings/models/Listing";
import { MediaAsset } from "../models/MediaAsset";
import { AdAnalytics } from "../models/AdAnalytics";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";
import { AuthenticatedAdminRequest } from "../../../middleware/authenticateAdmin";

export async function getMyWallet(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balanceInPaise: 500000, refundBalanceInPaise: 0 }); // Initial ₹5,000 promo credit
    }

    const [transactions, holds] = await Promise.all([
      WalletTransaction.find({ walletId: wallet._id }).sort({ createdAt: -1 }).limit(30).lean(),
      WalletHold.find({ userId: req.user._id, status: "HELD" }).lean()
    ]);

    const totalHeldInPaise = holds.reduce((sum, h) => sum + h.amountInPaise, 0);

    res.status(200).json({
      success: true,
      data: {
        id: wallet._id.toString(),
        balanceInPaise: wallet.balanceInPaise,
        availableBalanceInPaise: wallet.balanceInPaise - totalHeldInPaise,
        heldBalanceInPaise: totalHeldInPaise,
        refundBalanceInPaise: wallet.refundBalanceInPaise,
        transactions: transactions.map((t) => ({
          id: t._id.toString(),
          type: t.type,
          amountInPaise: t.amountInPaise,
          description: t.description,
          referenceType: t.referenceType,
          status: t.status,
          createdAt: t.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function rechargeWallet(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { amountInRupees, paymentMethod, paymentId } = req.body;
    const amount = Number(amountInRupees);

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Valid recharge amount required" } });
      return;
    }

    const amountInPaise = Math.round(amount * 100);

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balanceInPaise: 0, refundBalanceInPaise: 0 });
    }

    wallet.balanceInPaise += amountInPaise;
    await wallet.save();

    const pId = paymentId || `pay_rzp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const methodStr = paymentMethod ? ` (${paymentMethod.toUpperCase()})` : " (UPI)";

    const transaction = await WalletTransaction.create({
      walletId: wallet._id,
      type: "credit",
      amountInPaise,
      description: `Wallet top-up via Razorpay${methodStr} #${pId.slice(-8)}`,
      referenceType: "direct_deposit",
      status: "COMPLETED"
    });

    res.status(200).json({
      success: true,
      data: {
        id: wallet._id.toString(),
        balanceInPaise: wallet.balanceInPaise,
        addedInPaise: amountInPaise,
        transaction: {
          id: transaction._id.toString(),
          amountInPaise: transaction.amountInPaise,
          description: transaction.description,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const seedProducts = [
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

    await AdProduct.deleteMany({});
    await AdProduct.insertMany(seedProducts);
    const products = await AdProduct.find({ active: true }).sort({ priceInPaise: 1 }).lean();

    res.status(200).json({
      success: true,
      data: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        campaignType: p.campaignType,
        durationDays: p.durationDays,
        priceInPaise: p.priceInPaise,
        permittedPlacements: p.permittedPlacements
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdPlacements(req: Request, res: Response, Next: NextFunction): Promise<void> {
  try {
    const placements = await AdPlacement.find({ active: true }).lean();
    const activeCampaigns = await AdCampaign.find({ status: "ACTIVE" })
      .populate("advertiserUserId", "name email phone")
      .populate("listingId", "title images")
      .lean();

    const data = placements.map((p) => {
      const bookedCampaigns = activeCampaigns.filter((c: any) => c.placementIds?.includes(p.placementId));
      return {
        id: p._id.toString(),
        placementId: p.placementId,
        name: p.name,
        campaignTypes: p.campaignTypes,
        aspectRatio: p.aspectRatio,
        minimumWidth: p.minimumWidth,
        minimumHeight: p.minimumHeight,
        maximumFileSizeBytes: p.maximumFileSizeBytes,
        maximumActiveSlots: p.maximumActiveSlots,
        bookedSlotsCount: bookedCampaigns.length,
        bookedCampaigns: bookedCampaigns.map((c: any) => ({
          campaignId: c._id.toString(),
          advertiserName: c.advertiserUserId?.name || c.advertiserUserId?.email || "Seller Account",
          listingTitle: c.listingId?.title || "Product Listing",
          listingImage: c.listingId?.images?.[0] || "",
          startAt: c.startAt,
          endAt: c.endAt
        }))
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    Next(error);
  }
}

export async function createAdPlacement(req: Request, res: Response, Next: NextFunction): Promise<void> {
  try {
    const { placementId, name, campaignTypes, aspectRatio, minimumWidth, minimumHeight, maximumFileSizeBytes, maximumActiveSlots } = req.body;

    if (!placementId || !name) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "placementId and name are required" } });
      return;
    }

    const newPlacement = await AdPlacement.create({
      placementId: placementId.toUpperCase(),
      name,
      campaignTypes: campaignTypes || ["BANNER_AD"],
      aspectRatio: aspectRatio || "16:9",
      minimumWidth: Number(minimumWidth) || 1200,
      minimumHeight: Number(minimumHeight) || 600,
      maximumFileSizeBytes: Number(maximumFileSizeBytes) || 2097152,
      maximumActiveSlots: Number(maximumActiveSlots) || 5,
      active: true
    });

    res.status(201).json({ success: true, data: newPlacement });
  } catch (error) {
    Next(error);
  }
}

export async function deleteAdPlacement(req: Request, res: Response, Next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await AdPlacement.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Placement slot deleted successfully" });
  } catch (error) {
    Next(error);
  }
}

export async function createAdCampaign(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    let { listingId, adProductId, placementIds, creativeAssetId, bannerUrl, targeting } = req.body;

    if (!listingId || !adProductId) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "listingId and adProductId are required" } });
      return;
    }

    let listing = null;
    if (mongoose.Types.ObjectId.isValid(listingId)) {
      listing = await Listing.findById(listingId);
    } else {
      listing = await Listing.findOne({ $or: [{ id: listingId }, { sellerId: req.user._id }] });
    }

    if (!listing) {
      listing = await Listing.findOne({ sellerId: req.user._id });
    }

    if (!listing) {
      listing = await Listing.create({
        sellerId: req.user._id,
        title: "Store Promotion Listing",
        description: "Promotional listing created for ad campaign",
        priceInPaise: 100000,
        categoryId: "general",
        city: "Hyderabad",
        status: "ACTIVE"
      });
    }

    let product = null;
    if (mongoose.Types.ObjectId.isValid(adProductId)) {
      product = await AdProduct.findById(adProductId);
    } else {
      product = await AdProduct.findOne({ active: true });
    }

    if (!product) {
      product = await AdProduct.create({
        name: "Standard Listing Boost (7 Days)",
        description: "Promote your listing card to top search positions",
        campaignType: "LISTING_BOOST",
        durationDays: 7,
        priceInPaise: 19900,
        permittedPlacements: ["SEARCH_TOP", "HOMEPAGE_CAROUSEL"],
        active: true
      });
    }

    const amountInPaise = product.priceInPaise;
    const taxInPaise = Math.round(amountInPaise * 0.18); // 18% GST
    const totalInPaise = amountInPaise + taxInPaise;

    const campaign = await AdCampaign.create({
      campaignType: product.campaignType,
      advertiserUserId: req.user._id,
      targetType: "LISTING",
      listingId: listing._id,
      adProductId: product._id,
      placementIds: placementIds || product.permittedPlacements,
      creativeAssetId,
      bannerUrl: bannerUrl || (listing.images?.[0] || undefined),
      targeting: targeting || { categoryIds: [listing.categoryId] },
      pricing: {
        amountInPaise,
        taxInPaise,
        totalInPaise
      },
      paymentStatus: "NOT_STARTED",
      status: "DRAFT"
    });

    res.status(201).json({
      success: true,
      data: {
        id: campaign._id.toString(),
        campaignType: campaign.campaignType,
        status: campaign.status,
        pricing: campaign.pricing
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function submitAdCampaign(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const campaignId = (req.params.campaignId || req.params.id) as string;
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid campaign ID format" } });
      return;
    }

    const campaign = await AdCampaign.findOne({ _id: campaignId, advertiserUserId: req.user._id });

    if (!campaign) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
      return;
    }

    if (campaign.status !== "DRAFT" && campaign.status !== "PAYMENT_PENDING") {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: `Campaign cannot be submitted in status ${campaign.status}` } });
      return;
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id, balanceInPaise: 500000, refundBalanceInPaise: 0 });
    }

    const existingHolds = await WalletHold.find({ userId: req.user._id, status: "HELD" });
    const totalHeld = existingHolds.reduce((s, h) => s + h.amountInPaise, 0);
    const availableBalance = wallet.balanceInPaise - totalHeld;

    if (availableBalance < campaign.pricing.totalInPaise) {
      res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_FUNDS",
          message: `Insufficient wallet balance. Required: ₹${(campaign.pricing.totalInPaise / 100).toLocaleString("en-IN")}, Available: ₹${(availableBalance / 100).toLocaleString("en-IN")}`
        }
      });
      return;
    }

    // Reserve Wallet Hold
    const hold = await WalletHold.create({
      userId: req.user._id,
      campaignId: campaign._id,
      amountInPaise: campaign.pricing.totalInPaise,
      status: "HELD",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    campaign.paymentStatus = "FUNDS_HELD";
    campaign.status = "PENDING_REVIEW";
    campaign.reviewDeadlineAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour review SLA
    await campaign.save();

    res.status(200).json({
      success: true,
      data: {
        id: campaign._id.toString(),
        status: campaign.status,
        reviewDeadlineAt: campaign.reviewDeadlineAt,
        holdId: hold._id.toString()
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyAdCampaigns(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const campaigns = await AdCampaign.find({ advertiserUserId: req.user._id })
      .populate("listingId", "title priceInPaise images")
      .populate("adProductId", "name durationDays")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: campaigns.map((c: any) => ({
        id: c._id.toString(),
        campaignType: c.campaignType,
        listing: c.listingId
          ? {
              id: c.listingId._id.toString(),
              title: c.listingId.title,
              priceInPaise: c.listingId.priceInPaise,
              image: c.listingId.images?.[0]
            }
          : undefined,
        productName: c.adProductId?.name,
        placementIds: c.placementIds,
        bannerUrl: c.bannerUrl,
        pricing: c.pricing,
        paymentStatus: c.paymentStatus,
        status: c.status,
        reviewDeadlineAt: c.reviewDeadlineAt,
        rejectionReason: c.rejectionReason,
        startAt: c.startAt,
        endAt: c.endAt,
        impressionsCount: c.impressionsCount,
        clicksCount: c.clicksCount,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

// ── Admin Moderation Endpoints ──

export async function getAdminAdCampaigns(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, campaignType } = req.query;
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ["PENDING_REVIEW", "SUBMITTED", "ACTIVE", "APPROVED", "REJECTED"] };
    }

    if (campaignType) {
      filter.campaignType = campaignType;
    }

    const campaigns = await AdCampaign.find(filter)
      .populate("advertiserUserId", "profile.name email phone")
      .populate("listingId", "title priceInPaise images status categoryId")
      .populate("adProductId", "name durationDays")
      .sort({ reviewDeadlineAt: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: campaigns.map((c: any) => ({
        id: c._id.toString(),
        campaignType: c.campaignType,
        advertiser: c.advertiserUserId
          ? {
              id: c.advertiserUserId._id.toString(),
              name: c.advertiserUserId.profile?.name || c.advertiserUserId.email,
              email: c.advertiserUserId.email,
              phone: c.advertiserUserId.phone
            }
          : undefined,
        listing: c.listingId
          ? {
              id: c.listingId._id.toString(),
              title: c.listingId.title,
              priceInPaise: c.listingId.priceInPaise,
              image: c.listingId.images?.[0]
            }
          : undefined,
        productName: c.adProductId?.name,
        durationDays: c.adProductId?.durationDays || 7,
        placementIds: c.placementIds,
        bannerUrl: c.bannerUrl,
        pricing: c.pricing,
        paymentStatus: c.paymentStatus,
        status: c.status,
        reviewDeadlineAt: c.reviewDeadlineAt,
        rejectionReason: c.rejectionReason,
        startAt: c.startAt,
        endAt: c.endAt,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function approveAdminAdCampaign(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
      return;
    }

    const { campaignId } = req.params;
    const campaign = await AdCampaign.findById(campaignId).populate("adProductId");

    if (!campaign) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
      return;
    }

    // Capture Wallet Hold
    const hold = await WalletHold.findOne({ campaignId: campaign._id, status: "HELD" });
    if (hold) {
      hold.status = "CAPTURED";
      hold.capturedAt = new Date();
      await hold.save();

      const wallet = await Wallet.findOne({ userId: campaign.advertiserUserId });
      if (wallet) {
        wallet.balanceInPaise -= hold.amountInPaise;
        await wallet.save();

        await WalletTransaction.create({
          walletId: wallet._id,
          type: "debit",
          amountInPaise: hold.amountInPaise,
          description: `Boost Ad Campaign Activation (#${campaign._id.toString().slice(-6)})`,
          referenceType: "promotion",
          referenceId: campaign._id.toString(),
          status: "SUCCESS"
        });
      }
    }

    const durationDays = (campaign.adProductId as any)?.durationDays || 7;
    const now = new Date();

    campaign.status = "ACTIVE";
    campaign.paymentStatus = "PAID";
    campaign.reviewedAt = now;
    campaign.reviewedByAdminId = req.admin._id;
    campaign.startAt = now;
    campaign.endAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    await campaign.save();

    res.status(200).json({
      success: true,
      data: {
        id: campaign._id.toString(),
        status: campaign.status,
        startAt: campaign.startAt,
        endAt: campaign.endAt
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectAdminAdCampaign(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.admin) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Admin required" } });
      return;
    }

    const { campaignId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Rejection reason is required" } });
      return;
    }

    const campaign = await AdCampaign.findById(campaignId);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
      return;
    }

    // Release Reserved Wallet Hold
    const hold = await WalletHold.findOne({ campaignId: campaign._id, status: "HELD" });
    if (hold) {
      hold.status = "RELEASED";
      hold.releasedAt = new Date();
      await hold.save();
    }

    campaign.status = "REJECTED";
    campaign.paymentStatus = "REFUNDED";
    campaign.rejectionReason = rejectionReason;
    campaign.reviewedAt = new Date();
    campaign.reviewedByAdminId = req.admin._id;
    await campaign.save();

    res.status(200).json({
      success: true,
      data: {
        id: campaign._id.toString(),
        status: campaign.status,
        rejectionReason: campaign.rejectionReason
      }
    });
  } catch (error) {
    next(error);
  }
}

// ── Live Ad Serving Engine ──

export async function serveAds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { placement, categoryId } = req.query;
    const now = new Date();

    const query: Record<string, any> = {
      status: "ACTIVE",
      startAt: { $lte: now },
      endAt: { $gte: now }
    };

    if (placement) {
      query.placementIds = placement;
    }

    const activeCampaigns = await AdCampaign.find(query)
      .populate("listingId", "title priceInPaise images city categoryId condition storeId")
      .populate("storeId", "name cover logo area")
      .limit(10)
      .lean();

    const servedAds = activeCampaigns.map((c: any) => {
      const isStoreAd = Boolean(
        placement === "STORE_BANNER" ||
        c.campaignType === "STORE_PROMOTION" ||
        c.placementIds?.includes("STORE_BANNER") ||
        c.storeId
      );

      const storeIdFromListing = c.listingId?.storeId?._id 
        ? c.listingId.storeId._id.toString() 
        : c.listingId?.storeId 
        ? String(c.listingId.storeId) 
        : undefined;

      const targetStoreId = c.storeId?._id 
        ? c.storeId._id.toString() 
        : c.storeId 
        ? String(c.storeId) 
        : storeIdFromListing;

      const targetListingId = c.listingId?._id 
        ? c.listingId._id.toString() 
        : c.listingId 
        ? String(c.listingId) 
        : undefined;

      let destinationUrl = "/";
      if (isStoreAd) {
        // If ad is about a Store -> Navigate to Store page!
        if (targetStoreId) {
          destinationUrl = `/store/${targetStoreId}`;
        } else if (targetListingId) {
          destinationUrl = `/store/${targetListingId}`;
        } else {
          destinationUrl = "/stores";
        }
      } else if (targetListingId) {
        // Product Listing Boost -> Navigate to Product Details page!
        destinationUrl = `/product/${targetListingId}`;
      } else if (targetStoreId) {
        destinationUrl = `/store/${targetStoreId}`;
      }

      return {
        servedAdId: `served_${c._id.toString()}_${Date.now()}`,
        campaignId: c._id.toString(),
        campaignType: c.campaignType,
        listingId: targetListingId,
        storeId: targetStoreId,
        placement: placement || c.placementIds?.[0] || "HOMEPAGE_HERO",
        creative: {
          imageUrl: c.bannerUrl || c.listingId?.images?.[0] || c.storeId?.cover,
          title: c.listingId?.title || c.storeId?.name || "Sponsored Highlight",
          priceInPaise: c.listingId?.priceInPaise,
          destinationUrl
        },
        label: "Sponsored"
      };
    });

    const defaultSlots = [
      {
        servedAdId: `default_slot_1_${Date.now()}`,
        campaignId: "default_campaign_1",
        campaignType: "BANNER_AD",
        listingId: null,
        storeId: null,
        placement: placement || "HOMEPAGE_HERO",
        creative: {
          imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200",
          title: "Boost Your Products & Reach Nearby Buyers on Omeetso!",
          priceInPaise: 0,
          destinationUrl: "/promotions/new"
        },
        label: "Platform Highlight"
      },
      {
        servedAdId: `default_slot_2_${Date.now()}`,
        campaignId: "default_campaign_2",
        campaignType: "BANNER_AD",
        listingId: null,
        storeId: null,
        placement: placement || "HOMEPAGE_HERO",
        creative: {
          imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200",
          title: "Explore Verified Local Electronics & Mobile Stores Near You",
          priceInPaise: 0,
          destinationUrl: "/stores"
        },
        label: "Local Merchant Spotlight"
      },
      {
        servedAdId: `default_slot_3_${Date.now()}`,
        campaignId: "default_campaign_3",
        campaignType: "BANNER_AD",
        listingId: null,
        storeId: null,
        placement: placement || "HOMEPAGE_HERO",
        creative: {
          imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
          title: "Sell Anything in Under 60 Seconds — Fast & Free Listing!",
          priceInPaise: 0,
          destinationUrl: "/sell/quick"
        },
        label: "Quick Listing"
      },
      {
        servedAdId: `default_slot_4_${Date.now()}`,
        campaignId: "default_campaign_4",
        campaignType: "BANNER_AD",
        listingId: null,
        storeId: null,
        placement: placement || "HOMEPAGE_HERO",
        creative: {
          imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200",
          title: "Discover Trending Home, Furniture & Appliance Deals",
          priceInPaise: 0,
          destinationUrl: "/results"
        },
        label: "Category Showcase"
      },
      {
        servedAdId: `default_slot_5_${Date.now()}`,
        campaignId: "default_campaign_5",
        campaignType: "BANNER_AD",
        listingId: null,
        storeId: null,
        placement: placement || "HOMEPAGE_HERO",
        creative: {
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200",
          title: "Upgrade Your Tech: Premium Audio & Accessories",
          priceInPaise: 0,
          destinationUrl: "/results"
        },
        label: "Gadget Deals"
      },
      {
        servedAdId: `default_slot_6_${Date.now()}`,
        campaignId: "default_campaign_6",
        campaignType: "BANNER_AD",
        listingId: null,
        storeId: null,
        placement: placement || "HOMEPAGE_HERO",
        creative: {
          imageUrl: "https://images.unsplash.com/photo-1556742049-0a670e4a4591?w=1200",
          title: "Verified Sellers & Secure Negotiated Direct Chat",
          priceInPaise: 0,
          destinationUrl: "/chats"
        },
        label: "Safety & Trust"
      }
    ];

    // Guarantee 6 slots filled with active ads first, then default banners
    let defaultIndex = 0;
    while (servedAds.length < 6 && defaultIndex < defaultSlots.length) {
      servedAds.push(defaultSlots[defaultIndex]);
      defaultIndex++;
    }

    res.status(200).json({
      success: true,
      data: servedAds
    });
  } catch (error) {
    next(error);
  }
}

export async function trackAdImpression(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { campaignId, placementId } = req.body;
    if (!campaignId || campaignId.startsWith("default_")) {
      res.status(200).json({ success: true, tracked: false });
      return;
    }

    const dateStr = new Date().toISOString().split("T")[0];

    // Increment overall campaign impressions
    await AdCampaign.findByIdAndUpdate(campaignId, { $inc: { impressionsCount: 1 } });

    // Update daily time-series analytics
    const analytics = await AdAnalytics.findOneAndUpdate(
      { campaignId, placementId: placementId || "GENERAL", date: dateStr },
      { $inc: { impressions: 1 } },
      { upsert: true, new: true }
    );

    if (analytics) {
      analytics.ctr = analytics.impressions > 0 ? (analytics.clicks / analytics.impressions) * 100 : 0;
      await analytics.save();
    }

    res.status(200).json({ success: true, tracked: true });
  } catch (error) {
    next(error);
  }
}

export async function trackAdClick(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { campaignId, placementId } = req.body;
    if (!campaignId || campaignId.startsWith("default_")) {
      res.status(200).json({ success: true, tracked: false });
      return;
    }

    const dateStr = new Date().toISOString().split("T")[0];

    // Increment overall campaign clicks
    await AdCampaign.findByIdAndUpdate(campaignId, { $inc: { clicksCount: 1 } });

    // Update daily time-series analytics
    const analytics = await AdAnalytics.findOneAndUpdate(
      { campaignId, placementId: placementId || "GENERAL", date: dateStr },
      { $inc: { clicks: 1 } },
      { upsert: true, new: true }
    );

    if (analytics) {
      analytics.ctr = analytics.impressions > 0 ? (analytics.clicks / analytics.impressions) * 100 : 0;
      await analytics.save();
    }

    res.status(200).json({ success: true, tracked: true });
  } catch (error) {
    next(error);
  }
}

export async function getCampaignAnalytics(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Campaign not found" } });
      return;
    }

    const series = await AdAnalytics.find({ campaignId: id }).sort({ date: 1 });

    const totalImpressions = campaign.impressionsCount || 0;
    const totalClicks = campaign.clicksCount || 0;
    const ctr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        campaignId: campaign._id,
        status: campaign.status,
        totalImpressions,
        totalClicks,
        ctr,
        dailySeries: series
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminRevenueAnalytics(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const campaigns = await AdCampaign.find({ status: { $in: ["APPROVED", "ACTIVE", "COMPLETED"] } });
    
    let totalRevenueInPaise = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    campaigns.forEach(c => {
      totalRevenueInPaise += c.pricing?.totalInPaise || 0;
      totalImpressions += c.impressionsCount || 0;
      totalClicks += c.clicksCount || 0;
    });

    const averageCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalMonetizationRevenueInPaise: totalRevenueInPaise,
        totalActiveCampaigns: campaigns.length,
        totalImpressionsServed: totalImpressions,
        totalClicksRecorded: totalClicks,
        averageCtr
      }
    });
  } catch (error) {
    next(error);
  }
}
