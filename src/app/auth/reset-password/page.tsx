"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/Auth/ResetPasswordForm";
import Link from "next/link";

export default function ResetPasswordPage() {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Suspense fallback={<div>Yükleniyor...</div>}>
          <ResetPasswordForm onBack={handleBack} />
        </Suspense>
        <div className="text-center">
          <Link href="/auth/signin" className="text-sm text-primary hover:text-primary-dark">
            Giriş sayfasına geri dön
          </Link>
        </div>
      </div>
    </div>
  );
}