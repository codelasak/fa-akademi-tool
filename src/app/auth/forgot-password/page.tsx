"use client";

import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <ForgotPasswordForm onBack={() => window.history.back()} />
        <div className="text-center">
          <Link href="/auth/signin" className="text-sm text-primary hover:text-primary-dark">
            Giriş sayfasına geri dön
          </Link>
        </div>
      </div>
    </div>
  );
}