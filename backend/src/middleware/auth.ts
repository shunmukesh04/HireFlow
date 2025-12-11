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
              // Default to STUDENT if no valid role found
              finalRole = "STUDENT";
            }
          } catch (err) {
            console.error(
              "Failed to fetch Clerk user metadata for existing user",
              err
            );
            // Default to STUDENT if we can't fetch metadata
            finalRole = "STUDENT";
          }
          needsUpdate = true;
        }

        // Update user if needed
        if (needsUpdate) {
          user.role = finalRole as "HR" | "STUDENT";
          await user.save();
          console.log(`Updated user ${clerkId} role to ${finalRole}`);

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
        `Auth successful for user ${clerkId} with role: ${user.role}`
      );
      next();
    } catch (e) {
      console.error("Auth Middleware Error", e);
      res.status(500).json({ message: "Auth Error" });
    }
  });
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.error("Authorize middleware: req.user is missing");
      res.status(403).json({ message: "Unauthorized - User not found" });
      return;
    }

    if (!req.user.role) {
      console.error("Authorize middleware: req.user.role is missing", req.user);
      res.status(403).json({ message: "Unauthorized - User role not set" });
      return;
    }

    // Normalize role comparison (case-insensitive)
    const userRole = String(req.user.role).trim().toUpperCase();
    const normalizedRoles = roles.map((r) => String(r).trim().toUpperCase());

    if (!normalizedRoles.includes(userRole)) {
      console.error(
        `Authorize middleware: Role "${userRole}" not in allowed roles: [${normalizedRoles.join(
          ", "
        )}]. User ID: ${req.user?.id}, Path: ${req.path}`
      );
      res.status(403).json({
        message: `Access denied: Your role "${userRole}" does not have permission to access this resource. Required role(s): ${roles.join(
          ", "
        )}. Please log in with the correct account.`,
        userRole: userRole,
        requiredRoles: roles,
        path: req.path,
      });
      return;
    }

    next();
  };
};
