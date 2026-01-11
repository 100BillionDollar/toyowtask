import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import SkeletonCard from "./Skeleton"
import ProductCard from "./ProductCard"
import { Badge } from '@/components/ui/badge';


export function ProductsGrid({
  isLoading,
  products,
  optimistic,
  clearFilters,
}: any) {
  if (isLoading) {
    return (
      <div className="container grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (!products.length) {
    return (
      <Card className="container py-20 text-center">   
        <CardContent>
          <Package className="mx-auto mb-4" />
          <CardTitle>No products found</CardTitle>
          <CardDescription>
            Try adjusting your search or filters
          </CardDescription>
          <Button className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container grid gap-6 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
      {products.map((p: any) => (
        <ProductCard key={p.id} product={p} isOptimistic={optimistic} />
      ))}
    </div>
  )
}
