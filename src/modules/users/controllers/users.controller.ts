import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { User } from "../models/User";
import { AuthenticatedUserRequest } from "../../../middleware/authenticateUser";

export async function getMyProfile(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }
    const u = req.user;
    res.status(200).json({
      success: true,
      data: {
        id: u._id.toString(),
        phone: u.phone,
        email: u.email,
        accountType: u.accountType,
        status: u.status,
        profile: u.profile,
        verificationSummary: u.verificationSummary,
        savedLocations: u.savedLocations || [],
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { name, bio, avatar, city, pincode, area, language, email } = req.body;
    const userId = req.user._id;

    const updateFields: Record<string, any> = {};
    if (email) updateFields.email = email;
    if (name) updateFields["profile.name"] = name;
    if (bio !== undefined) updateFields["profile.bio"] = bio;
    if (avatar !== undefined) updateFields["profile.avatar"] = avatar;
    if (city) updateFields["profile.city"] = city;
    if (pincode) updateFields["profile.pincode"] = pincode;
    if (area !== undefined) updateFields["profile.area"] = area;
    if (language) updateFields["profile.language"] = language;

    let updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true, upsert: true }
    ).lean();

    if (!updatedUser) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id.toString(),
        phone: updatedUser.phone,
        email: updatedUser.email,
        accountType: updatedUser.accountType,
        status: updatedUser.status,
        profile: updatedUser.profile,
        verificationSummary: updatedUser.verificationSummary
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getSavedLocations(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }
    res.status(200).json({
      success: true,
      data: req.user.savedLocations || []
    });
  } catch (error) {
    next(error);
  }
}

export async function addSavedLocation(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { label, address, area, pincode, isDefault } = req.body;
    if (!label || !address || !area || !pincode) {
      res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "label, address, area, and pincode are required" }
      });
      return;
    }

    const u = req.user;
    if (isDefault) {
      u.savedLocations.forEach((loc) => (loc.isDefault = false));
    }

    u.savedLocations.push({ label, address, area, pincode, isDefault: Boolean(isDefault) });
    await u.save();

    res.status(201).json({
      success: true,
      data: u.savedLocations
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSavedLocation(req: AuthenticatedUserRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User required" } });
      return;
    }

    const { locationId } = req.params;
    const u = req.user;

    u.savedLocations = u.savedLocations.filter((loc) => loc._id?.toString() !== locationId);
    await u.save();

    res.status(200).json({
      success: true,
      data: u.savedLocations
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(200).json({
        success: true,
        data: {
          id: userId,
          name: "Omeetso Seller",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80",
          city: "Hyderabad",
          area: "Madhapur",
          memberSince: "2024",
          accountType: "individual",
          verificationSummary: { identityVerified: true, phoneVerified: true, emailVerified: true }
        }
      });
      return;
    }

    const user = await User.findById(userId)
      .select("profile verificationSummary accountType createdAt")
      .lean();

    if (!user) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.profile.name,
        avatar: user.profile.avatar,
        city: user.profile.city,
        area: user.profile.area,
        memberSince: user.profile.memberSince,
        accountType: user.accountType,
        verificationSummary: user.verificationSummary
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminUsersList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const items = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.profile?.name || (u.phone ? `User (${u.phone})` : "Omeetso User"),
      mobile: u.phone,
      email: u.email || "",
      accountType: u.accountType || "individual",
      status: u.status?.toLowerCase() === "active" ? "active" : u.status?.toLowerCase() === "suspended" ? "suspended" : "active",
      role: u.accountType === "business" ? "business" : "seller",
      city: u.profile?.city || "Hyderabad",
      area: u.profile?.area || "Madhapur",
      verified: Boolean(u.verificationSummary?.mobileVerified),
      listingsCount: 0,
      createdAt: u.createdAt
    }));
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}
