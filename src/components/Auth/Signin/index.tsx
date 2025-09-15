"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Geçersiz kullanıcı adı veya şifre");
      } else {
        // Get session to determine redirect based on role
        const session = await getSession();
        if (session?.user?.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (session?.user?.role === "TEACHER") {
          router.push("/auth/sign-in?message=teacher-panel-coming-soon");
        } else if (session?.user?.role === "PRINCIPAL") {
          router.push("/auth/sign-in?message=principal-panel-coming-soon");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <span className="mb-1.5 block font-medium">Ücretsiz Başlayın</span>
      <h2 className="mb-9 text-2xl font-bold text-dark dark:text-white sm:text-title-xl2">
        Fennaver Akademi'ye Giriş Yapın
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">
            Kullanıcı Adı
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-10 text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              required
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-2.5 block font-medium text-dark dark:text-white">
            Şifre
          </label>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-10 text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              required
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="mb-5">
          <input
            type="submit"
            value={isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            disabled={isLoading}
            className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
          />
        </div>
      </form>

      <div className="mt-6 text-center">
        <p>
          Platforma erişim için yöneticinizle iletişime geçin.
        </p>
      </div>
    </>
  );
}