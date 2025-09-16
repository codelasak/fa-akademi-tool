"use client";

import { useState, useCallback, useMemo } from "react";
import { SearchIcon, XIcon } from "@/assets/icons";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface SearchFilters {
  [key: string]: any;
}

interface SearchField {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "number" | "boolean";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface AdvancedSearchProps {
  fields: SearchField[];
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
  initialFilters?: SearchFilters;
  className?: string;
}

export function AdvancedSearch({
  fields,
  onSearch,
  onClear,
  initialFilters = {},
  className,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value =>
      value !== "" && value !== null && value !== undefined && value !== false
    ).length;
  }, [filters]);

  const handleFilterChange = useCallback((name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    const searchFilters = {
      ...filters,
      ...(searchTerm && { search: searchTerm }),
    };
    onSearch(searchFilters);
  }, [filters, searchTerm, onSearch]);

  const handleClear = useCallback(() => {
    setFilters({});
    setSearchTerm("");
    onClear?.();
  }, [onClear]);

  const renderField = (field: SearchField) => {
    const value = filters[field.name] || "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Seçin...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(field.name, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(field.name, e.target.value ? Number(e.target.value) : "")}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        );

      case "boolean":
        return (
          <select
            value={value?.toString() || ""}
            onChange={(e) => handleFilterChange(field.name, e.target.value === "true")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Hepsi</option>
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader
        title="Arama ve Filtreleme"
        subtitle={`${activeFiltersCount} aktif filtre`}
        actions={
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                leftIcon={<XIcon className="h-4 w-4" />}
              >
                Temizle
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              leftIcon={<SearchIcon className="h-4 w-4" />}
            >
              Gelişmiş
            </Button>
          </div>
        }
      />

      <CardContent>
        {/* Quick Search */}
        <div className="flex space-x-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ara..."
              className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleSearch}>
            Ara
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters)
              .filter(([_, value]) => value !== "" && value !== null && value !== undefined && value !== false)
              .map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20"
                >
                  {fields.find(f => f.name === key)?.label || key}: {value?.toString()}
                  <button
                    onClick={() => handleFilterChange(key, "")}
                    className="ml-1 hover:text-primary"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}