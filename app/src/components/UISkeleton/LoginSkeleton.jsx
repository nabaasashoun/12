export default function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        {/* Back link skeleton */}
        <div className="inline-flex items-center mb-6">
          <div className="w-4 h-4 bg-gray-200 rounded shimmer mr-2" />
          <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
        </div>

        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          {/* Left column – form */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-full shimmer mr-3" />
                <div>
                  <div className="h-6 w-32 bg-gray-200 rounded shimmer mb-1" />
                  <div className="h-4 w-48 bg-gray-200 rounded shimmer" />
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                  <div className="h-12 w-full bg-gray-200 rounded-lg shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                  <div className="h-12 w-full bg-gray-200 rounded-lg shimmer" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-2" />
                    <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                </div>
                <div className="h-12 w-full bg-gray-200 rounded-lg shimmer" />
              </div>

              <div className="my-6 flex items-center">
                <div className="flex-1 h-px bg-gray-200" />
                <div className="px-4">
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                </div>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-200 rounded-lg shimmer" />
                <div className="h-12 bg-gray-200 rounded-lg shimmer" />
              </div>

              <div className="mt-6 pt-6 border-t text-center">
                <div className="h-4 w-40 bg-gray-200 rounded shimmer mx-auto mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded shimmer mx-auto" />
              </div>
            </div>
          </div>

          {/* Right column – benefits */}
          <div className="w-full lg:w-1/2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 sm:p-8">
              <div className="h-6 w-48 bg-gray-200 rounded shimmer mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded shimmer mr-3" />
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded shimmer mb-1" />
                      <div className="h-3 w-48 bg-gray-200 rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}