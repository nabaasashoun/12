export default function RegisterSkeleton() {
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
                  <div className="h-6 w-40 bg-gray-200 rounded shimmer mb-1" />
                  <div className="h-4 w-48 bg-gray-200 rounded shimmer" />
                </div>
              </div>

              {/* Profile photo */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full shimmer mb-2" />
                <div className="h-8 w-32 bg-gray-200 rounded-lg shimmer" />
              </div>

              {/* Form fields */}
              <div className="space-y-5">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                    <div className="h-12 w-full bg-gray-200 rounded-lg shimmer" />
                  </div>
                ))}
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                  <div className="h-12 w-full bg-gray-200 rounded-lg shimmer" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                  <div className="h-12 w-full bg-gray-200 rounded-lg shimmer" />
                </div>

                {/* Checkboxes */}
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-3" />
                  <div className="h-4 w-40 bg-gray-200 rounded shimmer" />
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-200 rounded shimmer mr-3" />
                  <div className="h-4 w-48 bg-gray-200 rounded shimmer" />
                </div>

                {/* Submit button */}
                <div className="h-12 w-full bg-gray-200 rounded-lg shimmer mt-6" />
              </div>

              <div className="mt-6 pt-6 border-t text-center">
                <div className="h-4 w-40 bg-gray-200 rounded shimmer mx-auto mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded shimmer mx-auto" />
              </div>
            </div>
          </div>

          {/* Right column – benefits */}
          <div className="w-full lg:w-1/2">
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 sm:p-8">
              <div className="h-6 w-40 bg-gray-200 rounded shimmer mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded shimmer mr-3" />
                    <div className="h-4 w-40 bg-gray-200 rounded shimmer" />
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