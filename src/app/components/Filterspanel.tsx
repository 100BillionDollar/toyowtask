import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function FiltersPanel({ filters, setFilters }: any) {
  return (
    <Card className="container mb-6">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={filters.inStock}
            onCheckedChange={(v) => setFilters({ ...filters, inStock: v })}
          />
          <Label>In Stock Only</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={filters.fastDelivery}
            onCheckedChange={(v) => setFilters({ ...filters, fastDelivery: v })}
          />
          <Label>Fast Delivery (&lt;48hr)</Label>
        </div>

        <div>
          <Label>Max Price Deviation: {filters.priceDeviation[0]}%</Label>
          <Slider
            value={filters.priceDeviation}
            onValueChange={(v) =>
              setFilters({ ...filters, priceDeviation: v })
            }
            max={100}
            min={0}
            step={5}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0% (no drop)</span>
            <span>100% (any price)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
