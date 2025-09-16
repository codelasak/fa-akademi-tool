"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ActivityIcon,
  CpuIcon,
  DatabaseIcon,
  MemoryIcon,
  DiskIcon,
  RefreshIcon,
  UsersIcon,
  ZapIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from "@/assets/icons";

interface SystemMetrics {
  system: {
    uptime: number;
    memory: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
    cpu: {
      usage: number;
      cores: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      usage: number;
    };
    load: {
      "1m": number;
      "5m": number;
      "15m": number;
    };
  };
  database: {
    connections: number;
    maxConnections: number;
    size: number;
    queryTime: {
      avg: number;
      max: number;
    };
  };
  application: {
    uptime: number;
    memory: {
      used: number;
      peak: number;
    };
    requests: {
      total: number;
      perSecond: number;
      status: {
        "200": number;
        "404": number;
        "500": number;
        other: number;
      };
    };
  };
}

interface MetricHistory {
  timestamp: Date;
  metrics: SystemMetrics;
}

export function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<MetricHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/system/metrics?action=current");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/admin/system/metrics?action=history&hours=24");
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadHistory();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadMetrics();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getHealthStatus = (usage: number) => {
    if (usage < 70) return { color: "text-green-600", icon: TrendingUpIcon };
    if (usage < 90) return { color: "text-yellow-600", icon: ActivityIcon };
    return { color: "text-red-600", icon: TrendingDownIcon };
  };

  const getUsageColor = (usage: number) => {
    if (usage < 70) return "bg-green-500";
    if (usage < 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading && !metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Sistem Monitörü"
          subtitle="Sistem kaynakları ve performans metrikleri"
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? "Otomatik: Açık" : "Otomatik: Kapalı"}
              </Button>
              <Button
                size="sm"
                onClick={loadMetrics}
                leftIcon={<RefreshIcon className="h-4 w-4" />}
              >
                Yenile
              </Button>
            </div>
          }
        />
        <CardContent className="p-6">
          <div className="text-sm text-gray-500 mb-4">
            Son güncelleme: {lastUpdate?.toLocaleString("tr-TR") || "Yükleniyor..."}
          </div>
        </CardContent>
      </Card>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Usage */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CpuIcon className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    CPU Kullanımı
                  </span>
                </div>
                <span className={`text-lg font-bold ${getHealthStatus(metrics.system.cpu.usage).color}`}>
                  {metrics.system.cpu.usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metrics.system.cpu.usage)}`}
                  style={{ width: `${metrics.system.cpu.usage}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {metrics.system.cpu.cores} çekirdek
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MemoryIcon className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bellek Kullanımı
                  </span>
                </div>
                <span className={`text-lg font-bold ${getHealthStatus(metrics.system.memory.usage).color}`}>
                  {metrics.system.memory.usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metrics.system.memory.usage)}`}
                  style={{ width: `${metrics.system.memory.usage}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {formatBytes(metrics.system.memory.used)} / {formatBytes(metrics.system.memory.total)}
              </div>
            </CardContent>
          </Card>

          {/* Disk Usage */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <DiskIcon className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Disk Kullanımı
                  </span>
                </div>
                <span className={`text-lg font-bold ${getHealthStatus(metrics.system.disk.usage).color}`}>
                  {metrics.system.disk.usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getUsageColor(metrics.system.disk.usage)}`}
                  style={{ width: `${metrics.system.disk.usage}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {formatBytes(metrics.system.disk.used)} / {formatBytes(metrics.system.disk.total)}
              </div>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <DatabaseIcon className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Veritabanı
                  </span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {metrics.database.connections}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: `${(metrics.database.connections / metrics.database.maxConnections) * 100}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {formatBytes(metrics.database.size)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Details */}
          <Card>
            <CardHeader title="Sistem Detayları" />
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Çalışma Süresi</span>
                  <span className="text-sm font-medium">{formatUptime(metrics.system.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sistem Yükü (1m)</span>
                  <span className="text-sm font-medium">{metrics.system.load["1m"].toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sistem Yükü (5m)</span>
                  <span className="text-sm font-medium">{metrics.system.load["5m"].toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sistem Yükü (15m)</span>
                  <span className="text-sm font-medium">{metrics.system.load["15m"].toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uygulama Çalışma Süresi</span>
                  <span className="text-sm font-medium">{formatUptime(metrics.application.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">İstek/Saniye</span>
                  <span className="text-sm font-medium">{metrics.application.requests.perSecond.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Details */}
          <Card>
            <CardHeader title="Veritabanı Detayları" />
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Aktif Bağlantılar</span>
                  <span className="text-sm font-medium">{metrics.database.connections} / {metrics.database.maxConnections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Veritabanı Boyutu</span>
                  <span className="text-sm font-medium">{formatBytes(metrics.database.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ortalama Sorgu Süresi</span>
                  <span className="text-sm font-medium">{metrics.database.queryTime.avg.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Maksimum Sorgu Süresi</span>
                  <span className="text-sm font-medium">{metrics.database.queryTime.max.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Toplam İstekler</span>
                  <span className="text-sm font-medium">{metrics.application.requests.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request Status Distribution */}
      {metrics && (
        <Card>
          <CardHeader title="İstek Durum Dağılımı" />
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.application.requests.status["200"].toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">200 OK</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {metrics.application.requests.status["404"].toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">404 Not Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {metrics.application.requests.status["500"].toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">500 Server Error</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {metrics.application.requests.status["other"].toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Diğer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}