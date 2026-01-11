import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Mock data
import { Badge } from './ui/badge';
import { Search, TrendingUp, Star, Zap, Package, Moon, Sun, SlidersHorizontal, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
const ProductCard = ({ product, isOptimistic }) => {
  // Safely calculate price deviation with null checks
  const priceDeviation = product.priceHistory && product.priceHistory.length > 0
    ? ((product.priceHistory[0] - product.price) / product.priceHistory[0] * 100).toFixed(1)
    : '0.0';
  
  return (
    <Card 
      className={`group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isOptimistic ? 'opacity-60' : 'opacity-100'
      }`}
      tabIndex={0}
      role="article"
      aria-label={`${product.name}, Price: ${product.price} rupees`}
    >
      <CardContent className="p-5">
        {/* Source badge */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-xs font-semibold">
            {product.source}
          </Badge>
          {product.delivery < 48 && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white">
              <Zap className="w-3 h-3 mr-1" />
              Fast
            </Badge>
          )}
        </div>

        {/* Product image placeholder */}
        <div 
          className={`h-32 w-full rounded-xl bg-gradient-to-br ${product.imageColor} mb-4 flex items-center justify-center`}
          role="img"
          aria-label="Product image"
        >
          <Package className="w-12 h-12 text-white opacity-50" />
        </div>

        {/* Product name */}
        <CardTitle className="text-base mb-2 line-clamp-2">
          {product.name}
        </CardTitle>

        {/* Price */}
        <div className="text-2xl font-black mb-1">
          ₹{product.price.toLocaleString('en-IN')}
        </div>

        {/* Price deviation */}
        {priceDeviation > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-3">
            ↓ {priceDeviation}% from peak
          </p>
        )}

        <Separator className="my-3" />

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Price trend sparkline */}
        {product.priceHistory && product.priceHistory.length > 0 && (
          <div className="bg-muted rounded-lg p-2 mb-3 h-12">
            <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                points={product.priceHistory.map((price, i) => {
                  const x = (i / (product.priceHistory.length - 1)) * 100;
                  const minPrice = Math.min(...product.priceHistory);
                  const maxPrice = Math.max(...product.priceHistory);
                  const y = 30 - ((price - minPrice) / (maxPrice - minPrice)) * 25;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke={product.priceHistory[0] > product.priceHistory[product.priceHistory.length - 1] ? '#10b981' : '#ef4444'}
                strokeWidth="2"
              />
            </svg>
          </div>
        )}

        {/* Reliability, Delivery and Stock */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Reliability:</span>
            <Badge variant="outline">{product.reliability}%</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Delivery:</span>
            <Badge variant="outline">{product.delivery}h</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Popularity:</span>
            <Badge variant="outline">{(product.popularity / 1000).toFixed(1)}k</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stock:</span>
            <Badge variant={product.inStock ? "default" : "destructive"}>
              {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default ProductCard