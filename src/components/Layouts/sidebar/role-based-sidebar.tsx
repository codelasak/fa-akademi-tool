"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/generated/prisma";
import { ROLE_NAVIGATION } from "./role-navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeftIcon, ChevronUp as ChevronUpIcon } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function RoleBasedSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userRole = session?.user?.role as UserRole;
  const navigation = useMemo(() => {
    return userRole ? ROLE_NAVIGATION[userRole] : [];
  }, [userRole]);

  // Initialize with first section expanded
  useEffect(() => {
    if (navigation && navigation.length > 0 && expandedItems.length === 0) {
      setExpandedItems([navigation[0].title]);
    }
  }, [navigation, expandedItems.length]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  useEffect(() => {
    // Auto-expand sections when their items become active
    if (navigation) {
      const activeSections = navigation
        .filter(section =>
          section.items.some(item => item.url === pathname)
        )
        .map(section => section.title);

      setExpandedItems(prev => {
        const newExpanded = [...prev];
        activeSections.forEach(section => {
          if (!newExpanded.includes(section)) {
            newExpanded.push(section);
          }
        });
        return newExpanded;
      });
    }
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
          <div className="custom-scrollbar smooth-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
            {navigation.map((section) => {
              const isExpanded = expandedItems.includes(section.title);
              const hasActiveItem = section.items.some(item => item.url === pathname);

              return (
                <div key={section.title} className="sidebar-section mb-4">
                  {/* Collapsible Section Header */}
                  <button
                    onClick={() => toggleExpanded(section.title)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-3 rounded-lg group hover-lift",
                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                      isExpanded && "bg-gray-50 dark:bg-gray-800 shadow-sm",
                      hasActiveItem && "bg-blue-50 dark:bg-blue-900/20 active-pulse"
                    )}
                    aria-expanded={isExpanded}
                    aria-controls={`section-${section.title}`}
                  >
                    <div className="flex items-center gap-3">
                      {section.icon && (
                        <section.icon
                          className={cn(
                            "size-5 shrink-0 transition-colors duration-300",
                            isExpanded || hasActiveItem
                              ? "text-primary scale-110"
                              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                          )}
                          aria-hidden="true"
                        />
                      )}
                      <h3 className={cn(
                        "text-sm font-semibold uppercase tracking-wider transition-colors duration-300",
                        isExpanded || hasActiveItem
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                      )}>
                        {section.title}
                      </h3>
                    </div>
                    <ChevronUpIcon
                      className={cn(
                        "size-4 shrink-0 chevron-rotate text-gray-400",
                        isExpanded ? "rotate-0" : "-rotate-90"
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Collapsible Content */}
                  <div
                    id={`section-${section.title}`}
                    className={cn(
                      "expand-collapse overflow-hidden",
                      isExpanded ? "max-h-96 opacity-100 pt-1" : "max-h-0 opacity-0 pt-0"
                    )}
                  >
                    <nav
                      role="navigation"
                      aria-label={section.title}
                    >
                      <ul className="space-y-1 ml-2">
                        {section.items.map((item) => (
                          <li key={item.title}>
                            <MenuItem
                              as="link"
                              href={item.url}
                              isActive={pathname === item.url}
                              className={cn(
                                "sidebar-item flex items-center gap-3 py-2.5 px-3 text-sm rounded-lg",
                                pathname === item.url
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                              )}
                            >
                              <div className={cn(
                                "size-2 rounded-full transition-all duration-300",
                                pathname === item.url
                                  ? "bg-blue-500 scale-125 shadow-sm"
                                  : "bg-gray-300 dark:bg-gray-600"
                              )} />
                              <span className="font-medium">{item.title}</span>
                            </MenuItem>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}