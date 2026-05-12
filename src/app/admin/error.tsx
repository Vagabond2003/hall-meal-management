"use client";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
      <p className="text-gray-600 mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-green-700 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}
