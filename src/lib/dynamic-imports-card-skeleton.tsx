function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm animate-pulse">
      <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
    </div>
  );
}

export { CardSkeleton };
