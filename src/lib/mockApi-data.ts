import { Product } from './indexeddb-clean';

const apiCache = new Map<string, any>();

const simulateAPICall = async (endpoint: string, delay: number = 300) => {
  if (apiCache.has(endpoint)) {
    console.log('📦 Cache hit for:', endpoint);
    return apiCache.get(endpoint);
  }
  
  console.log('🌐 API Call to:', endpoint, `(${delay}ms delay)`);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  let data;
  try {
    if (endpoint.includes('amazon')) {
      const response = await fetch('/json/api1-products.json');
      data = await response.json();
    } else if (endpoint.includes('flipkart')) {
      const response = await fetch('/json/api2-products.json');
      data = await response.json();
    } else if (endpoint.includes('marketplace')) {
      const response = await fetch('/json/api3-products.json');
      data = await response.json();
    }
  } catch (error) {
    console.error('❌ Failed to fetch:', error);
    data = { products: [], items: [], data: [] };
  }
  
  apiCache.set(endpoint, data);
  return data;
};

export const mockAPI = {
  async searchAmazonProducts(query: string = ''): Promise<Product[]> {
    console.log('🔴 Amazon API Call - Inconsistent Format 1');
    const response = await simulateAPICall('/api/amazon/products', 250);
    
    let products = response.products || [];
    
    if (query) {
      products = products.filter((p: any) => 
        p.title?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    console.log('🔴 Amazon Raw Response:', products.slice(0, 2));
    return products.map((p: any) => ({
      id: p.product_id,
      name: p.title,
      price: p.price?.amount || 0,
      source: "Amazon",
      rating: p.rating || 0,
      reviews: p.total_reviews || 0,
      delivery: (p.delivery_info?.days || 1) * 24,
      inStock: p.availability === 'in_stock',
      priceHistory: p.price_trend?.map((pt: any) => pt.price) || [],
      reliability: p.seller_reliability || 0,
      popularity: p.popularity_score || 0,
      currency: p.price?.currency || 'INR'
    }));
  },

  async searchFlipkartProducts(query: string = ''): Promise<Product[]> {
    console.log('🔵 Flipkart API Call - Inconsistent Format 2');
    const response = await simulateAPICall('/api/flipkart/products', 350);
    
    let products = response.items || [];
    
    if (query) {
      products = products.filter((p: any) => 
        p.product_name?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    console.log('🔵 Flipkart Raw Response:', products.slice(0, 2));
    return products.map((p: any) => ({
      id: p.id,
      name: p.product_name,
      price: p.cost || 0,
      source: "Flipkart",
      rating: p.stars || 0,
      reviews: p.feedback_count || 0,
      delivery: p.shipping?.hours || 48,
      inStock: p.stock_status === 'available',
      priceHistory: p.price_data?.map((pd: any) => pd.amount) || [],
      reliability: p.trust_score || 0,
      popularity: p.trending_score || 0,
      currency: p.currency || 'INR'
    }));
  },

  async searchMarketplaceProducts(query: string = ''): Promise<Product[]> {
    console.log('🟢 Marketplace API Call - Inconsistent Format 3');
    const response = await simulateAPICall('/api/marketplace/products', 400);
    
    let products = response.data || [];
    
    if (query) {
      products = products.filter((p: any) => 
        p.display_name?.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    console.log('🟢 Marketplace Raw Response:', products.slice(0, 2));
    return products.map((p: any) => ({
      id: p.item_code,
      name: p.display_name,
      price: p.amount || 0,
      source: "Marketplace",
      rating: p.user_rating || 0,
      reviews: p.review_count || 0,
      delivery: 48, // Default for marketplace
      inStock: p.inventory_status === 'in_stock',
      priceHistory: p.price_history?.map((ph: any) => ph.price) || [],
      reliability: p.seller_rating || 0,
      popularity: p.popularity_index || 0,
      currency: p.currency || 'INR'
    }));
  },

  async searchProducts(query: string = ''): Promise<Product[]> {
    console.log('🌐 Combined Search from 3 Inconsistent APIs for:', query);
    
    const [amazonResults, flipkartResults, marketplaceResults] = await Promise.all([
      this.searchAmazonProducts(query),
      this.searchFlipkartProducts(query), 
      this.searchMarketplaceProducts(query)
    ]);
    
    const allResults = [...amazonResults, ...flipkartResults, ...marketplaceResults];
    const uniqueResults = allResults.filter((product, index, self) =>
      index === self.findIndex((p) => p.id === product.id)
    );
    
    console.log(`📊 Final Results: ${uniqueResults.length} total`);
    console.log(`  - Amazon: ${amazonResults.length} products`);
    console.log(`  - Flipkart: ${flipkartResults.length} products`);
    console.log(`  - Marketplace: ${marketplaceResults.length} products`);
    
    return uniqueResults;
  },

  async getTrendingProducts(count: number = 8): Promise<Product[]> {
    console.log('🔥 Getting trending from 3 Inconsistent APIs');
    
    const allProducts = await this.searchProducts('');
    
    const trending = allProducts
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, count);
    
    console.log(`🔥 Top ${count} trending:`, trending.map(p => `${p.name} (${p.source})`));
    return trending;
  },

  clearCache() {
    apiCache.clear();
    console.log('🗑️ All API caches cleared');
  }
};
