import "@/css/satoshi.css";
import "@/css/style.css";

import { RoleBasedSidebar } from "@/components/Layouts/sidebar/role-based-sidebar";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { Header } from "@/components/Layouts/header";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    template: "%s | Fennaver Akademi Yönetim Platformu",
    default: "Fennaver Akademi Yönetim Platformu",
  },
  description:
    "Fennaver Akademi için kapsamlı eğitim yönetim platformu. Okul, öğretmen, öğrenci ve ders süreçlerini tek merkezden yönetin.",
  icons: {
    icon: "/fa-favicon.svg",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          <div className="flex min-h-screen">
            <RoleBasedSidebar />

            <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
              <Header />

              <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
