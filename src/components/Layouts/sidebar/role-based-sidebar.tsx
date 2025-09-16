"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma";
import { ROLE_NAVIGATION } from "./role-navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function RoleBasedSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userRole = session?.user?.role as UserRole;
  const navigation = userRole ? ROLE_NAVIGATION[userRole] : [];

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  useEffect(() => {
    // Keep collapsible open when its subpage is active
    navigation?.forEach((section) => {
      section.items.forEach((item) => {
        if (item.url === pathname) {
          const parentSection = navigation?.find(nav =>
            nav.items.some(navItem => navItem.url === pathname)
          );
          if (parentSection && !expandedItems.includes(parentSection.title)) {
            setExpandedItems(prev => [...prev, parentSection.title]);
          }
        }
      });
    });
  }, [pathname, navigation]);

  if (!userRole || !navigation?.length) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? "w-full" : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
          <div className="relative pr-4.5">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className="px-0 py-2.5 min-[850px]:py-0"
            >
              <Logo />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {navigation.map((section) => (
              <div key={section.title} className="mb-6">
                <nav role="navigation" aria-label={section.title}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        <MenuItem
                          as="link"
                          href={item.url}
                          isActive={pathname === item.url}
                          className="flex items-center gap-3 py-3"
                        >
                          {section.icon && (
                            <section.icon
                              className="size-6 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span>{item.title}</span>
                        </MenuItem>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}