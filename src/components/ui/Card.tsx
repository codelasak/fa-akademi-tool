import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  hover?: boolean;
}

export function Card({
  children,
  className,
  padding = "md",
  shadow = "md",
  bordered = true,
  hover = false,
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-card",
    lg: "shadow-lg",
  };

  return (
    <div
      className={cn(
        "rounded-lg bg-white dark:bg-gray-dark",
        paddingClasses[padding],
        shadowClasses[shadow],
        bordered && "border border-gray-200 dark:border-gray-700",
        hover && "transition-shadow hover:shadow-lg dark:hover:border-gray-600",
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("mt-6 flex items-center justify-between space-x-4", className)}>
      {children}
    </div>
  );
}