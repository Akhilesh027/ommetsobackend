"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenueRouter = void 0;
const express_1 = require("express");
const revenue_controller_1 = require("../controllers/revenue.controller");
const authenticateUser_1 = require("../../../middleware/authenticateUser");
const authenticateAdmin_1 = require("../../../middleware/authenticateAdmin");
const requirePermission_1 = require("../../../middleware/requirePermission");
exports.revenueRouter = (0, express_1.Router)();
// Public & User Ad Routes
exports.revenueRouter.get("/wallet", authenticateUser_1.authenticateUser, revenue_controller_1.getMyWallet);
exports.revenueRouter.get("/ad-products", revenue_controller_1.getAdProducts);
exports.revenueRouter.get("/ad-placements", revenue_controller_1.getAdPlacements);
exports.revenueRouter.get("/ads/serve", revenue_controller_1.serveAds);
exports.revenueRouter.post("/ads/track-impression", revenue_controller_1.trackAdImpression);
exports.revenueRouter.post("/ads/track-click", revenue_controller_1.trackAdClick);
exports.revenueRouter.post("/ad-campaigns", authenticateUser_1.authenticateUser, revenue_controller_1.createAdCampaign);
exports.revenueRouter.post("/ad-campaigns/:campaignId/submit", authenticateUser_1.authenticateUser, revenue_controller_1.submitAdCampaign);
exports.revenueRouter.get("/users/me/ad-campaigns", authenticateUser_1.authenticateUser, revenue_controller_1.getMyAdCampaigns);
exports.revenueRouter.get("/ad-campaigns/:id/analytics", authenticateUser_1.authenticateUser, revenue_controller_1.getCampaignAnalytics);
// Admin Moderation & Revenue Analytics Routes
exports.revenueRouter.get("/admin/ad-campaigns", authenticateAdmin_1.authenticateAdmin, (0, requirePermission_1.requirePermission)("ads.view"), revenue_controller_1.getAdminAdCampaigns);
exports.revenueRouter.patch("/admin/ad-campaigns/:campaignId/approve", authenticateAdmin_1.authenticateAdmin, (0, requirePermission_1.requirePermission)("ads.approve"), revenue_controller_1.approveAdminAdCampaign);
exports.revenueRouter.patch("/admin/ad-campaigns/:campaignId/reject", authenticateAdmin_1.authenticateAdmin, (0, requirePermission_1.requirePermission)("ads.reject"), revenue_controller_1.rejectAdminAdCampaign);
exports.revenueRouter.post("/admin/ad-placements", authenticateAdmin_1.authenticateAdmin, revenue_controller_1.createAdPlacement);
exports.revenueRouter.delete("/admin/ad-placements/:id", authenticateAdmin_1.authenticateAdmin, revenue_controller_1.deleteAdPlacement);
exports.revenueRouter.get("/admin/revenue/analytics", authenticateAdmin_1.authenticateAdmin, (0, requirePermission_1.requirePermission)("ads.view"), revenue_controller_1.getAdminRevenueAnalytics);
