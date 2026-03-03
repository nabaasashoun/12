export default function ProductCommentsSkeleton() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full shimmer mr-4" />
          <div className="h-8 w-40 bg-gray-200 rounded shimmer" />
        </div>
      </div>

      {/* Product summary skeleton */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <div className="w-20 h-20 bg-gray-200 rounded-lg shimmer mr-4 mb-4 md:mb-0" />
          <div className="flex-1">
            <div className="h-6 w-48 bg-gray-200 rounded shimmer mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded shimmer mb-2" />
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-gray-200 rounded shimmer mr-1" />
                  ))}
                </div>
                <div className="h-4 w-8 bg-gray-200 rounded shimmer" />
                <div className="h-4 w-16 bg-gray-200 rounded shimmer ml-1" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded shimmer" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: rating summary and comment form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Rating summary */}
          <div className="bg-white rounded-lg p-4">
            <div className="h-6 w-32 bg-gray-200 rounded shimmer mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex items-center w-16">
                    <div className="h-4 w-4 bg-gray-200 rounded shimmer mr-1" />
                    <div className="h-4 w-4 bg-gray-200 rounded shimmer" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="w-full bg-gray-200 rounded-full h-2 shimmer" />
                  </div>
                  <div className="h-4 w-8 bg-gray-200 rounded shimmer" />
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="h-8 w-16 bg-gray-200 rounded shimmer mx-auto mb-1" />
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-gray-200 rounded shimmer mx-0.5" />
                  ))}
                </div>
                <div className="h-4 w-32 bg-gray-200 rounded shimmer mx-auto" />
              </div>
            </div>
          </div>

          {/* Comment form skeleton */}
          <div className="bg-white rounded-lg p-4">
            <div className="h-6 w-32 bg-gray-200 rounded shimmer mb-4" />
            <div className="mb-4">
              <div className="h-4 w-20 bg-gray-200 rounded shimmer mb-2" />
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-200 rounded shimmer" />
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="h-4 w-20 bg-gray-200 rounded shimmer mb-2" />
              <div className="h-24 w-full bg-gray-200 rounded-lg shimmer" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-lg shimmer" />
          </div>
        </div>

        {/* Right column: comments list */}
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div className="h-6 w-32 bg-gray-200 rounded shimmer mb-2 md:mb-0" />
            <div className="flex items-center space-x-2">
              <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
              <div className="h-8 w-24 bg-gray-200 rounded-lg shimmer" />
            </div>
          </div>

          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full shimmer mr-3" />
                    <div>
                      <div className="h-4 w-24 bg-gray-200 rounded shimmer mb-1" />
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className="w-3 h-3 bg-gray-200 rounded shimmer mr-0.5" />
                          ))}
                        </div>
                        <div className="w-3 h-3 bg-gray-200 rounded shimmer mr-1" />
                        <div className="h-3 w-16 bg-gray-200 rounded shimmer" />
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded shimmer" />
                    <div className="w-6 h-6 bg-gray-200 rounded shimmer" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-200 rounded shimmer mb-1" />
                <div className="h-4 w-2/3 bg-gray-200 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}