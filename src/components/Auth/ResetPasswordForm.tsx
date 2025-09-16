"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LockIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon } from "@/assets/icons";

export function ResetPasswordForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setMessage({ type: "error", text: "Geçersiz veya eksik şifre sıfırlama bağlantısı" });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Şifreler eşleşmiyor" });
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage({ type: "error", text: "Şifre en az 8 karakter olmalıdır" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Bir hata oluştu" });
        if (data.error === "Invalid or expired token") {
          setIsTokenValid(false);
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Bir hata oluştu" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isTokenValid) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader
          title="Geçersiz Bağlantı"
          subtitle="Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş"
        />
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lütfen yeni bir şifre sıfırlama talebi oluşturun.
            </p>
            <Button
              onClick={() => router.push("/auth/forgot-password")}
              className="w-full"
            >
              Yeni Şifre Sıfırlama Talebi
            </Button>
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Giriş Sayfasına Dön
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader
        title="Şifre Sıfırlama"
        subtitle="Yeni şifrenizi belirleyin"
      />
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 pr-10 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="••••••••"
                required
              />
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Şifre Tekrar
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 pr-10 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="••••••••"
                required
              />
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full"
            >
              {isLoading ? "Şifre Sıfırlanıyor..." : "Şifreyi Sıfırla"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full"
              leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            >
              Giriş Sayfasına Dön
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}