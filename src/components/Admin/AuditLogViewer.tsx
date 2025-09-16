"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FilterIcon, DownloadIcon, SearchIcon, CalendarIcon } from "@/assets/icons";
import { useSession } from "next-auth/react";
import { AuditAction, AuditSeverity } from "@/generated/prisma";

interface AuditLog {
  id: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  oldValues?: string;
  newValues?: string;
  severity: AuditSeverity;
  metadata?: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  userAgent?: string;
  ipAddress?: string;
}

interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  severity?: AuditSeverity;
  startDate?: string;
  endDate?: string;
}

interface AuditSummary {
  actionCounts: { action: AuditAction; _count: { action: number } }[];
  severityCounts: { severity: AuditSeverity; _count: { severity: number } }[];
  userActivity: any[];
  resourceTypes: { resourceType: string; _count: { resourceType: number } }[];
}

export function AuditLogViewer() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
        ),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error loading audit summary:", error);
    }
  };

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, [filters]);

  const getSeverityColor = (severity: AuditSeverity) => {
    const colors = {
      [AuditSeverity.DEBUG]: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      [AuditSeverity.INFO]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      [AuditSeverity.WARNING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      [AuditSeverity.ERROR]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      [AuditSeverity.CRITICAL]: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
    };
    return colors[severity] || colors.INFO;
  };

  const getActionColor = (action: AuditAction) => {
    const colors = {
      [AuditAction.CREATE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      [AuditAction.UPDATE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      [AuditAction.DELETE]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      [AuditAction.LOGIN]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      [AuditAction.LOGOUT]: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      [AuditAction.EXPORT]: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      [AuditAction.IMPORT]: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      [AuditAction.BULK_OPERATION]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      [AuditAction.SYSTEM_CHANGE]: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      [AuditAction.SECURITY_EVENT]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[action] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const formatJson = (jsonString?: string) => {
    if (!jsonString) return "-";
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        format: "csv",
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== "")
        ),
      });

      const response = await fetch(`/api/admin/audit-logs/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting logs:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Denetim Kayıtları"
          subtitle="Sistemdeki tüm işlemlerin takip edildiği denetim logları"
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<FilterIcon className="h-4 w-4" />}
              >
                Filtreler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                leftIcon={<DownloadIcon className="h-4 w-4" />}
              >
                Dışa Aktar
              </Button>
              <Button
                size="sm"
                onClick={() => loadLogs()}
                leftIcon={<SearchIcon className="h-4 w-4" />}
              >
                Yenile
              </Button>
            </div>
          }
        />
      </Card>

      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kullanıcı ID
                </label>
                <input
                  type="text"
                  value={filters.userId || ""}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  İşlem Türü
                </label>
                <select
                  value={filters.action || ""}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value as AuditAction })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tümü</option>
                  {Object.values(AuditAction).map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Önem Düzeyi
                </label>
                <select
                  value={filters.severity || ""}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value as AuditSeverity })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Tümü</option>
                  {Object.values(AuditSeverity).map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kaynak Türü
                </label>
                <input
                  type="text"
                  value={filters.resourceType || ""}
                  onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Özet</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İşlem Dağılımı
                </h4>
                <div className="space-y-1">
                  {summary.actionCounts.slice(0, 5).map((item) => (
                    <div key={item.action} className="flex justify-between text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getActionColor(item.action)}`}>
                        {item.action}
                      </span>
                      <span className="font-medium">{item._count.action}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Önem Düzeyi
                </h4>
                <div className="space-y-1">
                  {summary.severityCounts.map((item) => (
                    <div key={item.severity} className="flex justify-between text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </span>
                      <span className="font-medium">{item._count.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  En Aktif Kullanıcılar
                </h4>
                <div className="space-y-1">
                  {summary.userActivity.slice(0, 5).map((item) => (
                    <div key={item.userId} className="text-sm">
                      <div className="font-medium">{item.user?.name || "Unknown"}</div>
                      <div className="text-gray-500">{item._count.userId} işlem</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kaynak Türleri
                </h4>
                <div className="space-y-1">
                  {summary.resourceTypes.slice(0, 5).map((item) => (
                    <div key={item.resourceType} className="flex justify-between text-sm">
                      <span>{item.resourceType}</span>
                      <span className="font-medium">{item._count.resourceType}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {log.resourceType}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {log.user.name} ({log.user.email})
                    </span>
                    {log.resourceId && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        ID: {log.resourceId}
                      </span>
                    )}
                  </div>

                  {(log.oldValues || log.newValues) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {log.oldValues && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Önceki Değerler
                          </h4>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {formatJson(log.oldValues)}
                          </pre>
                        </div>
                      )}
                      {log.newValues && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Yeni Değerler
                          </h4>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {formatJson(log.newValues)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {log.ipAddress && (
                      <span>IP: {log.ipAddress}</span>
                    )}
                    {log.userAgent && (
                      <span className="truncate">{log.userAgent}</span>
                    )}
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Belirtilen filtrelere uygun denetim kaydı bulunamadı.
                  </p>
                </div>
              )}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} kayıt
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Önceki
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sayfa {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}