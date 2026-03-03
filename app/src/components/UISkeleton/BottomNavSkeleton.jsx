export default function BottomNavSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50 md:hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-6 h-6 bg-gray-200 rounded-full shimmer mb-1" />
          <div className="w-10 h-2 bg-gray-200 rounded shimmer" />
        </div>
      ))}
    </div>
  );
}