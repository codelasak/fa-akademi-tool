import { LoadingSpinner } from "./LoadingSpinner";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = "Yükleniyor...", className }: PageLoadingProps) {
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}

interface CardLoadingProps {
  rows?: number;
  className?: string;
}

export function CardLoading({ rows = 3, className }: CardLoadingProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

interface TableLoadingProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableLoading({ rows = 5, columns = 4, className }: TableLoadingProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="animate-pulse grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}