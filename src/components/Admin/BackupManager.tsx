"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  DatabaseIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  RefreshIcon,
  CloudUploadIcon,
  FileIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "@/assets/icons";
import { useSession } from "next-auth/react";

interface BackupRecord {
  id: string;
  filename: string;
  size: number;
  checksum: string;
  status: string;
  type: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface BackupConfig {
  includeDatabase: boolean;
  includeFiles: boolean;
  includeUploads: boolean;
  compression: boolean;
}

export function BackupManager() {
  const { data: session } = useSession();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [config, setConfig] = useState<BackupConfig>({
    includeDatabase: true,
    includeFiles: false,
    includeUploads: false,
    compression: true,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadBackups = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/backup?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (error) {
      console.error("Error loading backups:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreatingBackup(true);
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        await loadBackups(pagination.page);
      } else {
        const error = await response.json();
        alert("Yedekleme başarısız: " + error.error);
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      alert("Yedekleme başarısız oldu");
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backup/${backupId}`, {
        method: "PUT",
      });

      if (response.ok) {
        alert("Yedek geri yükleme başarılı");
        setRestoreDialog(false);
        setSelectedBackup(null);
      } else {
        const error = await response.json();
        alert("Geri yükleme başarısız: " + error.error);
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      alert("Geri yükleme başarısız oldu");
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Bu yedeği silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/backup/${backupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadBackups(pagination.page);
      } else {
        const error = await response.json();
        alert("Silme başarısız: " + error.error);
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      alert("Silme başarısız oldu");
    }
  };

  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      const response = await fetch(`/api/admin/backup/${backupId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading backup:", error);
      alert("İndirme başarısız oldu");
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Yedek ve Geri Yükleme"
          subtitle="Sistem verilerinin yedeklenmesi ve geri yüklenmesi"
          actions={
            <Button
              onClick={createBackup}
              disabled={creatingBackup}
              leftIcon={<CloudUploadIcon className="h-4 w-4" />}
            >
              {creatingBackup ? "Yedekleniyor..." : "Yeni Yedek Oluştur"}
            </Button>
          }
        />
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Yedekleme Ayarları</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.includeDatabase}
                onChange={(e) => setConfig({ ...config, includeDatabase: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Veritabanı</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.includeFiles}
                onChange={(e) => setConfig({ ...config, includeFiles: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Dosyalar</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.includeUploads}
                onChange={(e) => setConfig({ ...config, includeUploads: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Yüklemeler</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config.compression}
                onChange={(e) => setConfig({ ...config, compression: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">Sıkıştırma</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Yedek Listesi"
          subtitle="Mevcut yedeklerin listesi"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadBackups()}
              leftIcon={<RefreshIcon className="h-4 w-4" />}
            >
              Yenile
            </Button>
          }
        />
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <FileIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium">{backup.filename}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{new Date(backup.createdAt).toLocaleString("tr-TR")}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <UserIcon className="h-4 w-4" />
                            <span>{backup.user.name}</span>
                          </span>
                          <span>{formatBytes(backup.size)}</span>
                          <span className="flex items-center space-x-1">
                            {backup.status === "completed" ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircleIcon className="h-4 w-4 text-red-500" />
                            )}
                            <span>{backup.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup.id, backup.filename)}
                        leftIcon={<DownloadIcon className="h-4 w-4" />}
                      >
                        İndir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup.id);
                          setRestoreDialog(true);
                        }}
                        leftIcon={<UploadIcon className="h-4 w-4" />}
                      >
                        Geri Yükle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBackup(backup.id)}
                        leftIcon={<TrashIcon className="h-4 w-4" />}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {backups.length === 0 && (
                <div className="text-center py-8">
                  <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Henüz hiç yedek bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} yedek
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadBackups(pagination.page - 1)}
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
                  onClick={() => loadBackups(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      {restoreDialog && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader
              title="Yedek Geri Yükleme"
              subtitle="Bu işlem mevcut verilerin üzerine yazacaktır. Emin misiniz?"
            />
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ⚠️ Geri yükleme işlemi, seçilen yedek dosyasındaki verilerle mevcut verileri değiştirecektir.
                  Bu işlem geri alınamaz.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRestoreDialog(false);
                      setSelectedBackup(null);
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={() => restoreBackup(selectedBackup)}
                  >
                    Geri Yükle
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}