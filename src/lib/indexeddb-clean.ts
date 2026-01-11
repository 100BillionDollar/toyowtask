export interface Product {
  id: string | number;
  name: string;
  price: number;
  source: string;
  rating: number;
  reviews: number;
  delivery: number;
  inStock: boolean;
  priceHistory: number[];
  reliability: number;
  popularity: number;
  imageColor?: string;
  currency?: string;
  lastUpdated?: number;
}

export interface AmazonProduct {
  product_id: string;
  title: string;
  price: {
    amount: number;
    currency: string;
  };
  rating: number;
  total_reviews: number;
  delivery_info: {
    days: number;
    fast_delivery: boolean;
  };
  availability: "in_stock" | "out_of_stock";
  price_trend: Array<{
    price: number;
    date: string;
  }>;
  seller_reliability: number;
  popularity_score: number;
}

export interface FlipkartProduct {
  id: string;
  product_name: string;
  cost: number;
  currency: string;
  stars: number;
  feedback_count: number;
  shipping: {
    hours: number;
    express: boolean;
  };
  stock_status: "available" | "unavailable";
  price_data: Array<{
    amount: number;
    date: string;
  }>;
  trust_score: number;
  trending_score: number;
}

let db: IDBDatabase | null = null;

const DB_NAME = 'marketplace_db';
const DB_VERSION = 1;
const STORE_NAME = 'products';

async function initDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log(store)
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('timestamp', 'lastUpdated', { unique: false });
      }
    };
  });
}

class SimpleCache {
  private cache = new Map<string, any>();
  private maxSize = 100;

  set(key: string, value: any) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key: string) {
    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
  }
}

const simpleCache = new SimpleCache();

export const dbManager = {
  async init() {
    if (!db) {
      await initDB();
    }
  },

  async cacheProducts(products: Product[]) {
    try {
      await this.init();
      
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      for (const product of products) {
        product.lastUpdated = Date.now();
        store.put(product);
      }
      
      return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Cache failed:', error);
      throw error;
    }
  },

  async getCachedProducts(): Promise<Product[]> {
    try {
      await this.init();
      
      return new Promise<Product[]>((resolve, reject) => {
        const transaction = db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Get cached failed:', error);
      return [];
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    try {
      await this.init();
      
      return new Promise<Product[]>((resolve, reject) => {
        const transaction = db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const allProducts = request.result as Product[];
          const searchQuery = query?.toLowerCase() || '';
          const filtered = allProducts.filter(product =>
            product.name?.toLowerCase().includes(searchQuery)
          );
          resolve(filtered);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  async clearCache() {
    try {
      await this.init();
      
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      return new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          simpleCache.clear();
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Clear cache failed:', error);
      throw error;
    }
  },

  normalizeProduct(product: AmazonProduct | FlipkartProduct | Product, source: string): Product {
    if ('product_id' in product) {
      const amazon = product as AmazonProduct;
      return {
        id: amazon.product_id,
        name: amazon.title,
        price: amazon.price.amount,
        source: source,
        rating: amazon.rating,
        reviews: amazon.total_reviews,
        delivery: amazon.delivery_info.days * 24,
        inStock: amazon.availability === 'in_stock',
        priceHistory: amazon.price_trend.map(p => p.price),
        reliability: amazon.seller_reliability,
        popularity: amazon.popularity_score,
        currency: amazon.price.currency
      };
    } else if ('id' in product && 'product_name' in product) {
      const flipkart = product as FlipkartProduct;
      return {
        id: flipkart.id,
        name: flipkart.product_name,
        price: flipkart.cost,
        source: source,
        rating: flipkart.stars,
        reviews: flipkart.feedback_count,
        delivery: flipkart.shipping.hours,
        inStock: flipkart.stock_status === 'available',
        priceHistory: flipkart.price_data.map(p => p.amount),
        reliability: flipkart.trust_score,
        popularity: flipkart.trending_score,
        currency: flipkart.currency
      };
    } else {
      return product as Product;
    }
  },

  async cacheProductsWithDeduplication(products: any[], source: string) {
    try {
      const normalized = products.map(p => this.normalizeProduct(p, source));
      await this.cacheProducts(normalized);
      return { success: true, count: normalized.length };
    } catch (error) {
      console.error('Cache with deduplication failed:', error);
      return { success: false, error };
    }
  },

  async searchProductsWithDeduplication(query: string, signal?: AbortSignal) {
    try {
      if (signal?.aborted) {
        throw new DOMException('Operation aborted', 'AbortError');
      }

      const cacheKey = `search_${query?.toLowerCase()}`;
      const cached = simpleCache.get(cacheKey);
      
      if (cached) {
        return { results: cached };
      }

      const results = await this.searchProducts(query);
      simpleCache.set(cacheKey, results);
      
      return { results };
    } catch (error) {
      console.error('Search with deduplication failed:', error);
      return { results: [] };
    }
  }
};
