import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line } from "recharts"

type Props = {
  product: {
    name: string
    priceHistory: number[]
    reliability: number
    deliveryHours: number
  }
}

export function ResultCard({ product }: Props) {
  const data = product.priceHistory.map((v, i) => ({
    index: i,
    value: v,
  }))

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold">{product.name}</h3>

        <LineChart width={120} height={40} data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="currentColor"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>

        <div className="flex justify-between text-sm">
          <Badge variant="secondary">
            Reliability: {product.reliability}%
          </Badge>
          <Badge
            variant={product.deliveryHours < 48 ? "default" : "outline"}
          >
            {product.deliveryHours} hr
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
