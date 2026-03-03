export default function CartSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full shimmer mr-4" />
          <div className="h-8 w-48 bg-gray-200 rounded shimmer" />
        </div>
        <div className="h-4 w-64 bg-gray-200 rounded shimmer" />
      </div>

      {/* Cart items and summary grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column – cart items */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-24 bg-gray-200 rounded shimmer" />
            <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm p-4">
                <div className="flex">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg shimmer mr-4" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <div className="h-5 w-32 bg-gray-200 rounded shimmer mb-2" />
                        <div className="h-4 w-20 bg-gray-200 rounded shimmer mb-2" />
                        <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full shimmer" />
                        <div className="w-8 h-8 bg-gray-200 rounded-full shimmer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full shimmer" />
                        <div className="w-8 h-8 bg-gray-200 rounded-full shimmer" />
                        <div className="w-8 h-8 bg-gray-200 rounded-full shimmer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column – order summary */}
        <div>
          <div className="bg-white rounded-lg p-6 sticky top-6">
            <div className="h-6 w-32 bg-gray-200 rounded shimmer mb-6" />
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
              </div>
              <div className="border-t pt-3 flex justify-between">
                <div className="h-5 w-16 bg-gray-200 rounded shimmer" />
                <div className="h-5 w-20 bg-gray-200 rounded shimmer" />
              </div>
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-lg shimmer mb-4" />
            <div className="text-center">
              <div className="h-4 w-32 bg-gray-200 rounded shimmer mx-auto" />
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
              <div className="flex items-start">
                <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-3" />
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer mb-1" />
                  <div className="h-3 w-32 bg-gray-200 rounded shimmer" />
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-3" />
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer mb-1" />
                  <div className="h-3 w-32 bg-gray-200 rounded shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}