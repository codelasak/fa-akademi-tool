import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-red-500">
          403 - Unauthorized
        </h1>
        <p className="mb-6 text-gray-600">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-opacity-90"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
