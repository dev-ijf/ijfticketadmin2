import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotificationLogsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Filter Card Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-full md:w-40 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-full md:w-40 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Table Card Skeleton */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
