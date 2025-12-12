import { Request, Response, NextFunction } from "express";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { User } from "../models/index";

// Extending Express Request to include 'auth' property form Clerk
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        getToken: () => Promise<string | null>;
      };
      user?: any; // For backward compatibility with our controllers
    }
  }
}

// Export AuthRequest interface for controllers
export interface AuthRequest extends Request {
  user?: any; // or define specific User type
  file?: Express.Multer.File; // For file uploads
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized - No Bearer Token" });
    return;
  }

  const clerkMiddleware = ClerkExpressWithAuth();

  clerkMiddleware(req as any, res as any, async () => {
    if (!req.auth || !req.auth.userId) {
      console.error("Clerk Middleware Auth Failed", req.auth);
      res.status(401).json({ message: "Unauthorized - No Clerk Token" });
      return;
    }

    try {
      // Sync User to MongoDB
      const clerkId = req.auth.userId;
      let user = await User.findOne({ clerkId });
      const { clerkClient } = require("@clerk/clerk-sdk-node");

      if (!user) {
        // Creating a shell user profile if valid auth but no DB record
        // Check Clerk user metadata for role
        let assignedRole = "STUDENT"; // Default to STUDENT

        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          // Check unsafeMetadata or publicMetadata for role
          const metadataRole =
            clerkUser.unsafeMetadata?.role || clerkUser.publicMetadata?.role;
          if (metadataRole === "HR" || metadataRole === "STUDENT") {
            assignedRole = metadataRole;
          }
        } catch (err) {
          console.error("Failed to fetch Clerk user metadata", err);
        }

        user = await User.create({
          clerkId,
          email: "clerk-user@placeholder.com",
          role: assignedRole,
        });
        console.log(
          `Created new JIT user for ${clerkId} with role: ${assignedRole}`
        );

        // Sync Role to Clerk Public Metadata for Frontend use
        try {
          await clerkClient.users.updateUser(clerkId, {
            publicMetadata: { role: assignedRole },
          });
        } catch (err) {
          console.error("Failed to sync role to Clerk Metadata", err);
        }
      } else {
        // Ensure existing user has a valid role
        let needsUpdate = false;
        let finalRole = user.role;

        // Check if role is missing or invalid
        if (!user.role || (user.role !== "HR" && user.role !== "STUDENT")) {
          // Try to get role from Clerk metadata first
          try {
            const clerkUser = await clerkClient.users.getUser(clerkId);
            const metadataRole =
              clerkUser.unsafeMetadata?.role || clerkUser.publicMetadata?.role;
            if (metadataRole === "HR" || metadataRole === "STUDENT") {
              finalRole = metadataRole;
            } else {
              // Auto-detect role based on user's data in MongoDB
              const { Company, Job } = require("../models/index");
              const hasCompany = await Company.findOne({ createdBy: user._id });
              const hasJobs = await Job.findOne({ postedBy: user._id });
              
              if (hasCompany || hasJobs) {
                finalRole = "HR";
                console.log(`🔍 Auto-detected HR role for user ${clerkId} (has company/jobs)`);
              } else {
                finalRole = "STUDENT";
              }
            }
          } catch (err) {
            console.error(
              "Failed to fetch Clerk user metadata for existing user",
              err
            );
            // Auto-detect role based on user's data in MongoDB
            try {
              const { Company, Job } = require("../models/index");
              const hasCompany = await Company.findOne({ createdBy: user._id });
              const hasJobs = await Job.findOne({ postedBy: user._id });
              
              if (hasCompany || hasJobs) {
                finalRole = "HR";
                console.log(`🔍 Auto-detected HR role for user ${clerkId} (has company/jobs)`);
              } else {
                finalRole = "STUDENT";
              }
            } catch (detectErr) {
              console.error("Error auto-detecting role:", detectErr);
              finalRole = "STUDENT";
            }
          }
          needsUpdate = true;
        } else {
          // Even if role exists, check if it's correct based on user's data
          // If user has companies/jobs but role is STUDENT, they should be HR
          if (user.role === "STUDENT") {
            try {
              const { Company, Job } = require("../models/index");
              const hasCompany = await Company.findOne({ createdBy: user._id });
              const hasJobs = await Job.findOne({ postedBy: user._id });
              
              if (hasCompany || hasJobs) {
                finalRole = "HR";
                needsUpdate = true;
                console.log(`🔧 Auto-fixing role: User ${clerkId} has companies/jobs but role is STUDENT, updating to HR`);
              }
            } catch (err) {
              console.error("Error checking user data for role fix:", err);
            }
          }
        }

        // Update user if needed
        if (needsUpdate) {
          user.role = finalRole as "HR" | "STUDENT";
          await user.save();
          console.log(`✅ Updated user ${clerkId} role to ${finalRole}`);

          // Sync Role to Clerk Public Metadata
          try {
            await clerkClient.users.updateUser(clerkId, {
              publicMetadata: { role: finalRole },
            });
          } catch (err) {
            console.error("Failed to sync role to Clerk Metadata", err);
          }
        }
      }

      // Ensure role is set before proceeding
      if (!user.role) {
        console.error(`User ${clerkId} has no role set after all attempts`);
        res.status(403).json({ message: "User role not properly configured" });
        return;
      }

      req.user = { id: user.clerkId, role: user.role, mongoId: user._id };
      console.log(
        `✅ Auth successful for user ${clerkId} with role: ${user.role} (MongoDB ID: ${user._id})`
      );
      next();
    } catch (e) {
      console.error("Auth Middleware Error", e);
      res.status(500).json({ message: "Auth Error" });
    }
  });
};

export const authorize = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.error("❌ Authorize middleware: req.user is missing");
      res.status(403).json({ message: "Unauthorized - User not found" });
      return;
    }

    if (!req.user.role) {
      console.error("❌ Authorize middleware: req.user.role is missing", req.user);
      res.status(403).json({ message: "Unauthorized - User role not set" });
      return;
    }

    // Normalize role comparison (case-insensitive)
    const userRole = String(req.user.role).trim().toUpperCase();
    const normalizedRoles = roles.map((r) => String(r).trim().toUpperCase());

    console.log(`🔐 Authorization check: User role="${userRole}", Required roles=[${normalizedRoles.join(", ")}], Path=${req.path}`);

    if (!normalizedRoles.includes(userRole)) {
      // Try to refresh user role from MongoDB in case it was updated
      try {
        const { User } = require("../models/index");
        const mongoUser = await User.findById(req.user.mongoId);
        if (mongoUser && mongoUser.role) {
          const refreshedRole = String(mongoUser.role).trim().toUpperCase();
          console.log(`🔄 Refreshed user role from MongoDB: ${refreshedRole}`);
          
          if (normalizedRoles.includes(refreshedRole)) {
            // Update req.user with refreshed role
            req.user.role = mongoUser.role;
            console.log(`✅ Role refreshed, access granted`);
            next();
            return;
          }
        }
      } catch (refreshError) {
        console.error("Error refreshing user role:", refreshError);
      }

      console.error(
        `❌ Access denied: Role "${userRole}" not in allowed roles: [${normalizedRoles.join(
          ", "
        )}]. User ID: ${req.user?.id}, Path: ${req.path}`
      );
      res.status(403).json({
        message: `Access denied: Your role "${userRole}" does not have permission to access this resource. Required role(s): ${roles.join(
          ", "
        )}. Please ensure your account has the correct role set in MongoDB.`,
        userRole: userRole,
        requiredRoles: roles,
        path: req.path,
        hint: "If you believe this is an error, check your user role in MongoDB. HR users should have role='HR' and Students should have role='STUDENT'."
      });
      return;
    }

    console.log(`✅ Authorization granted for role: ${userRole}`);
    next();
  };
};
