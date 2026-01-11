import { Search, TrendingUp, Star, Zap, Package, Moon, Sun, SlidersHorizontal, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import MarketplaceIntelligenceWidget from './components/MarketPlaceWidget';
const page = () => {
  return (
    <MarketplaceIntelligenceWidget/>
  );
};
export default page;