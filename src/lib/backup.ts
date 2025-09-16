import prisma from "@/lib/prisma";
import { AuditService } from "./audit";
import { AuditAction } from "@/generated/prisma";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface BackupConfig {
  includeDatabase: boolean;
  includeFiles: boolean;
  includeUploads: boolean;
  compression: boolean;
}

export interface BackupResult {
  id: string;
  filename: string;
  size: number;
  checksum: string;
  createdAt: Date;
  status: "COMPLETED" | "FAILED";
  error?: string;
}

export class BackupService {
  private static readonly BACKUP_DIR = join(process.cwd(), "backups");

  static async createBackup(config: BackupConfig, userId: string): Promise<BackupResult> {
    try {
      // Ensure backup directory exists
      if (!existsSync(this.BACKUP_DIR)) {
        mkdirSync(this.BACKUP_DIR, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${timestamp}.sql`;
      const filepath = join(this.BACKUP_DIR, filename);

      let backupData = "";

      // Database backup
      if (config.includeDatabase) {
        const dbBackup = await this.backupDatabase();
        backupData += dbBackup + "\n\n";
      }

      // System configuration backup
      const configBackup = await this.backupConfiguration();
      backupData += configBackup + "\n\n";

      // Add metadata
      const metadata = {
        timestamp,
        version: "1.0.0",
        config,
        checksum: this.calculateChecksum(backupData),
      };

      backupData += `-- BACKUP METADATA\n-- ${JSON.stringify(metadata, null, 2)}\n`;

      // Write backup file
      writeFileSync(filepath, backupData);

      // Create database record
      const backupRecord = await prisma.backupRecord.create({
        data: {
          filename,
          location: filepath,
          size: backupData.length,
          checksum: metadata.checksum,
          status: "COMPLETED",
          createdBy: userId,
        },
      });

      // Log audit
      await AuditService.log({
        action: AuditAction.CREATE,
        resourceType: "backup",
        resourceId: backupRecord.id,
        severity: "INFO",
        metadata: {
          filename,
          size: backupData.length,
          config,
        },
        userId,
      });

      // Clean up old backups (keep last 10)
      await this.cleanupOldBackups();

      return {
        id: backupRecord.id,
        filename,
        size: backupData.length,
        checksum: metadata.checksum,
        createdAt: backupRecord.createdAt,
        status: "COMPLETED",
      };
    } catch (error) {
      console.error("Backup creation failed:", error);

      // Log error
      await AuditService.log({
        action: AuditAction.CREATE,
        resourceType: "backup",
        severity: "ERROR",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          config,
        },
        userId,
      });

      throw error;
    }
  }

  private static async backupDatabase(): Promise<string> {
    try {
      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL not found");
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);

      // Create pg_dump command
      const command = `pg_dump ${databaseUrl} --no-owner --no-privileges`;

      const output = execSync(command, { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 });

      return `-- DATABASE BACKUP\n-- Database: ${dbName}\n-- Generated: ${new Date().toISOString()}\n\n${output}`;
    } catch (error) {
      console.error("Database backup failed:", error);
      throw new Error(`Database backup failed: ${error}`);
    }
  }

  private static async backupConfiguration(): Promise<string> {
    try {
      const configs = await prisma.systemConfiguration.findMany();

      return `-- SYSTEM CONFIGURATION\n-- Generated: ${new Date().toISOString()}\n\n${JSON.stringify(configs, null, 2)}`;
    } catch (error) {
      console.error("Configuration backup failed:", error);
      throw new Error(`Configuration backup failed: ${error}`);
    }
  }

  private static calculateChecksum(data: string): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private static async cleanupOldBackups(): Promise<void> {
    try {
      const oldBackups = await prisma.backupRecord.findMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
        orderBy: { createdAt: "desc" },
        skip: 10, // Keep last 10 backups
      });

      for (const backup of oldBackups) {
        try {
          // Delete file
          if (existsSync(backup.location)) {
            require("fs").unlinkSync(backup.location);
          }

          // Delete database record
          await prisma.backupRecord.delete({
            where: { id: backup.id },
          });
        } catch (error) {
          console.error(`Failed to delete backup ${backup.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Backup cleanup failed:", error);
    }
  }

  static async getBackups(page: number = 1, limit: number = 20) {
    try {
      const [backups, total] = await Promise.all([
        prisma.backupRecord.findMany({
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.backupRecord.count(),
      ]);

      return {
        backups,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error getting backups:", error);
      throw error;
    }
  }

  static async restoreBackup(backupId: string, userId: string): Promise<boolean> {
    try {
      const backup = await prisma.backupRecord.findUnique({
        where: { id: backupId },
      });

      if (!backup || backup.status !== "COMPLETED") {
        throw new Error("Backup not found or not completed");
      }

      if (!existsSync(backup.location)) {
        throw new Error("Backup file not found");
      }

      const backupContent = readFileSync(backup.location, "utf8");

      // Verify checksum
      const currentChecksum = this.calculateChecksum(backupContent);
      if (currentChecksum !== backup.checksum) {
        throw new Error("Backup file integrity check failed");
      }

      // Restore database
      await this.restoreDatabase(backupContent);

      // Restore configuration
      await this.restoreConfiguration(backupContent);

      // Log audit
      await AuditService.log({
        action: AuditAction.UPDATE,
        resourceType: "backup_restore",
        resourceId: backupId,
        severity: "WARNING",
        metadata: {
          filename: backup.filename,
          size: backup.size,
        },
        userId,
      });

      return true;
    } catch (error) {
      console.error("Backup restore failed:", error);

      // Log error
      await AuditService.log({
        action: AuditAction.UPDATE,
        resourceType: "backup_restore",
        severity: "ERROR",
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          backupId,
        },
        userId,
      });

      throw error;
    }
  }

  private static async restoreDatabase(backupContent: string): Promise<void> {
    try {
      // Extract database backup section
      const dbMatch = backupContent.match(/-- DATABASE BACKUP\n-- Database: [^\n]+\n-- Generated: [^\n]+\n\n([\s\S]*?)(?=\n\n-- |\n\n$|$)/);
      if (!dbMatch) {
        throw new Error("Database backup section not found");
      }

      const dbBackup = dbMatch[1];

      // Write to temporary file
      const tempFile = join(this.BACKUP_DIR, "temp_restore.sql");
      writeFileSync(tempFile, dbBackup);

      // Restore using psql
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL not found");
      }

      execSync(`psql ${databaseUrl} < ${tempFile}`, {
        encoding: "utf8",
        maxBuffer: 100 * 1024 * 1024,
        stdio: "pipe",
      });

      // Clean up temp file
      if (existsSync(tempFile)) {
        require("fs").unlinkSync(tempFile);
      }
    } catch (error) {
      console.error("Database restore failed:", error);
      throw new Error(`Database restore failed: ${error}`);
    }
  }

  private static async restoreConfiguration(backupContent: string): Promise<void> {
    try {
      // Extract configuration section
      const configMatch = backupContent.match(/-- SYSTEM CONFIGURATION\n-- Generated: [^\n]+\n\n([\s\S]*?)(?=\n\n-- |\n\n$|$)/);
      if (!configMatch) {
        throw new Error("Configuration backup section not found");
      }

      const configBackup = configMatch[1];
      const configs = JSON.parse(configBackup);

      // Restore configurations
      for (const config of configs) {
        await prisma.systemConfiguration.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            type: config.type,
            description: config.description,
            category: config.category,
            isSensitive: config.isSensitive,
            isActive: config.isActive,
          },
          create: config,
        });
      }
    } catch (error) {
      console.error("Configuration restore failed:", error);
      throw new Error(`Configuration restore failed: ${error}`);
    }
  }

  static async deleteBackup(backupId: string, userId: string): Promise<boolean> {
    try {
      const backup = await prisma.backupRecord.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        throw new Error("Backup not found");
      }

      // Delete file
      if (existsSync(backup.location)) {
        require("fs").unlinkSync(backup.location);
      }

      // Delete database record
      await prisma.backupRecord.delete({
        where: { id: backupId },
      });

      // Log audit
      await AuditService.log({
        action: AuditAction.DELETE,
        resourceType: "backup",
        resourceId: backupId,
        severity: "INFO",
        metadata: {
          filename: backup.filename,
          size: backup.size,
        },
        userId,
      });

      return true;
    } catch (error) {
      console.error("Backup deletion failed:", error);
      throw error;
    }
  }
}