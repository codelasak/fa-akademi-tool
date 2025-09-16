"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PencilSquareIcon, CheckIcon, XIcon, ArrowUpIcon } from "@/assets/icons";
import { useSession } from "next-auth/react";
import { useForm } from "@/hooks/useForm";
import { FormValidator, ValidationSchema } from "@/lib/validation";

interface SystemConfiguration {
  id: string;
  key: string;
  type: ConfigType;
  value: string;
  description?: string;
  category: string;
  isSensitive: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ConfigType = "SYSTEM" | "SECURITY" | "EMAIL" | "NOTIFICATION" | "BACKUP" | "INTEGRATION";

interface ConfigurationFormData {
  key: string;
  type: ConfigType;
  value: string;
  description?: string;
  category: string;
  isSensitive: boolean;
  isActive: boolean;
}

const validationSchema: ValidationSchema = {
  key: { required: true, minLength: 2, pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/ },
  type: { required: true },
  value: { required: true },
  category: { required: true, minLength: 2 },
};

export function SystemConfigurationManager() {
  const { data: session } = useSession();
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<ConfigurationFormData>({
    initialValues: {
      key: "",
      type: "SYSTEM",
      value: "",
      category: "general",
      isSensitive: false,
      isActive: true,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await fetch("/api/admin/configurations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!response.ok) throw new Error("Failed to create configuration");

        await loadConfigurations();
        setShowAddForm(false);
        form.reset();
      } catch (error) {
        console.error("Error creating configuration:", error);
      }
    },
  });

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/configurations");
      if (response.ok) {
        const data = await response.json();
        setConfigurations(data);
      }
    } catch (error) {
      console.error("Error loading configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigurations();
  }, []);

  const handleEdit = (config: SystemConfiguration) => {
    setEditingId(config.id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (config: SystemConfiguration) => {
    try {
      const response = await fetch(`/api/admin/configurations/${config.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Failed to update configuration");

      setEditingId(null);
      await loadConfigurations();
    } catch (error) {
      console.error("Error updating configuration:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      const response = await fetch(`/api/admin/configurations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete configuration");

      await loadConfigurations();
    } catch (error) {
      console.error("Error deleting configuration:", error);
    }
  };

  const getTypeColor = (type: ConfigType) => {
    const colors = {
      SYSTEM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      SECURITY: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      EMAIL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      NOTIFICATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      BACKUP: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      INTEGRATION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return colors[type] || colors.SYSTEM;
  };

  if (loading) {
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
      {/* Header */}
      <Card>
        <CardHeader
          title="Sistem Yapılandırması"
          subtitle="Sistem genelinde ayarları yönetin"
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadConfigurations}
                leftIcon={<ArrowUpIcon className="h-4 w-4" />}
              >
                Yenile
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
              >
                Yeni Yapılandırma
              </Button>
            </div>
          }
        />
      </Card>

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Anahtar
                  </label>
                  <input
                    type="text"
                    name="key"
                    value={form.values.key}
                    onChange={form.handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="DATABASE_URL"
                  />
                  {form.errors.key && (
                    <p className="mt-1 text-sm text-red-600">{form.errors.key}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tip
                  </label>
                  <select
                    name="type"
                    value={form.values.type}
                    onChange={form.handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="SYSTEM">Sistem</option>
                    <option value="SECURITY">Güvenlik</option>
                    <option value="EMAIL">E-posta</option>
                    <option value="NOTIFICATION">Bildirim</option>
                    <option value="BACKUP">Yedekleme</option>
                    <option value="ENDÜSTRİ">Entegrasyon</option>
                  </select>
                  {form.errors.type && (
                    <p className="mt-1 text-sm text-red-600">{form.errors.type}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Değer
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={form.values.value}
                    onChange={form.handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Yapılandırma değeri"
                  />
                  {form.errors.value && (
                    <p className="mt-1 text-sm text-red-600">{form.errors.value}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={form.values.category}
                    onChange={form.handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="general"
                  />
                  {form.errors.category && (
                    <p className="mt-1 text-sm text-red-600">{form.errors.category}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  name="description"
                  value={form.values.description || ""}
                  onChange={form.handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  rows={2}
                  placeholder="Yapılandırma açıklaması"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isSensitive"
                    checked={form.values.isSensitive}
                    onChange={form.handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Hassas Bilgi
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.values.isActive}
                    onChange={form.handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Aktif
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={form.isSubmitting}>
                  {form.isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Configuration List */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {configurations.map((config) => (
              <div key={config.id} className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(config.type)}`}>
                        {config.type}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {config.category}
                      </span>
                      {!config.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Pasif
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {config.key}
                      </h3>
                      {config.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {config.description}
                        </p>
                      )}
                    </div>

                    <div className="text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Değer: </span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {config.isSensitive ? "••••••••" : config.value}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {editingId === config.id ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          leftIcon={<XIcon className="h-4 w-4" />}
                        >
                          İptal
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(config)}
                          leftIcon={<CheckIcon className="h-4 w-4" />}
                        >
                          Kaydet
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config)}
                          leftIcon={<PencilSquareIcon className="h-4 w-4" />}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Sil
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {configurations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Henüz yapılandırma bulunmamaktadır.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}