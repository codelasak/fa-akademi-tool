import prisma from "@/lib/prisma";

export interface ConfigValue {
  getString(): string;
  getNumber(): number;
  getBoolean(): boolean;
  getJSON<T = any>(): T;
  exists(): boolean;
}

class ConfigurationValue implements ConfigValue {
  constructor(private value: string | null) {}

  getString(): string {
    return this.value || "";
  }

  getNumber(): number {
    if (!this.value) return 0;
    const num = Number(this.value);
    return isNaN(num) ? 0 : num;
  }

  getBoolean(): boolean {
    if (!this.value) return false;
    return this.value.toLowerCase() === "true" || this.value === "1";
  }

  getJSON<T = any>(): T {
    if (!this.value) return {} as T;
    try {
      return JSON.parse(this.value);
    } catch {
      return {} as T;
    }
  }

  exists(): boolean {
    return this.value !== null && this.value !== undefined;
  }
}

class ConfigurationService {
  private cache = new Map<string, ConfigValue>();
  private lastFetch = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private async loadConfigurations() {
    const now = Date.now();
    if (now - this.lastFetch < this.CACHE_TTL) {
      return;
    }

    try {
      const configurations = await prisma.systemConfiguration.findMany({
        where: { isActive: true }
      });

      this.cache.clear();
      configurations.forEach((config: any) => {
        this.cache.set(config.key, new ConfigurationValue(config.value));
      });

      this.lastFetch = now;
    } catch (error) {
      console.error("Error loading configurations:", error);
    }
  }

  async get(key: string, defaultValue?: string): Promise<ConfigValue> {
    await this.loadConfigurations();
    return this.cache.get(key) || new ConfigurationValue(defaultValue || null);
  }

  async getString(key: string, defaultValue: string = ""): Promise<string> {
    return (await this.get(key, defaultValue)).getString();
  }

  async getNumber(key: string, defaultValue: number = 0): Promise<number> {
    const config = await this.get(key, defaultValue.toString());
    return config.getNumber();
  }

  async getBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
    const config = await this.get(key, defaultValue.toString());
    return config.getBoolean();
  }

  async getJSON<T = any>(key: string, defaultValue: T = {} as T): Promise<T> {
    const config = await this.get(key, JSON.stringify(defaultValue));
    return config.getJSON<T>();
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)).exists();
  }

  // Clear cache for forced refresh
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }

  // Get all configurations in a category
  async getCategory(category: string): Promise<Record<string, ConfigValue>> {
    await this.loadConfigurations();

    const result: Record<string, ConfigValue> = {};
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${category}.`)) {
        result[key] = value;
      }
    }

    return result;
  }

  // Get system information
  async getSystemInfo(): Promise<{
    name: string;
    version: string;
    environment: string;
    debug: boolean;
    maintenance: boolean;
  }> {
    return {
      name: await this.getString("system.name", "Fenavar Akademi"),
      version: await this.getString("system.version", "1.0.0"),
      environment: await this.getString("system.environment", "development"),
      debug: await this.getBoolean("system.debug", false),
      maintenance: await this.getBoolean("system.maintenance", false),
    };
  }

  // Get email configuration
  async getEmailConfig(): Promise<{
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
    };
    from: string;
    enabled: boolean;
  }> {
    return {
      smtp: {
        host: await this.getString("email.smtp.host"),
        port: await this.getNumber("email.smtp.port", 587),
        secure: await this.getBoolean("email.smtp.secure", false),
        user: await this.getString("email.smtp.user"),
        pass: await this.getString("email.smtp.pass"),
      },
      from: await this.getString("email.from"),
      enabled: await this.getBoolean("email.enabled", false),
    };
  }

  // Get security configuration
  async getSecurityConfig(): Promise<{
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    sessionTimeout: number;
    enableTwoFactor: boolean;
  }> {
    return {
      maxLoginAttempts: await this.getNumber("security.maxLoginAttempts", 5),
      lockoutDuration: await this.getNumber("security.lockoutDuration", 15 * 60 * 1000), // 15 minutes
      passwordMinLength: await this.getNumber("security.passwordMinLength", 8),
      requireStrongPassword: await this.getBoolean("security.requireStrongPassword", true),
      sessionTimeout: await this.getNumber("security.sessionTimeout", 30 * 60 * 1000), // 30 minutes
      enableTwoFactor: await this.getBoolean("security.enableTwoFactor", false),
    };
  }

  // Get backup configuration
  async getBackupConfig(): Promise<{
    enabled: boolean;
    schedule: string;
    retention: number;
    location: string;
    compression: boolean;
  }> {
    return {
      enabled: await this.getBoolean("backup.enabled", false),
      schedule: await this.getString("backup.schedule", "0 2 * * *"), // Daily at 2 AM
      retention: await this.getNumber("backup.retention", 30), // 30 days
      location: await this.getString("backup.location"),
      compression: await this.getBoolean("backup.compression", true),
    };
  }
}

// Export singleton instance
export const configService = new ConfigurationService();

// Export convenience functions for direct usage
export const getConfig = (key: string, defaultValue?: string) => configService.get(key, defaultValue);
export const getConfigString = (key: string, defaultValue?: string) => configService.getString(key, defaultValue);
export const getConfigNumber = (key: string, defaultValue?: number) => configService.getNumber(key, defaultValue);
export const getConfigBoolean = (key: string, defaultValue?: boolean) => configService.getBoolean(key, defaultValue);
export const getConfigJSON = <T = any>(key: string, defaultValue?: T) => configService.getJSON<T>(key, defaultValue);