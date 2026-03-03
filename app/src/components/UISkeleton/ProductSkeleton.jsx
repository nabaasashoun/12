import './skeleton.css';

export default function ProductSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white py-2 px-3 sm:px-4 md:px-6 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-1" />
            <div className="h-4 w-12 bg-gray-200 rounded shimmer" />
          </div>
          <div className="flex-1 max-w-md mx-4">
            <div className="h-8 bg-gray-200 rounded shimmer" />
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded shimmer" />
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-12" />

      {/* Related products skeleton */}
      <div className="mt-10 mb-4">
        <div className="h-5 w-32 bg-gray-200 rounded shimmer mb-2" />
        <div className="flex overflow-x-auto space-x-4 pb-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-lg shimmer" />
          ))}
        </div>
      </div>

      {/* Main product skeleton */}
      <div className="relative">
        <div className="w-full h-64 bg-gray-200 rounded-lg shimmer" />
      </div>

      {/* Details skeleton */}
      <div className="mt-4">
        <div className="h-8 w-3/4 bg-gray-200 rounded shimmer mb-2" />
        <div className="h-4 w-full bg-gray-200 rounded shimmer mb-2" />
        <div className="h-4 w-2/3 bg-gray-200 rounded shimmer mb-2" />
        
        <div className="h-6 w-32 bg-gray-200 rounded shimmer mt-4" />
        <div className="flex items-center mt-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded shimmer" />
            ))}
          </div>
          <div className="w-12 h-4 bg-gray-200 rounded shimmer ml-2" />
        </div>
        
        <div className="mt-4 h-4 w-24 bg-gray-200 rounded shimmer" />
        <div className="mt-2 h-4 w-32 bg-gray-200 rounded shimmer" />

        {/* Quantity and add to cart skeleton */}
        <div className="flex items-center mt-6">
          <div className="w-8 h-8 bg-gray-200 rounded shimmer" />
          <div className="mx-2 w-16 h-8 bg-gray-200 rounded shimmer" />
          <div className="w-8 h-8 bg-gray-200 rounded shimmer" />
          <div className="ml-4 w-24 h-8 bg-gray-200 rounded shimmer" />
        </div>

        {/* Comments skeleton */}
        <div className="mt-6">
          <div className="h-6 w-24 bg-gray-200 rounded shimmer mb-4" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="mt-2 p-3 border rounded">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full shimmer mr-2" />
                <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
              </div>
              <div className="h-3 w-full bg-gray-200 rounded shimmer mb-1" />
              <div className="h-3 w-2/3 bg-gray-200 rounded shimmer" />
            </div>
          ))}
          <div className="mt-4">
            <div className="h-16 w-full bg-gray-200 rounded shimmer mb-2" />
            <div className="h-8 w-24 bg-gray-200 rounded shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}