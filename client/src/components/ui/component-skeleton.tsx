
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ComponentSkeletonProps {
  type?: 'hero' | 'features' | 'testimonials' | 'default';
  className?: string;
}

export function ComponentSkeleton({ type = 'default', className = '' }: ComponentSkeletonProps) {
  if (type === 'hero') {
    return (
      <div className={`py-16 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-16 w-full max-w-4xl mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-12 w-48 mx-auto mt-8" />
        </div>
      </div>
    );
  }

  if (type === 'features') {
    return (
      <div className={`py-16 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mx-auto mb-12" />
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-8 mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testimonials') {
    return (
      <div className={`py-16 px-4 ${className}`}>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-64 mx-auto mb-12" />
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className={`py-12 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}
