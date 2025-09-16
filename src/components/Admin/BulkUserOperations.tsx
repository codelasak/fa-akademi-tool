"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UploadIcon, DownloadIcon, UserIcon, AlertCircleIcon, CheckCircleIcon } from "@/assets/icons";
import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma";

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
  details: any[];
}

interface UserData {
  id?: string;
  email: string;
  name: string;
  role?: UserRole;
  schoolId?: string;
  className?: string;
  isActive?: boolean;
}

export function BulkUserOperations() {
  const { data: session } = useSession();
  const [operation, setOperation] = useState<"create" | "update" | "deactivate" | "activate" | "delete">("create");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BulkOperationResult | null>(null);
  const [previewData, setPreviewData] = useState<UserData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = parseCSV(content);
        setPreviewData(data);
        setResults(null);
      } catch (error) {
        alert("Dosya okunamadı: " + error);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string): UserData[] => {
    const lines = content.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const users: UserData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const user: UserData = {
        email: "",
        name: "",
      };

      headers.forEach((header, index) => {
        const value = values[index];
        if (header === "email") user.email = value;
        else if (header === "name") user.name = value;
        else if (header === "role" && value) user.role = value as UserRole;
        else if (header === "schoolid") user.schoolId = value;
        else if (header === "classname") user.className = value;
        else if (header === "isactive") user.isActive = value.toLowerCase() === "true";
        else if (header === "id") user.id = value;
      });

      if (user.email && user.name) {
        users.push(user);
      }
    }

    return users;
  };

  const generateTemplate = () => {
    const headers = operation === "create"
      ? "email,name,role,schoolId,className,isActive"
      : "id,email,name,role,schoolId,className,isActive";

    const sampleData = operation === "create"
      ? `\nteacher1@school.com,John Doe,TEACHER,school1,Class A,true\nstudent1@school.com,Jane Smith,STUDENT,school1,Class B,true`
      : `\nexisting-id-1,teacher1@school.com,John Doe,TEACHER,school1,Class A,true\nexisting-id-2,student1@school.com,Jane Smith,STUDENT,school1,Class B,true`;

    const csvContent = headers + sampleData;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk_${operation}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkOperation = async () => {
    if (previewData.length === 0) {
      alert("Lütfen önce bir dosya yükleyin");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          users: previewData
        }),
      });

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error("Bulk operation error:", error);
      alert("İşlem başarısız oldu");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/export");
      const data = await response.json();

      const headers = "id,email,name,role,schoolId,className,isActive,createdAt";
      const csvContent = [
        headers,
        ...data.users.map((user: any) =>
          `${user.id},${user.email},${user.name},${user.role},${user.schoolId || ""},${user.className || ""},${user.isActive},${user.createdAt}`
        )
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Dışa aktarma başarısız oldu");
    }
  };

  const getOperationDescription = () => {
    const descriptions = {
      create: "Yeni kullanıcıları toplu olarak oluşturun",
      update: "Mevcut kullanıcı bilgilerini toplu olarak güncelleyin",
      deactivate: "Kullanıcıları toplu olarak devre dışı bırakın",
      activate: "Kullanıcıları toplu olarak etkinleştirin",
      delete: "Kullanıcıları toplu olarak silin",
    };
    return descriptions[operation];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Toplu Kullanıcı İşlemleri"
          subtitle={getOperationDescription()}
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportUsers}
                leftIcon={<DownloadIcon className="h-4 w-4" />}
              >
                Dışa Aktar
              </Button>
            </div>
          }
        />
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İşlem Türü
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { value: "create", label: "Oluştur" },
                  { value: "update", label: "Güncelle" },
                  { value: "deactivate", label: "Devre Dışı" },
                  { value: "activate", label: "Etkinleştir" },
                  { value: "delete", label: "Sil" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOperation(opt.value as any)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      operation === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CSV Dosyası
              </label>
              <div className="flex items-center space-x-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<UploadIcon className="h-4 w-4" />}
                >
                  Dosya Seç
                </Button>
                <Button
                  variant="outline"
                  onClick={generateTemplate}
                  leftIcon={<DownloadIcon className="h-4 w-4" />}
                >
                  Şablon İndir
                </Button>
              </div>
            </div>

            {previewData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Önizleme ({previewData.length} kullanıcı)
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Ad</th>
                          <th className="px-3 py-2 text-left">Rol</th>
                          <th className="px-3 py-2 text-left">Okul</th>
                          <th className="px-3 py-2 text-left">Sınıf</th>
                          <th className="px-3 py-2 text-left">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((user, index) => (
                          <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2">{user.email}</td>
                            <td className="px-3 py-2">{user.name}</td>
                            <td className="px-3 py-2">{user.role}</td>
                            <td className="px-3 py-2">{user.schoolId}</td>
                            <td className="px-3 py-2">{user.className}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                                {user.isActive ? "Aktif" : "Pasif"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {previewData.length > 5 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-2 text-center text-gray-500">
                              ... ve {previewData.length - 5} kullanıcı daha
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  İşlem Sonuçları
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {results.success}
                      </span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">Başarılı</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {results.failed}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">Başarısız</p>
                  </div>
                </div>

                {results.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Hatalar
                    </h4>
                    <ul className="space-y-1">
                      {results.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-sm text-red-600 dark:text-red-400">
                          • {error}
                        </li>
                      ))}
                      {results.errors.length > 10 && (
                        <li className="text-sm text-red-600 dark:text-red-400">
                          ... ve {results.errors.length - 10} hata daha
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleBulkOperation}
                disabled={isProcessing || previewData.length === 0}
              >
                {isProcessing ? "İşleniyor..." : "İşlemi Başlat"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}