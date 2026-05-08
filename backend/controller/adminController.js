import Stats from "../models/statsModel.js";
import Property from "../models/propertyModel.js";
import TransactionRequest from "../models/transactionRequestModel.js";
import Payment from "../models/paymentModel.js";
import Appointment from "../models/appointmentModel.js";
import MaintenanceRequest from "../models/maintenanceRequestModel.js";
import User from "../models/userModel.js";
import RentLease from "../models/rentLeaseModel.js";
import RentDue from "../models/rentDueModel.js";
import AdminActivityLog from "../models/adminActivityLogModel.js";
import emailService from "../services/emailService.js";
import { getEmailTemplate, getListingApprovedTemplate, getListingRejectedTemplate } from "../email.js";
import { logAdminActivity } from "../utils/activityLogger.js";
import createCsvWriter from 'csv-writer';
import fs from 'fs';
import mongoose from 'mongoose';

const formatRecentProperties = (properties) => {
  return properties.map((property) => ({
    type: "property",
    description: `New property listed: ${property.title}`,
    timestamp: property.createdAt,
  }));
};

const formatRecentAppointments = (appointments) => {
  return appointments.map((appointment) => ({
    type: "appointment",
    description:
      appointment.userId && appointment.propertyId
        ? `${appointment.userId.name} scheduled viewing for ${appointment.propertyId.title}`
        : "Appointment scheduled (details unavailable)",
    timestamp: appointment.createdAt,
  }));
};

// Add these helper functions before the existing exports
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalProperties,
      activeListings,
      totalUsers,
      pendingAppointments,
      recentActivity,
      viewsData,
    ] = await Promise.all([
      Property.countDocuments().catch(() => 0),
      Property.countDocuments({ status: "active" }).catch(() => 0),
      User.countDocuments().catch(() => 0),
      Appointment.countDocuments({ status: "pending" }).catch(() => 0),
      getRecentActivity().catch(() => []),
      getViewsData().catch(() => ({ labels: [], datasets: [] })),
    ]);

    res.json({
      success: true,
      stats: {
        totalProperties,
        activeListings,
        totalUsers,
        pendingAppointments,
        recentActivity,
        viewsData,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin statistics",
    });
  }
};

// Lightweight counts for sidebar notification badges
export const getNavBadgeStats = async (req, res) => {
  try {
    const [
      pendingListings,
      pendingAppointments,
      openMaintenance,
      pendingTransactions,
      pendingPayments,
      pendingLeases,
      pendingFinanceAudits,
      flaggedUsers,
    ] = await Promise.all([
      Property.countDocuments({ status: "pending" }).catch(() => 0),
      Appointment.countDocuments({ status: "pending" }).catch(() => 0),
      MaintenanceRequest.countDocuments({
        status: { $in: ["open", "assigned", "in_progress"] },
      }).catch(() => 0),
      TransactionRequest.countDocuments({ status: "pending" }).catch(() => 0),
      Payment.countDocuments({ status: "pending" }).catch(() => 0),
      RentLease.countDocuments({ status: { $in: ["renewal_pending", "ending_pending"] } }).catch(() => 0),
      Promise.all([
        MaintenanceRequest.countDocuments({ status: "completed", auditStatus: "pending" }).catch(() => 0),
        Payment.countDocuments({ auditStatus: "pending" }).catch(() => 0),
        RentLease.countDocuments({ auditStatus: "pending" }).catch(() => 0),
        TransactionRequest.countDocuments({ auditStatus: "pending" }).catch(() => 0),
      ]).then((rows) => rows.reduce((sum, n) => sum + n, 0)),
      User.countDocuments({ status: { $in: ["suspended", "banned"] } }).catch(() => 0),
    ]);

    res.json({
      success: true,
      badges: {
        pendingListings,
        pendingAppointments,
        openMaintenance,
        pendingTransactions,
        pendingPayments,
        pendingLeases,
        pendingFinanceAudits,
        flaggedUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching nav badge stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nav badge stats",
    });
  }
};

export const getAllPropertiesForAdmin = async (req, res) => {
  try {
    const status = req.query.status;
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, property: properties });
  } catch (error) {
    console.error("Error fetching admin properties:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching properties",
    });
  }
};

const getRecentActivity = async () => {
  try {
    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt");

    const recentAppointments = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("propertyId", "title")
      .populate("userId", "name");

    // Filter out appointments with missing user or property data
    const validAppointments = recentAppointments.filter(
      (appointment) => appointment.userId && appointment.propertyId
    );

    return [
      ...formatRecentProperties(recentProperties),
      ...formatRecentAppointments(validAppointments),
    ].sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error getting recent activity:", error);
    return [];
  }
};

const getViewsData = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Stats.aggregate([
      {
        $match: {
          endpoint: /^\/api\/products\/single\//,
          method: "GET",
          timestamp: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Generate dates for last 30 days
    const labels = [];
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      labels.push(dateString);

      const stat = stats.find((s) => s._id === dateString);
      data.push(stat ? stat.count : 0);
    }

    return {
      labels,
      datasets: [
        {
          label: "Property Views",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  } catch (error) {
    console.error("Error generating chart data:", error);
    return {
      labels: [],
      datasets: [
        {
          label: "Property Views",
          data: [],
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }
};

// Add these new controller functions
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("propertyId", "title location")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
    });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true }
    ).populate("propertyId userId");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Send email notification
    try {
      await emailService.sendAppointmentStatusUpdate(
        appointment.userId.email,
        appointment,
        status
      );
    } catch (emailError) {
      console.error('Failed to send appointment status email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment",
    });
  }
};

// ── Admin listing review ──────────────────────────────────────────────────────

/** GET /api/admin/properties/pending — FIFO queue of user-submitted listings */
export const getPendingListings = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15; // Default 15 per page for admin review
    const skip = (page - 1) * limit;

    const query = { status: "pending" };

    // Get total count for pagination metadata
    const totalProperties = await Property.countDocuments(query);
    const totalPages = Math.ceil(totalProperties / limit);

    // Get properties with pagination
    const properties = await Property.find(query)
      .populate("postedBy", "name email")
      .sort({ createdAt: 1 }) // oldest first (FIFO)
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      properties,
      pagination: {
        currentPage: page,
        totalPages,
        totalProperties,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching pending listings:", error);
    res.status(500).json({ success: false, message: "Error fetching pending listings" });
  }
};

/** PUT /api/admin/properties/:id/approve — approve a pending listing */
export const approveListing = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate("postedBy", "name email");

    if (!property) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    property.status = "active";
    property.rejectionReason = "";
    await property.save();

    // Email the submitter
    if (property.postedBy?.email) {
      try {
        await emailService.sendListingApproved(
          property.postedBy.email,
          property.title,
          property._id.toString()
        );
      } catch (mailErr) {
        console.error("Approval email failed (non-fatal):", mailErr.message);
      }
    }

    res.json({ success: true, message: "Listing approved", property });
  } catch (error) {
    console.error("Error approving listing:", error);
    res.status(500).json({ success: false, message: "Error approving listing" });
  }
};

/** PUT /api/admin/properties/:id/reject — reject a pending listing */
export const rejectListing = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const property = await Property.findById(req.params.id).populate("postedBy", "name email");

    if (!property) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    property.status = "rejected";
    property.rejectionReason = reason.trim();
    await property.save();

    // Email the submitter
    if (property.postedBy?.email) {
      try {
        await emailService.sendListingRejected(
          property.postedBy.email,
          property.title,
          reason.trim()
        );
      } catch (mailErr) {
        console.error("Rejection email failed (non-fatal):", mailErr.message);
      }
    }

    res.json({ success: true, message: "Listing rejected", property });
  } catch (error) {
    console.error("Error rejecting listing:", error);
    res.status(500).json({ success: false, message: "Error rejecting listing" });
  }
};

// ── USER MANAGEMENT ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * Get all users with pagination, search, and filters
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const status = req.query.status; // active, suspended, banned, or undefined (all)
    const search = req.query.search?.trim();
    const sortBy = req.query.sortBy || 'createdAt'; // createdAt, lastActive, name
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};
    if (status && ['active', 'suspended', 'banned'].includes(status)) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count and status counts in parallel
    const [totalUsers, activeCount, suspendedCount, bannedCount] = await Promise.all([
      User.countDocuments(query),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'banned' })
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with sorting
    const users = await User.find(query)
      .select('-password -resetToken -resetTokenExpire') // Exclude sensitive fields
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .skip(skip);

    // Get property counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const propertyCount = await Property.countDocuments({ postedBy: user._id });
        return {
          ...user.toObject(),
          propertyCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit
      },
      statusCounts: {
        active: activeCount,
        suspended: suspendedCount,
        banned: bannedCount,
        total: activeCount + suspendedCount + bannedCount
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

/**
 * GET /api/admin/users/:id
 * Get detailed information about a specific user
 */
export const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password -resetToken -resetTokenExpire');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user's properties and appointments in parallel
    const [properties, appointments] = await Promise.all([
      Property.find({ postedBy: userId }).sort({ createdAt: -1 }),
      Appointment.find({ userId })
        .populate('propertyId', 'title location')
        .sort({ createdAt: -1 })
        .limit(20)
    ]);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        propertyCount: properties.length,
        appointmentCount: appointments.length
      },
      properties,
      appointments
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, message: "Error fetching user details" });
  }
};

/**
 * PUT /api/admin/users/:id/suspend
 * Suspend a user account temporarily
 */
export const suspendUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { days, reason } = req.body;

    // Validation
    if (!days || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: "Days must be between 1 and 365"
      });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Suspension reason is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Calculate suspension end date
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(days));

    // Update user status
    user.status = 'suspended';
    user.suspendedUntil = suspendedUntil;
    user.suspendReason = reason.trim();
    user.suspendedAt = new Date();
    user.suspendedBy = req.admin.email;
    await user.save();

    // Expire all active properties
    await Property.updateMany(
      { postedBy: userId, status: 'active' },
      { $set: { status: 'expired' } }
    );

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'suspend_user',
      'user',
      userId,
      user.name,
      { reason: reason.trim(), days: parseInt(days), suspendedUntil },
      req
    );

    // Send email notification (non-fatal)
    try {
      await emailService.sendUserSuspended(user.email, user.name, days, reason.trim(), suspendedUntil);
    } catch (mailErr) {
      console.error("Suspension email failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: `User suspended for ${days} days`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        suspendedUntil
      }
    });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ success: false, message: "Error suspending user" });
  }
};

/**
 * PUT /api/admin/users/:id/ban
 * Ban a user account permanently
 */
export const banUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ban reason is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user status
    user.status = 'banned';
    user.banReason = reason.trim();
    user.bannedAt = new Date();
    user.bannedBy = req.admin.email;
    await user.save();

    // Expire all active properties
    await Property.updateMany(
      { postedBy: userId, status: 'active' },
      { $set: { status: 'expired' } }
    );

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'ban_user',
      'user',
      userId,
      user.name,
      { reason: reason.trim() },
      req
    );

    // Send email notification (non-fatal)
    try {
      await emailService.sendUserBanned(user.email, user.name, reason.trim());
    } catch (mailErr) {
      console.error("Ban email failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: "User banned successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        bannedAt: user.bannedAt
      }
    });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ success: false, message: "Error banning user" });
  }
};

/**
 * PUT /api/admin/users/:id/unban
 * Unban a user account (reactivate)
 */
export const unbanUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.status !== 'banned' && user.status !== 'suspended') {
      return res.status(400).json({
        success: false,
        message: "User is not banned or suspended"
      });
    }

    // Clear ban/suspension fields
    user.status = 'active';
    user.banReason = undefined;
    user.suspendReason = undefined;
    user.bannedAt = undefined;
    user.suspendedAt = undefined;
    user.suspendedUntil = undefined;
    user.bannedBy = undefined;
    user.suspendedBy = undefined;
    await user.save();

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'unban_user',
      'user',
      userId,
      user.name,
      {},
      req
    );

    // Send email notification (non-fatal)
    try {
      await emailService.sendUserReactivated(user.email, user.name);
    } catch (mailErr) {
      console.error("Reactivation email failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: "User account reactivated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ success: false, message: "Error unbanning user" });
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Update user role (user <-> maintenance)
 */
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['user', 'maintenance', 'finance'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be one of: user, maintenance, finance",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active users can be assigned maintenance role',
      });
    }

    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: `User is already ${role === 'maintenance' ? 'maintenance staff' : 'a regular user'}`,
      });
    }

    const previousRole = user.role || 'user';
    user.role = role;
    await user.save();

    await logAdminActivity(
      req.admin.email,
      'update_user_role',
      'user',
      userId,
      user.name,
      { previousRole, newRole: role },
      req
    );

    return res.json({
      success: true,
      message:
        role === 'maintenance'
          ? 'User promoted to maintenance staff'
          : 'User changed back to regular role',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ success: false, message: 'Error updating user role' });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user account and all their data (cascade)
 */
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete all user's properties
    await Property.deleteMany({ postedBy: userId });

    // Delete all user's appointments
    await Appointment.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'delete_user',
      'user',
      userId,
      user.name,
      { email: user.email },
      req
    );

    res.json({
      success: true,
      message: "User and all associated data deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};


// ── BULK OPERATIONS ────────────────────────────────────────────────────────────

/**
 * POST /api/admin/users/bulk-suspend
 * Suspend multiple users at once
 */
export const bulkSuspendUsers = async (req, res) => {
  try {
    const { userIds, days, reason } = req.body;

    // Validation
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds array is required and cannot be empty"
      });
    }
    if (!days || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: "Days must be between 1 and 365"
      });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Suspension reason is required"
      });
    }

    // Limit bulk operations to prevent abuse
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend more than 100 users at once"
      });
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(days));

    // Bulk update users
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          status: 'suspended',
          suspendedUntil,
          suspendReason: reason.trim(),
          suspendedAt: new Date(),
          suspendedBy: req.admin.email
        }
      }
    );

    // Expire all properties from these users
    await Property.updateMany(
      { postedBy: { $in: userIds }, status: 'active' },
      { $set: { status: 'expired' } }
    );

    // Get affected users for email notifications
    const users = await User.find({ _id: { $in: userIds } }).select('name email');

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'bulk_suspend_users',
      'user',
      null,
      `${result.modifiedCount} users`,
      {
        reason: reason.trim(),
        days: parseInt(days),
        count: result.modifiedCount,
        affectedIds: userIds
      },
      req
    );

    // Send emails (non-fatal, use Promise.allSettled)
    try {
      await Promise.allSettled(
        users.map(user =>
          emailService.sendUserSuspended(user.email, user.name, days, reason.trim(), suspendedUntil)
        )
      );
    } catch (mailErr) {
      console.error("Bulk suspension emails failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} user(s) suspended successfully`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk suspending users:", error);
    res.status(500).json({ success: false, message: "Error suspending users" });
  }
};

/**
 * POST /api/admin/users/bulk-ban
 * Ban multiple users at once
 */
export const bulkBanUsers = async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    // Validation
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userIds array is required and cannot be empty"
      });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ban reason is required"
      });
    }

    // Limit bulk operations
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot ban more than 100 users at once"
      });
    }

    // Bulk update users
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $set: {
          status: 'banned',
          banReason: reason.trim(),
          bannedAt: new Date(),
          bannedBy: req.admin.email
        }
      }
    );

    // Expire all properties from these users
    await Property.updateMany(
      { postedBy: { $in: userIds }, status: 'active' },
      { $set: { status: 'expired' } }
    );

    // Get affected users for email notifications
    const users = await User.find({ _id: { $in: userIds } }).select('name email');

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'bulk_ban_users',
      'user',
      null,
      `${result.modifiedCount} users`,
      {
        reason: reason.trim(),
        count: result.modifiedCount,
        affectedIds: userIds
      },
      req
    );

    // Send emails (non-fatal)
    try {
      await Promise.allSettled(
        users.map(user =>
          emailService.sendUserBanned(user.email, user.name, reason.trim())
        )
      );
    } catch (mailErr) {
      console.error("Bulk ban emails failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} user(s) banned successfully`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk banning users:", error);
    res.status(500).json({ success: false, message: "Error banning users" });
  }
};

/**
 * POST /api/admin/properties/bulk-approve
 * Approve multiple properties at once
 */
export const bulkApproveProperties = async (req, res) => {
  try {
    const { propertyIds } = req.body;

    // Validation
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "propertyIds array is required and cannot be empty"
      });
    }

    // Limit bulk operations
    if (propertyIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot approve more than 100 properties at once"
      });
    }

    // Bulk update properties
    const result = await Property.updateMany(
      { _id: { $in: propertyIds } },
      {
        $set: { status: 'active', rejectionReason: '' }
      }
    );

    // Get affected properties with owner info for emails
    const properties = await Property.find({ _id: { $in: propertyIds } })
      .populate('postedBy', 'name email')
      .select('title postedBy _id');

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'bulk_approve_properties',
      'property',
      null,
      `${result.modifiedCount} properties`,
      {
        count: result.modifiedCount,
        affectedIds: propertyIds
      },
      req
    );

    // Send emails (non-fatal)
    try {
      await Promise.allSettled(
        properties.map(property => {
          if (property.postedBy?.email) {
            return emailService.sendListingApproved(
              property.postedBy.email,
              property.title,
              property._id.toString()
            );
          }
          return Promise.resolve();
        })
      );
    } catch (mailErr) {
      console.error("Bulk approval emails failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} property(ies) approved successfully`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk approving properties:", error);
    res.status(500).json({ success: false, message: "Error approving properties" });
  }
};

/**
 * POST /api/admin/properties/bulk-reject
 * Reject multiple properties at once
 */
export const bulkRejectProperties = async (req, res) => {
  try {
    const { propertyIds, reason } = req.body;

    // Validation
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "propertyIds array is required and cannot be empty"
      });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required"
      });
    }

    // Limit bulk operations
    if (propertyIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot reject more than 100 properties at once"
      });
    }

    // Bulk update properties
    const result = await Property.updateMany(
      { _id: { $in: propertyIds } },
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason.trim()
        }
      }
    );

    // Get affected properties with owner info
    const properties = await Property.find({ _id: { $in: propertyIds } })
      .populate('postedBy', 'name email')
      .select('title postedBy');

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'bulk_reject_properties',
      'property',
      null,
      `${result.modifiedCount} properties`,
      {
        reason: reason.trim(),
        count: result.modifiedCount,
        affectedIds: propertyIds
      },
      req
    );

    // Send emails (non-fatal)
    try {
      await Promise.allSettled(
        properties.map(property => {
          if (property.postedBy?.email) {
            return emailService.sendListingRejected(
              property.postedBy.email,
              property.title,
              reason.trim()
            );
          }
          return Promise.resolve();
        })
      );
    } catch (mailErr) {
      console.error("Bulk rejection emails failed (non-fatal):", mailErr.message);
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} property(ies) rejected successfully`,
      count: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk rejecting properties:", error);
    res.status(500).json({ success: false, message: "Error rejecting properties" });
  }
};

/**
 * POST /api/admin/properties/bulk-delete
 * Delete multiple properties at once
 */
export const bulkDeleteProperties = async (req, res) => {
  try {
    const { propertyIds } = req.body;

    // Validation
    if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "propertyIds array is required and cannot be empty"
      });
    }

    // Limit bulk operations
    if (propertyIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete more than 100 properties at once"
      });
    }

    // Bulk delete properties
    const result = await Property.deleteMany({ _id: { $in: propertyIds } });

    // Log activity
    await logAdminActivity(
      req.admin.email,
      'bulk_delete_properties',
      'property',
      null,
      `${result.deletedCount} properties`,
      {
        count: result.deletedCount,
        affectedIds: propertyIds
      },
      req
    );

    res.json({
      success: true,
      message: `${result.deletedCount} property(ies) deleted successfully`,
      count: result.deletedCount
    });
  } catch (error) {
    console.error("Error bulk deleting properties:", error);
    res.status(500).json({ success: false, message: "Error deleting properties" });
  }
};

// ── ACTIVITY LOGS ──────────────────────────────────────────────────────────────

/**
 * GET /api/admin/activity-logs
 * Get activity logs with pagination and filters
 */
export const getActivityLogs = async (req, res) => {
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      console.warn('Database not connected for getActivityLogs');
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        code: 'DB_NOT_CONNECTED'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query from filters
    const query = {};
    
    if (req.query.action) {
      query.action = req.query.action;
    }
    if (req.query.targetType) {
      query.targetType = req.query.targetType;
    }
    if (req.query.adminEmail) {
      query.adminEmail = req.query.adminEmail;
    }
   
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // Get total count
    const totalLogs = await AdminActivityLog.countDocuments(query);
    const totalPages = Math.ceil(totalLogs / limit);

    // Get logs
    const logs = await AdminActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      logs,
      pagination: {
        currentPage: page,
        totalPages,
        totalLogs,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ success: false, message: "Error fetching activity logs" });
  }
};

/**
 * GET /api/admin/activity-logs/export
 * Export activity logs as CSV
 */
export const exportActivityLogs = async (req, res) => {
  try {
    // Build query from filters (same as getActivityLogs)
    const query = {};
    
    if (req.query.action) query.action = req.query.action;
    if (req.query.targetType) query.targetType = req.query.targetType;
    if (req.query.adminEmail) query.adminEmail = req.query.adminEmail;
    
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) query.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) query.createdAt.$lte = new Date(req.query.endDate);
    }

    // Get all matching logs (limit to 10000 for performance)
    const logs = await AdminActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(10000);

    // Convert to CSV
    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: '/tmp/activity-logs.csv',
      header: [
        { id: 'createdAt', title: 'Timestamp' },
        { id: 'adminEmail', title: 'Admin' },
        { id: 'action', title: 'Action' },
        { id: 'targetType', title: 'Target Type' },
        { id: 'targetName', title: 'Target' },
        { id: 'reason', title: 'Reason' },
        { id: 'count', title: 'Count' },
        { id: 'ipAddress', title: 'IP Address' }
      ]
    });

    // Format records
    const records = logs.map(log => ({
      createdAt: log.createdAt.toISOString(),
      adminEmail: log.adminEmail,
      action: log.action,
      targetType: log.targetType,
      targetName: log.targetName || '',
      reason: log.metadata?.reason || '',
      count: log.metadata?.count || '',
      ipAddress: log.ipAddress
    }));

    await csvWriter.writeRecords(records);

    // Send file
    res.download('/tmp/activity-logs.csv', 'activity-logs.csv', (err) => {
      if (err) {
        console.error('CSV download error:', err);
      }
      // Clean up temp file
      try {
        fs.unlinkSync('/tmp/activity-logs.csv');
      } catch (unlinkErr) {
        console.error('Failed to delete temp file:', unlinkErr);
      }
    });
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    res.status(500).json({ success: false, message: "Error exporting activity logs" });
  }
};

// ── ENHANCED STATS ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats/users
 * Get user analytics and statistics
 */
export const getUserStats = async (req, res) => {
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      console.warn('Database not connected for getUserStats');
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        code: 'DB_NOT_CONNECTED'
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      bannedUsers,
      newUsersLast30Days,
      topUsers
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      User.countDocuments({ status: 'active' }).catch(() => 0),
      User.countDocuments({ status: 'suspended' }).catch(() => 0),
      User.countDocuments({ status: 'banned' }).catch(() => 0),
      // New users over time (last 30 days)
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),
      // Top users by property count
      Property.aggregate([
        {
          $match: { postedBy: { $ne: null } }
        },
        {
          $group: {
            _id: "$postedBy",
            propertyCount: { $sum: 1 }
          }
        },
        { $sort: { propertyCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            propertyCount: 1
          }
        }
      ]).catch(() => [])
    ]);

    // Format new users chart data (fill missing days with 0)
    const labels = [];
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      labels.push(dateString);
      
      const stat = newUsersLast30Days.find(s => s._id === dateString);
      data.push(stat ? stat.count : 0);
    }

    res.json({
      success: true,
      data: {
        Total: totalUsers,
        Active: activeUsers,
        Suspended: suspendedUsers,
        Banned: bannedUsers,
        newUsersByDay: newUsersLast30Days,
        newUsersChart: {
          labels,
          datasets: [{
            label: 'New Users',
            data,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        topUsers
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ success: false, message: "Error fetching user stats" });
  }
};

/**
 * GET /api/admin/stats/properties
 * Get property analytics and statistics
 */
export const getPropertyStats = async (req, res) => {
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      console.warn('Database not connected for getPropertyStats');
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        code: 'DB_NOT_CONNECTED'
      });
    }

    const [
      totalProperties,
      activeProperties,
      pendingProperties,
      rejectedProperties,
      expiredProperties,
      propertiesByType,
      topLocations,
      approvalRate
    ] = await Promise.all([
      Property.countDocuments().catch(() => 0),
      Property.countDocuments({ status: 'active' }).catch(() => 0),
      Property.countDocuments({ status: 'pending' }).catch(() => 0),
      Property.countDocuments({ status: 'rejected' }).catch(() => 0),
      Property.countDocuments({ status: 'expired' }).catch(() => 0),
      // Properties by type
      Property.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]).catch(() => []),
      // Top locations
      Property.aggregate([
        {
          $group: {
            _id: "$location",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).catch(() => []),
      // Calculate approval rate
      (async () => {
        const approved = await Property.countDocuments({ status: 'active', postedBy: { $ne: null } });
        const rejected = await Property.countDocuments({ status: 'rejected' });
        const total = approved + rejected;
        return total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
      })()
    ]);

    // Calculate average property price
    const priceAgg = await Property.aggregate([
      { $group: { _id: null, avgPrice: { $avg: "$price" } } }
    ]);
    const avgPrice = priceAgg[0]?.avgPrice || 0;

    res.json({
      success: true,
      data: {
        totalProperties,
        activeProperties,
        pendingCount: pendingProperties,
        rejectedCount: rejectedProperties,
        approvedCount: activeProperties,
        expiredProperties,
        avgPrice: Math.round(avgPrice),
        approvalRate: parseFloat(approvalRate),
        propertiesByType,
        topLocations
      }
    });
  } catch (error) {
    console.error("Error fetching property stats:", error);
    res.status(500).json({ success: false, message: "Error fetching property stats" });
  }
};

/**
 * Sum deal values from successful payments (source of truth for revenue).
 * Falls back to transaction/property values when amount is missing in legacy rows.
 */
const sumSuccessfulPaymentRevenue = async (extraMatch = {}, requestType = null) => {
  const txCollection = TransactionRequest.collection?.collectionName || "transactionrequests";
  const propertyCollection = Property.collection?.collectionName || "properties";
  const pipeline = [
    { $match: { status: "successful", ...extraMatch } },
    {
      $lookup: {
        from: txCollection,
        localField: "transaction",
        foreignField: "_id",
        as: "_tx",
      },
    },
    {
      $lookup: {
        from: propertyCollection,
        localField: "_tx.0.property",
        foreignField: "_id",
        as: "_prop",
      },
    },
    {
      $addFields: {
        amount: {
          $ifNull: [
            "$amount",
            {
              $ifNull: [
                { $arrayElemAt: ["$_tx.transactionValue", 0] },
                { $ifNull: [{ $arrayElemAt: ["$_prop.price", 0] }, 0] },
              ],
            },
          ],
        },
        requestType: { $ifNull: [{ $arrayElemAt: ["$_tx.requestType", 0] }, null] },
      },
    },
    {
      $match: requestType
        ? { requestType }
        : {
            requestType: { $in: ["rent", "buy"] },
          },
    },
    {
      $group: {
        _id: "$requestType",
        sum: { $sum: "$amount" },
      },
    },
  ];
  const rows = await Payment.aggregate(pipeline).catch(() => []);
  let rent = 0;
  let buy = 0;
  for (const row of rows) {
    if (row._id === "rent") rent = row.sum || 0;
    if (row._id === "buy") buy = row.sum || 0;
  }
  return { rent, buy, total: rent + buy };
};

/**
 * GET /api/admin/stats/overview
 * Get enhanced overview stats for dashboard
 */
export const getEnhancedOverview = async (req, res) => {
  try {
    // Check if database is connected
    if (!mongoose.connection.readyState) {
      console.warn('Database not connected for getEnhancedOverview');
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        code: 'DB_NOT_CONNECTED'
      });
    }

    // Get basic stats and enhanced metrics
    const [
      totalProperties,
      activeListings,
      pendingListings,
      totalUsers,
      pendingAppointments,
      totalPlatformValueActiveListings,
      avgPropertyPrice,
      appointmentCompletionRate,
      viewsData,
      transactionRevenue,
    ] = await Promise.all([
      Property.countDocuments().catch(() => 0),
      Property.countDocuments({ status: 'active' }).catch(() => 0),
      Property.countDocuments({ status: 'pending' }).catch(() => 0),
      User.countDocuments().catch(() => 0),
      Appointment.countDocuments({ status: 'pending' }).catch(() => 0),

      // Calculate total platform value (sum of all active property prices)
      Property.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]).then(result => result[0]?.total || 0).catch(() => 0),

      // Calculate average property price
      Property.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avg: { $avg: "$price" } } }
      ]).then(result => result[0]?.avg || 0).catch(() => 0),

      // Appointment completion rate
      (async () => {
        try {
          const total = await Appointment.countDocuments().catch(() => 0);
          const completed = await Appointment.countDocuments({ status: 'completed' }).catch(() => 0);
          return total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        } catch (error) {
          return 0;
        }
      })(),

      // Get views data for charts
      getViewsData().catch(() => ({ labels: [], datasets: [] })),

      sumSuccessfulPaymentRevenue({}).catch(() => ({ rent: 0, buy: 0, total: 0 })),
    ]);

    res.json({
      success: true,
      data: {
        totalProperties,
        activeListings,
        pendingListings,
        totalUsers,
        pendingAppointments,
        totalPlatformValue: totalPlatformValueActiveListings,
        avgPropertyPrice: avgPropertyPrice,
        appointmentCompletionRate: parseFloat(appointmentCompletionRate),
        viewsData,
        transactionRevenue,
      }
    });
  } catch (error) {
    console.error("Error fetching enhanced overview:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Error fetching enhanced overview" });
    }
  }
};

const transactionReportPopulate = [
  { path: "property", select: "title location status price" },
  { path: "requestedBy", select: "name email" },
];

/** Approved transactions + property rented/sold counts (existing models only). */
export const getTransactionReports = async (req, res) => {
  try {
    const { requestType, dateFrom, dateTo } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const listQuery = { status: "approved" };

    if (requestType === "rent" || requestType === "buy") {
      listQuery.requestType = requestType;
    }

    if (dateFrom || dateTo) {
      const range = {};
      if (dateFrom) {
        const from = new Date(String(dateFrom));
        if (!Number.isNaN(from.getTime())) range.$gte = from;
      }
      if (dateTo) {
        const to = new Date(String(dateTo));
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          range.$lte = to;
        }
      }
      if (Object.keys(range).length > 0) {
        listQuery.decidedAt = range;
      }
    }

    const revenueFilteredMatch = {};
    if (listQuery.decidedAt) revenueFilteredMatch.paidAt = listQuery.decidedAt;

    const [
      totalRows,
      totalAvailable,
      totalRented,
      totalSold,
      totalTransactions,
      revenueAllTime,
      revenueFiltered,
      transactions,
    ] = await Promise.all([
      TransactionRequest.countDocuments(listQuery),
      Property.countDocuments({ status: "active" }),
      Property.countDocuments({ status: "rented" }),
      Property.countDocuments({ status: "sold" }),
      TransactionRequest.countDocuments({ status: "approved" }),
      sumSuccessfulPaymentRevenue({}),
      sumSuccessfulPaymentRevenue(revenueFilteredMatch, listQuery.requestType || null),
      TransactionRequest.find(listQuery)
        .sort({ decidedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(transactionReportPopulate)
        .lean(),
    ]);

    const rows = transactions.map((t) => {
      const propPrice = t.property?.price;
      const amount =
        typeof t.transactionValue === "number" && !Number.isNaN(t.transactionValue)
          ? t.transactionValue
          : typeof propPrice === "number" && !Number.isNaN(propPrice)
            ? propPrice
            : 0;
      return {
        _id: t._id,
        property: t.property
          ? {
              _id: t.property._id,
              title: t.property.title,
              location: t.property.location,
              status: t.property.status,
              price: t.property.price,
            }
          : null,
        user: t.requestedBy
          ? { name: t.requestedBy.name, email: t.requestedBy.email }
          : null,
        requestType: t.requestType,
        status: t.status,
        date: t.decidedAt || t.updatedAt,
        amount,
      };
    });

    res.json({
      success: true,
      stats: {
        totalAvailable,
        totalRented,
        totalSold,
        totalTransactions,
      },
      revenue: {
        allTime: revenueAllTime,
        filtered: revenueFiltered,
      },
      transactions: rows,
      pagination: {
        page,
        limit,
        total: totalRows,
        totalPages: Math.ceil(totalRows / limit) || 0,
      },
    });
  } catch (error) {
    console.error("getTransactionReports error:", error);
    res.status(500).json({ success: false, message: "Failed to load transaction reports" });
  }
};

export const getReportSummary = async (req, res) => {
  try {
    const { requestType, dateFrom, dateTo } = req.query;
    const txQuery = {};
    if (requestType === "rent" || requestType === "buy") {
      txQuery.requestType = requestType;
    }

    const buildRange = () => {
      const range = {};
      if (dateFrom) {
        const from = new Date(String(dateFrom));
        if (!Number.isNaN(from.getTime())) range.$gte = from;
      }
      if (dateTo) {
        const to = new Date(String(dateTo));
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          range.$lte = to;
        }
      }
      return Object.keys(range).length ? range : null;
    };
    const range = buildRange();

    const viewsQuery = { endpoint: /^\/api\/products\/single\//, method: "GET" };
    const appointmentsQuery = {};
    const transactionsBaseQuery = { ...txQuery };
    const paymentsBaseQuery = {};
    if (range) {
      viewsQuery.timestamp = range;
      appointmentsQuery.createdAt = range;
      transactionsBaseQuery.createdAt = range;
      paymentsBaseQuery.createdAt = range;
    }

    const [
      views,
      appointments,
      transactionRequests,
      approvedTransactions,
      paymentProofsSubmitted,
      rentedCount,
      soldCount,
      paymentsPending,
      paymentsSuccessful,
      paymentsFailed,
      paymentReviewRows,
      leaseStatusRows,
      dueSoon,
      overdueDues,
      maintenanceCounts,
      assignmentAgg,
      completionAgg,
      materialTotalsAgg,
      maintenanceAuditRows,
      pendingMaintenanceAudits,
      pendingPaymentAudits,
      pendingLeaseAudits,
      pendingTransactionAudits,
      reviewedMaintenance,
      reviewedPayments,
      reviewedLeases,
      reviewedTransactions,
      suspendedCount,
      bannedCount,
      moderationActions,
    ] = await Promise.all([
      Stats.countDocuments(viewsQuery),
      Appointment.countDocuments(appointmentsQuery),
      TransactionRequest.countDocuments(transactionsBaseQuery),
      TransactionRequest.countDocuments({ ...transactionsBaseQuery, status: "approved" }),
      Payment.countDocuments(paymentsBaseQuery),
      Property.countDocuments({ status: "rented" }),
      Property.countDocuments({ status: "sold" }),
      Payment.countDocuments({ ...paymentsBaseQuery, status: "pending" }),
      Payment.countDocuments({ ...paymentsBaseQuery, status: "successful" }),
      Payment.countDocuments({ ...paymentsBaseQuery, status: "failed" }),
      Payment.find({ status: { $in: ["successful", "failed"] }, paidAt: { $ne: null }, ...paymentsBaseQuery })
        .select("submittedAt paidAt")
        .lean(),
      RentLease.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      RentDue.countDocuments({
        status: "pending",
        dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      }),
      RentDue.countDocuments({
        $or: [
          { status: "overdue" },
          { status: "pending", dueDate: { $lt: new Date() } },
        ],
      }),
      MaintenanceRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      MaintenanceRequest.aggregate([
        { $match: { assignedAt: { $ne: null } } },
        { $project: { diff: { $subtract: ["$assignedAt", "$createdAt"] } } },
        { $group: { _id: null, avgMs: { $avg: "$diff" } } },
      ]),
      MaintenanceRequest.aggregate([
        { $match: { completedAt: { $ne: null } } },
        { $project: { diff: { $subtract: ["$completedAt", "$createdAt"] } } },
        { $group: { _id: null, avgMs: { $avg: "$diff" } } },
      ]),
      MaintenanceRequest.aggregate([
        { $match: { materialsTotal: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$materialsTotal" } } },
      ]),
      MaintenanceRequest.aggregate([{ $group: { _id: "$auditStatus", count: { $sum: 1 } } }]),
      MaintenanceRequest.countDocuments({ status: "completed", auditStatus: "pending" }),
      Payment.countDocuments({ auditStatus: "pending" }),
      RentLease.countDocuments({ auditStatus: "pending" }),
      TransactionRequest.countDocuments({ auditStatus: "pending" }),
      MaintenanceRequest.find({ auditReviewedAt: { $ne: null } }).select("createdAt auditReviewedAt").lean(),
      Payment.find({ auditReviewedAt: { $ne: null } }).select("createdAt auditReviewedAt").lean(),
      RentLease.find({ auditReviewedAt: { $ne: null } }).select("createdAt auditReviewedAt").lean(),
      TransactionRequest.find({ auditReviewedAt: { $ne: null } }).select("createdAt auditReviewedAt").lean(),
      User.countDocuments({ status: "suspended" }),
      User.countDocuments({ status: "banned" }),
      AdminActivityLog.countDocuments({
        action: { $in: ["suspend_user", "ban_user", "bulk_suspend_users", "bulk_ban_users"] },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    const closedDeals = rentedCount + soldCount;
    const toPct = (n, d) => (d > 0 ? Number(((n / d) * 100).toFixed(1)) : 0);
    const avgHoursFromRows = (rows) => {
      if (!rows?.length) return 0;
      const totalMs = rows.reduce((sum, row) => sum + (new Date(row.paidAt) - new Date(row.submittedAt)), 0);
      return Number((totalMs / rows.length / (1000 * 60 * 60)).toFixed(2));
    };
    const avgAuditHours = (rows) => {
      if (!rows?.length) return 0;
      const totalMs = rows.reduce(
        (sum, row) => sum + (new Date(row.auditReviewedAt) - new Date(row.createdAt)),
        0
      );
      return Number((totalMs / rows.length / (1000 * 60 * 60)).toFixed(2));
    };
    const mapCounts = (rows) =>
      rows.reduce((acc, row) => {
        acc[row._id || "unknown"] = row.count;
        return acc;
      }, {});

    const leaseCounts = mapCounts(leaseStatusRows);
    const maintenanceStatusCounts = mapCounts(maintenanceCounts);
    const maintenanceAuditCounts = mapCounts(maintenanceAuditRows);
    const [pendingLt24h, pending24To72h, pendingGt72h] = await Promise.all([
      Payment.countDocuments({
        status: "pending",
        submittedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        ...paymentsBaseQuery,
      }),
      Payment.countDocuments({
        status: "pending",
        submittedAt: {
          $lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          $gte: new Date(Date.now() - 72 * 60 * 60 * 1000),
        },
        ...paymentsBaseQuery,
      }),
      Payment.countDocuments({
        status: "pending",
        submittedAt: { $lt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
        ...paymentsBaseQuery,
      }),
    ]);

    const reviewedAuditRows = [
      ...reviewedMaintenance,
      ...reviewedPayments,
      ...reviewedLeases,
      ...reviewedTransactions,
    ];

    return res.json({
      success: true,
      summary: {
        funnel: {
          views,
          appointmentRequests: appointments,
          transactionRequests,
          paymentProofsSubmitted,
          approvedTransactions,
          closedDeals,
          conversion: {
            viewsToAppointmentsPct: toPct(appointments, views),
            appointmentsToTransactionsPct: toPct(transactionRequests, appointments),
            transactionsToApprovalsPct: toPct(approvedTransactions, transactionRequests),
            approvalsToClosedPct: toPct(closedDeals, approvedTransactions),
          },
        },
        paymentVerification: {
          pending: {
            total: paymentsPending,
            lt24h: pendingLt24h,
            h24to72: pending24To72h,
            gt72h: pendingGt72h,
          },
          successful: paymentsSuccessful,
          failed: paymentsFailed,
          approvalRatePct: toPct(paymentsSuccessful, paymentsSuccessful + paymentsFailed),
          avgReviewHours: avgHoursFromRows(paymentReviewRows),
        },
        leaseHealth: {
          active: leaseCounts.active || 0,
          renewalPending: leaseCounts.renewal_pending || 0,
          endingPending: leaseCounts.ending_pending || 0,
          ended: leaseCounts.ended || 0,
          dueIn7Days: dueSoon,
          overdue: overdueDues,
        },
        maintenanceOps: {
          open: maintenanceStatusCounts.open || 0,
          assigned: maintenanceStatusCounts.assigned || 0,
          inProgress: maintenanceStatusCounts.in_progress || 0,
          completed: maintenanceStatusCounts.completed || 0,
          avgAssignHours: Number(((assignmentAgg[0]?.avgMs || 0) / (1000 * 60 * 60)).toFixed(2)),
          avgCompletionHours: Number(((completionAgg[0]?.avgMs || 0) / (1000 * 60 * 60)).toFixed(2)),
          materialsTotal: materialTotalsAgg[0]?.total || 0,
          auditMix: {
            pending: maintenanceAuditCounts.pending || 0,
            approved: maintenanceAuditCounts.approved || 0,
            rejected: maintenanceAuditCounts.rejected || 0,
          },
        },
        financeAudit: {
          pendingMaintenance: pendingMaintenanceAudits,
          pendingPayments: pendingPaymentAudits,
          pendingLeases: pendingLeaseAudits,
          pendingTransactions: pendingTransactionAudits,
          pendingTotal:
            pendingMaintenanceAudits + pendingPaymentAudits + pendingLeaseAudits + pendingTransactionAudits,
          avgTurnaroundHours: avgAuditHours(reviewedAuditRows),
        },
        riskModeration: {
          suspendedUsers: suspendedCount,
          bannedUsers: bannedCount,
          flaggedUsersTotal: suspendedCount + bannedCount,
          moderationActionsLast30Days: moderationActions,
        },
      },
    });
  } catch (error) {
    console.error("getReportSummary error:", error);
    return res.status(500).json({ success: false, message: "Failed to load report summary" });
  }
};