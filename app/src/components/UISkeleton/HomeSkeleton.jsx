import './skeleton.css'; 

export default function HomeSkeleton() {
  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div className="w-full sm:w-64 h-8 bg-gray-200 rounded shimmer" />
        <div className="w-8 h-8 bg-gray-200 rounded-full shimmer ml-4" />
      </div>

      {/* Quick Deals skeleton */}
      <div className="sticky top-0 z-40 pt-2 pb-2 mb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex-shrink-0 mr-4">
            <div className="flex flex-col leading-tight">
              <div className="h-6 w-16 bg-gray-200 rounded shimmer mb-1" />
              <div className="h-6 w-16 bg-gray-200 rounded shimmer" />
            </div>
          </div>
          <div className="flex flex-1 justify-center space-x-3 sm:space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full shimmer" />
                <div className="h-3 w-12 bg-gray-200 rounded shimmer mt-1" />
                <div className="h-2 w-10 bg-gray-200 rounded shimmer mt-1" />
              </div>
            ))}
          </div>
          <div className="flex flex-col space-y-1 ml-4">
            <div className="w-6 h-6 bg-gray-200 rounded-full shimmer" />
            <div className="w-6 h-6 bg-gray-200 rounded-full shimmer" />
          </div>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full relative mt-3 shimmer" />
      </div>

      {/* Product grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 rounded-full shimmer" />
                  <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
                </div>
                <div className="w-4 h-4 bg-gray-200 rounded shimmer" />
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded shimmer mx-auto" />
            </div>
            <div className="aspect-square bg-gray-200 shimmer" />
            <div className="p-2 sm:p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full shimmer" />
                  <div className="w-6 h-6 bg-gray-200 rounded-full shimmer" />
                  <div className="w-6 h-6 bg-gray-200 rounded-full shimmer" />
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded-full shimmer" />
              </div>
              <div className="flex justify-end items-center mb-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-2 h-2 bg-gray-200 rounded shimmer" />
                  ))}
                </div>
                <div className="w-8 h-3 bg-gray-200 rounded shimmer ml-1" />
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded shimmer mb-2" />
              <div className="h-3 w-full bg-gray-200 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
