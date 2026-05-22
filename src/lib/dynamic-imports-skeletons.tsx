import React from "react"

export const SectionSkeleton = () => (
  <div className="py-20 bg-gray-50 dark:bg-gray-900 animate-pulse">
    <div className="container mx-auto px-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-8"></div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export const CardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm animate-pulse">
    <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
  </div>
)

export const FormSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
    <div className="gap-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6 mb-2"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mt-6"></div>
  </div>
)
