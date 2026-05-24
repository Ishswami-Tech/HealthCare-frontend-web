import React from "react";

function SectionSkeleton() {
  return (
    <div className="py-20 bg-gray-50 dark:bg-gray-900 animate-pulse">
      <div className="container mx-auto px-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { SectionSkeleton };
