function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
      <div className="flex flex-col gap-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-6" />
    </div>
  );
}

export { FormSkeleton };
