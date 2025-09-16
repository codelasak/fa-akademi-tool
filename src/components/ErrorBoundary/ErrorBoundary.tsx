"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-dark rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Bir Hata Oluştu
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Sayfa yüklenirken beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400">
                    Hata Detayları
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md overflow-x-auto">
                    <pre className="text-xs text-red-800 dark:text-red-200">
                      {this.state.error.toString()}
                      {"\n"}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={this.handleReset}
                  variant="primary"
                  className="flex-1"
                >
                  Tekrar Dene
                </Button>
                <Button
                  onClick={() => window.location.href = "/"}
                  variant="outline"
                  className="flex-1"
                >
                  Ana Sayfa
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;