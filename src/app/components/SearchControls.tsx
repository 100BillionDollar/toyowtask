import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal } from "lucide-react"

export function SearchControls({
  search,
  onSearch,
  sortBy,
  onSort,
  showFilters,
  onToggleFilters,
  filters,
}: any) {
  const activeFilters =
    (filters.inStock ? 1 : 0) +
    (filters.fastDelivery ? 1 : 0) +
    (filters.priceDeviation && filters.priceDeviation[0] < 100 ? 1 : 0)

  return (
    <div className="container flex flex-col md:flex-row gap-3 py-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-10"
        />
      </div>

      <Select value={sortBy} onValueChange={onSort}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price">Price</SelectItem>
          <SelectItem value="rating">Rating</SelectItem>
          <SelectItem value="popularity">Popularity</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onToggleFilters} className="relative">
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters
        {activeFilters > 0 && (
          <Badge className="absolute -top-2 -right-2">{activeFilters}</Badge>
        )}
      </Button>
    </div>
  )
}
