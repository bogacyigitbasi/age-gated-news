export function NewsCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-md">
      <div className="h-48 bg-gray-200" />
      <div className="p-4">
        <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
        <div className="mb-2 h-5 w-full rounded bg-gray-200" />
        <div className="mb-1 h-5 w-3/4 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-full rounded bg-gray-100" />
        <div className="mt-1 h-4 w-2/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}
