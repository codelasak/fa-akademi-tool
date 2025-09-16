import prisma from "@/lib/prisma";
import { AuditService } from "./audit";
import { AuditAction } from "@/generated/prisma";
import bcrypt from "bcryptjs";

export class PasswordResetService {
  static async createResetToken(email: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        return null;
      }

      const token = Math.random().toString(36).substring(2, 15) +
                   Math.random().toString(36).substring(2, 15);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      await AuditService.log({
        action: AuditAction.CREATE,
        resourceType: "password_reset_token",
        resourceId: user.id,
        severity: "INFO",
        metadata: { email },
        userId: user.id,
      });

      return token;
    } catch (error) {
      console.error("Error creating reset token:", error);
      return null;
    }
  }

  static async validateResetToken(token: string) {
    try {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || !resetToken.user.isActive) {
        return null;
      }

      if (resetToken.expiresAt < new Date()) {
        await prisma.passwordResetToken.delete({
          where: { id: resetToken.id },
        });
        return null;
      }

      return resetToken.user;
    } catch (error) {
      console.error("Error validating reset token:", error);
      return null;
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.validateResetToken(token);
      if (!user) {
        return false;
      }

      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      await AuditService.log({
        action: AuditAction.UPDATE,
        resourceType: "user_password",
        resourceId: user.id,
        severity: "INFO",
        metadata: { email: user.email },
        userId: user.id,
      });

      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }

  static async cleanupExpiredTokens() {
    try {
      const result = await prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired password reset tokens`);
      return result.count;
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      return 0;
    }
  }
}