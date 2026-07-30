import { Router } from "express";
import {
  getMyWallet,
  rechargeWallet,
  getAdProducts,
  getAdPlacements,
  createAdPlacement,
  deleteAdPlacement,
  createAdCampaign,
  submitAdCampaign,
  getMyAdCampaigns,
  getAdminAdCampaigns,
  approveAdminAdCampaign,
  rejectAdminAdCampaign,
  serveAds,
  trackAdImpression,
  trackAdClick,
  getCampaignAnalytics,
  getAdminRevenueAnalytics
} from "../controllers/revenue.controller";
import { authenticateUser } from "../../../middleware/authenticateUser";
import { authenticateAdmin } from "../../../middleware/authenticateAdmin";
import { requirePermission } from "../../../middleware/requirePermission";

export const revenueRouter = Router();

// Public & User Ad Routes
revenueRouter.get("/wallet", authenticateUser, getMyWallet);
revenueRouter.post("/wallet/recharge", authenticateUser, rechargeWallet);
revenueRouter.get("/ad-products", getAdProducts);
revenueRouter.get("/ad-placements", getAdPlacements);
revenueRouter.get("/ads/serve", serveAds);
revenueRouter.post("/ads/track-impression", trackAdImpression);
revenueRouter.post("/ads/track-click", trackAdClick);

revenueRouter.post("/ad-campaigns", authenticateUser, createAdCampaign);
revenueRouter.post("/ad-campaigns/:campaignId/submit", authenticateUser, submitAdCampaign);
revenueRouter.get("/users/me/ad-campaigns", authenticateUser, getMyAdCampaigns);
revenueRouter.get("/ad-campaigns/:id/analytics", authenticateUser, getCampaignAnalytics);

// Admin Moderation & Revenue Analytics Routes
revenueRouter.get("/admin/ad-campaigns", authenticateAdmin, requirePermission("ads.view"), getAdminAdCampaigns);
revenueRouter.patch("/admin/ad-campaigns/:campaignId/approve", authenticateAdmin, requirePermission("ads.approve"), approveAdminAdCampaign);
revenueRouter.patch("/admin/ad-campaigns/:campaignId/reject", authenticateAdmin, requirePermission("ads.reject"), rejectAdminAdCampaign);
revenueRouter.post("/admin/ad-placements", authenticateAdmin, createAdPlacement);
revenueRouter.delete("/admin/ad-placements/:id", authenticateAdmin, deleteAdPlacement);
revenueRouter.get("/admin/revenue/analytics", authenticateAdmin, requirePermission("ads.view"), getAdminRevenueAnalytics);
