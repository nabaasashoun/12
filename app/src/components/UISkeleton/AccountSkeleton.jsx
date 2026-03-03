import './skeleton.css';

export default function AccountSkeleton() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Profile header skeleton */}
      <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-xl p-6 mb-8">
        <div className="flex items-center">
          <div className="w-20 h-12 rounded-full bg-gray-200 shimmer mr-4" />
          <div className="flex-1">
            <div className="h-6 w-48 bg-gray-200 rounded shimmer mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-2" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex border-b border-gray-200 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="h-5 w-16 bg-gray-200 rounded shimmer" />
          </div>
        ))}
      </div>

      {/* Content skeleton - two cards for profile tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6">
          <div className="h-6 w-40 bg-gray-200 rounded shimmer mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-3" />
                <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-4 w-24 bg-gray-200 rounded shimmer" />
        </div>
        <div className="bg-white rounded-lg p-6">
          <div className="h-6 w-40 bg-gray-200 rounded shimmer mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg">
                <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-2" />
                <div className="h-3 w-48 bg-gray-200 rounded shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}