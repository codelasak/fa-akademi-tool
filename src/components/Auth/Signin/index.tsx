"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Development-only component
function DevCredentialsSelector({
  onCredentialSelect,
}: {
  onCredentialSelect: (username: string, password: string) => void;
}) {
  const testCredentials = {
    admin: { username: "admin", password: "admin123", role: "Yönetici" },
    teacher: { username: "teacher1", password: "teacher123", role: "Öğretmen" },
    principal: {
      username: "principal1",
      password: "principal123",
      role: "Okul Müdürü",
    },
  };

  const handleSelect = (credentialType: string) => {
    if (
      credentialType &&
      testCredentials[credentialType as keyof typeof testCredentials]
    ) {
      const cred =
        testCredentials[credentialType as keyof typeof testCredentials];
      onCredentialSelect(cred.username, cred.password);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
      <div className="mb-2 flex items-center">
        <svg
          className="mr-2 h-4 w-4 text-orange-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
          Test Giriş Bilgileri (Geliştirme)
        </span>
      </div>
      <select
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full rounded-md border border-orange-300 bg-white px-3 py-2 text-sm dark:border-orange-600 dark:bg-gray-800 dark:text-white"
        defaultValue=""
      >
        <option value="">Test hesabı seçin...</option>
        <option value="admin">
          👑 {testCredentials.admin.role} - {testCredentials.admin.username}
        </option>
        <option value="teacher">
          📚 {testCredentials.teacher.role} - {testCredentials.teacher.username}
        </option>
        <option value="principal">
          🏫 {testCredentials.principal.role} -{" "}
          {testCredentials.principal.username}
        </option>
      </select>
    </div>
  );
}

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
          router.push("/principal");
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
      <h2 className="sm:text-title-xl2 mb-9 text-2xl font-bold text-dark dark:text-white">
        Fennaver Akademi&apos;ye Giriş Yapın
      </h2>

      {/* Development Test Credentials Selector */}
      {process.env.NODE_ENV === "development" && (
        <DevCredentialsSelector
          onCredentialSelect={(username: string, password: string) => {
            setUsername(username);
            setPassword(password);
          }}
        />
      )}

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

        {error && <div className="mb-4 text-sm text-red-500">{error}</div>}

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
        <p>Platforma erişim için yöneticinizle iletişime geçin.</p>
      </div>
    </>
  );
}
