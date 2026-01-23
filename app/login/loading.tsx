export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-700"></div>

      {/* Animated Blob Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="shadow-2xl border-0 overflow-hidden bg-white rounded-lg">
          {/* Header with Solid Color */}
          <div className="bg-purple-700 p-8 text-center relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

            <div className="flex flex-col items-center gap-4 relative z-10">
              <div className="w-28 h-28 bg-white rounded-full p-4 shadow-2xl flex items-center justify-center">
                <div className="w-14 h-14 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  Admin Panel
                </h1>
                <p className="text-purple-100 text-sm font-medium">Memuat...</p>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="p-8 bg-white">
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-6 animate-pulse"></div>
              </div>

              <div className="w-full h-14 bg-gray-200 rounded animate-pulse"></div>

              <div className="text-center">
                <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
