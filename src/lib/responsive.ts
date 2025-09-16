import { useState, useEffect } from "react";

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Hook for responsive design
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("xs");

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      let currentBreakpoint: Breakpoint = "xs";

      Object.entries(BREAKPOINTS).forEach(([key, value]) => {
        if (width >= value) {
          currentBreakpoint = key as Breakpoint;
        }
      });

      setBreakpoint(currentBreakpoint);
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);

    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isXs: breakpoint === "xs",
    isSm: breakpoint === "sm",
    isMd: breakpoint === "md",
    isLg: breakpoint === "lg",
    isXl: breakpoint === "xl",
    is2xl: breakpoint === "2xl",
    isMobile: breakpoint === "xs" || breakpoint === "sm",
    isTablet: breakpoint === "md" || breakpoint === "lg",
    isDesktop: breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl",
  };
}

// Hook for responsive values
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const { breakpoint } = useBreakpoint();

  // Return the value for the current breakpoint or the largest available breakpoint
  const breakpointOrder: Breakpoint[] = ["2xl", "xl", "lg", "md", "sm", "xs"];

  for (const bp of breakpointOrder) {
    if (values[bp] !== undefined && BREAKPOINTS[bp] <= BREAKPOINTS[breakpoint]) {
      return values[bp]!;
    }
  }

  return defaultValue;
}

// Responsive utility functions (these cannot use hooks - use useResponsiveValue in components instead)
export function getResponsiveClass(
  classes: Partial<Record<Breakpoint, string>>,
  defaultClass: string = "",
  currentBreakpoint: Breakpoint = "md"
): string {
  const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "2xl"];

  for (const bp of breakpointOrder) {
    if (classes[bp] && BREAKPOINTS[bp] <= BREAKPOINTS[currentBreakpoint]) {
      return `${defaultClass} ${classes[bp]}`;
    }
  }

  return defaultClass;
}

// Grid system utilities
export interface GridConfig {
  cols?: Partial<Record<Breakpoint, number>>;
  gap?: Partial<Record<Breakpoint, number>>;
  className?: string;
}

export function getGridClasses(config: GridConfig, currentBreakpoint: Breakpoint = "md"): string {
  let classes = config.className || "";

  // Columns - simplified approach
  if (config.cols) {
    // Use Tailwind's responsive classes directly
    classes += " grid-cols-1";
    if (currentBreakpoint === "md" && config.cols.md) classes += ` md:grid-cols-${config.cols.md}`;
    if (currentBreakpoint === "lg" && config.cols.lg) classes += ` lg:grid-cols-${config.cols.lg}`;
    if (currentBreakpoint === "xl" && config.cols.xl) classes += ` xl:grid-cols-${config.cols.xl}`;
  }

  // Gap - simplified approach
  if (config.gap) {
    const gap = config.gap[currentBreakpoint] || 4;
    classes += ` gap-${gap}`;
  }

  return classes.trim();
}

// Container utilities
export interface ContainerConfig {
  maxWidth?: Partial<Record<Breakpoint, string>>;
  padding?: Partial<Record<Breakpoint, string>>;
  className?: string;
}

export function getContainerClasses(config: ContainerConfig = {}, currentBreakpoint: Breakpoint = "md"): string {
  let classes = "container";

  // Max width - use Tailwind's responsive classes
  if (config.maxWidth) {
    const maxWidth = config.maxWidth[currentBreakpoint] || "7xl";
    classes += ` max-w-${maxWidth}`;
  }

  // Padding - use Tailwind's responsive classes
  if (config.padding) {
    const padding = config.padding[currentBreakpoint] || "4";
    classes += ` px-${padding}`;
  }

  if (config.className) {
    classes += ` ${config.className}`;
  }

  return classes;
}

// Hook for responsive visibility
export function useResponsiveVisibility() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  return {
    showOnlyMobile: isMobile,
    showOnlyTablet: isTablet,
    showOnlyDesktop: isDesktop,
    hideOnMobile: !isMobile,
    hideOnTablet: !isTablet,
    hideOnDesktop: !isDesktop,
  };
}

// Responsive image utilities
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  className?: string;
}

export function getResponsiveImageProps({
  src,
  alt,
  widths = [320, 640, 768, 1024, 1280, 1536],
  sizes = "100vw",
  className = "",
}: ResponsiveImageProps) {
  const srcSet = widths
    .map(width => `${src}?w=${width} ${width}w`)
    .join(", ");

  return {
    src,
    srcSet,
    sizes,
    alt,
    className: `w-full h-auto object-cover ${className}`,
  };
}