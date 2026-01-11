import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton Loader Component
export default function SkeletonCard() {
  return (
  <Card>
    <CardContent className="p-5 space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </CardContent>
  </Card>
);
}
