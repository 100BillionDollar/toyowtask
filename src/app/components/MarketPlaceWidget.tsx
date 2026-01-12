"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Header } from "./Header"
import { SearchControls } from "./SearchControls"
import { ProductsGrid } from "./ProductsGrid"
import FiltersPanel from "./Filterspanel"
import ErrorBoundary from "./ErrorBoundry"

import useDebounce from "../hooks/useDebounce"
import { dbManager } from "../../lib/indexeddb-clean"
import { mockAPI } from "../../lib/mockApi-data"
import { Product } from "../../lib/indexeddb-clean"
import { stateManager, usePerformance, useVirtualizedList } from "../../lib/stateManager"
import { useSecurity } from "../../lib/securityManager"

export default function MarketplaceIntelligenceWidget() {
  const metrics = usePerformance()
  
  const { initiateHandshake, sanitizeInput, createSandboxIframe, securityStatus } = useSecurity()
  
  const [darkMode, setDarkMode] = useState(true)
  const [optimisticSearch, setOptimisticSearch] = useState("")
  const debouncedSearch = useDebounce(optimisticSearch, 300)

  const [sortBy, setSortBy] = useState("popularity")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    inStock: false,
    fastDelivery: false,
    priceDeviation: [100],
  })

  const [products, setProducts] = useState<Product[]>(() => 
    stateManager.get('products') || []
  )
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(() =>
    stateManager.get('filteredProducts') || []
  )
  const [trendingProducts, setTrendingProducts] = useState<Product[]>(() =>
    stateManager.get('trendingProducts') || []
  )

  useEffect(() => {
    const unsubscribeProducts = stateManager.subscribe('products', setProducts)
    const unsubscribeFiltered = stateManager.subscribe('filteredProducts', setFilteredProducts)
    const unsubscribeTrending = stateManager.subscribe('trendingProducts', setTrendingProducts)
    
    return () => {
      unsubscribeProducts()
      unsubscribeFiltered()
      unsubscribeTrending()
    }
  }, [])

  const virtualizedProducts = useVirtualizedList(
    filteredProducts,
    (product, index) => (
      <div key={product.id} className="product-item">
      </div>
    ),
    120 
  )

  const searchControllerRef = useRef<AbortController | null>(null)
  const trendingControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  useEffect(() => {
    loadInitialData()
    return () => {
      if (searchControllerRef.current) {
        searchControllerRef.current.abort()
      }
      if (trendingControllerRef.current) {
        trendingControllerRef.current.abort()
      }
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const cachedProducts = await dbManager.getCachedProducts()

      if (cachedProducts && cachedProducts.length > 0) {
        setProducts(cachedProducts)
        setFilteredProducts(cachedProducts)
        setIsLoading(false)
      }

      loadTrendingProducts()

      await loadFreshProducts()

    } catch (err) {
      console.error('Failed to load initial data:', err)
      setError('Failed to load products. Please try again.')
      setIsLoading(false)
    }
  }

  const loadTrendingProducts = async () => {
    try {
      if (trendingControllerRef.current) {
        trendingControllerRef.current.abort()
      }

      trendingControllerRef.current = new AbortController()

      const trending = await mockAPI.getTrendingProducts(8)

      const normalizedTrending = trending.map(product =>
        dbManager.normalizeProduct(product, 'TRENDING')
      )

      setTrendingProducts(normalizedTrending)

      await dbManager.cacheProductsWithDeduplication(trending, 'TRENDING')

    } catch (err) {
      console.warn('Failed to load trending products:', err)
    }
  }

  const loadFreshProducts = async () => {
    try {
      const freshProducts = await mockAPI.searchProducts("")

      const cacheResult = await dbManager.cacheProductsWithDeduplication(
        freshProducts,
        'TEEN_MOCK_API'
      )

      if (cacheResult.success) {
        const normalizedProducts = freshProducts.map(product =>
          dbManager.normalizeProduct(product, 'TEEN_MOCK_API')
        )
        setProducts(normalizedProducts)
        setFilteredProducts(normalizedProducts)
      }

    } catch (err) {
      console.error('Failed to load fresh products:', err)
      if (products.length === 0) {
        setError('Failed to load latest products. Showing cached data if available.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadFreshProducts()
      return
    }

    try {
      setIsSearching(true)
      setError(null)

      if (searchControllerRef.current) {
        searchControllerRef.current.abort()
      }

      searchControllerRef.current = new AbortController()

      const searchResult = await dbManager.searchProductsWithDeduplication(
        query,
        searchControllerRef.current.signal
      )

      if (searchResult.results.length === 0) {
        const apiResults = await mockAPI.searchProducts(query)
        
        await dbManager.cacheProductsWithDeduplication(
          apiResults,
          'SEARCH_RESULTS'
        )
        
        const normalizedResults = apiResults.map(product => 
          dbManager.normalizeProduct(product, 'SEARCH_RESULTS')
        )
        
        setProducts(normalizedResults)
        setFilteredProducts(normalizedResults)
      } else {
        setProducts(searchResult.results)
        setFilteredProducts(searchResult.results)
      }

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Search was cancelled')
        return
      }

      console.error('Search failed:', err)
      setError('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    performSearch(debouncedSearch)
  }, [debouncedSearch, performSearch])

  useEffect(() => {
    let results = [...products]

    if (filters.inStock) {
      results = results.filter(p => p.inStock)
    }
    if (filters.fastDelivery) {
      results = results.filter(p => p.delivery < 48)
    }

    if (filters.priceDeviation && filters.priceDeviation[0] < 100) {
      results = results.filter(p => {
        if (!p.priceHistory || p.priceHistory.length === 0) {
          return true; 
        }
        
        const priceHistory = Array.isArray(p.priceHistory[0])
          ? p.priceHistory.map((h: any) => h.price)
          : p.priceHistory
        
        if (!priceHistory || priceHistory.length === 0) {
          return true;
        }
        
        const deviation = ((priceHistory[0] - p.price) / priceHistory[0]) * 100
        return deviation <= filters.priceDeviation[0]
      })
    }

    results.sort((a, b) => {
      if (sortBy === "price") return a.price - b.price
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "popularity") return b.popularity - a.popularity
      return 0
    })

    setFilteredProducts(results)
  }, [products, sortBy, filters])

  const handleRetry = async () => {
    setError(null)
    await loadInitialData()
  }

  const handleClearCache = async () => {
    try {
      await dbManager.clearCache()
      await loadFreshProducts()
    } catch (err) {
      console.error('Failed to clear cache:', err)
      setError('Failed to clear cache. Please try again.')
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-5 bg-background text-foreground">

    <div className="container mx-auto">
              <Header darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />
        <SearchControls
          search={optimisticSearch}
          onSearch={setOptimisticSearch}
          sortBy={sortBy}
          onSort={setSortBy}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          filters={filters}
          isSearching={isSearching}
        />

        {showFilters && (
          <FiltersPanel filters={filters} setFilters={setFilters} />
        )}

        {error && (
          <div className="container mx-auto px-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">{error}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Retry
                </button>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        )}

        <ProductsGrid
          isLoading={isLoading}
          products={filteredProducts}
          optimistic={optimisticSearch !== debouncedSearch}
          clearFilters={() =>
            setFilters({ inStock: false, fastDelivery: false, priceDeviation: [100] })
          }
          trendingProducts={trendingProducts}
        />
        </div>
      </div>  
    </ErrorBoundary>
  )
}
