"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const Notification_1 = require("../models/Notification");
async function getNotifications(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            Notification_1.Notification.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification_1.Notification.countDocuments({ userId: req.user._id }),
            Notification_1.Notification.countDocuments({ userId: req.user._id, isRead: false })
        ]);
        res.status(200).json({
            success: true,
            data: notifications.map((n) => ({
                id: n._id.toString(),
                type: n.type,
                title: n.title,
                body: n.body,
                link: n.link,
                isRead: n.isRead,
                createdAt: n.createdAt
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            unreadCount
        });
    }
    catch (error) {
        next(error);
    }
}
async function markNotificationRead(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        const { notificationId } = req.params;
        await Notification_1.Notification.updateOne({ _id: notificationId, userId: req.user._id }, { $set: { isRead: true, readAt: new Date() } });
        res.status(200).json({
            success: true,
            data: { message: "Notification marked as read" }
        });
    }
    catch (error) {
        next(error);
    }
}
async function markAllNotificationsRead(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
            return;
        }
        await Notification_1.Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
        res.status(200).json({
            success: true,
            data: { message: "All notifications marked as read" }
        });
    }
    catch (error) {
        next(error);
    }
}
