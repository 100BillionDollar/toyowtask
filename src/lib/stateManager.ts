import * as React from 'react';


interface StateItem<T> {
  data: T;
  timestamp: number;
  renderCount: number;
}

interface PerformanceMetrics {
  fps: number;
  renderCost: number;
  memoryUsage: number;
  componentCount: number;
}

class StateManager {
  private state = new Map<string, StateItem<any>>();
  private subscribers = new Map<string, Set<(data: any) => void>>();
  private metrics: PerformanceMetrics = {
    fps: 0,
    renderCost: 0,
    memoryUsage: 0,
    componentCount: 0
  };

  get<T>(key: string): T | undefined {
    const item = this.state.get(key);
    if (item) {
      item.renderCount++;
      console.log(`📊 State Read: ${key} (rendered ${item.renderCount} times)`);
    }
    return item?.data;
  }

  set<T>(key: string, data: T): void {
    const start = performance.now();
    
    this.state.set(key, {
      data,
      timestamp: Date.now(),
      renderCount: 0
    });

    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => {
        const renderStart = performance.now();
        callback(data);
        const renderTime = performance.now() - renderStart;
        this.metrics.renderCost += renderTime;
      });
    }

    const totalTime = performance.now() - start;
    console.log(`⚡ State Update: ${key} (${totalTime.toFixed(2)}ms)`);
  }

  subscribe<T>(key: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    this.metrics.componentCount++;
    
    console.log(`👂 Subscribe: ${key} (total: ${this.metrics.componentCount})`);
    
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
        this.metrics.componentCount--;
        console.log(`👋 Unsubscribe: ${key} (remaining: ${this.metrics.componentCount})`);
      }
    };
  }

  createVirtualizedList<T>(
    items: T[], 
    renderItem: (item: T, index: number) => React.ReactNode,
    itemHeight: number = 50
  ) {
    const visibleCount = Math.ceil(window.innerHeight / itemHeight);
    const startIndex = Math.max(0, this.get('scrollPosition') || 0);
    const endIndex = Math.min(startIndex + visibleCount, items.length);
    
    console.log(`🎯 Virtual List: ${items.length} items, showing ${endIndex - startIndex}`);
    
    return {
      items: items.slice(startIndex, endIndex),
      totalCount: items.length,
      startIndex,
      endIndex
    };
  }

  startProfiling(): void {
    console.log('🔬 Performance profiling started');
    this.metrics = {
      fps: 0,
      renderCost: 0,
      memoryUsage: 0,
      componentCount: 0
    };
    
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        console.log(`🎬 FPS: ${this.metrics.fps}`);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  getPerformanceReport(): PerformanceMetrics {
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    this.metrics.memoryUsage = memoryUsage;
    
    console.log('📊 Performance Report:', {
      fps: this.metrics.fps,
      renderCost: `${this.metrics.renderCost.toFixed(2)}ms`,
      memoryUsage: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      componentCount: this.metrics.componentCount
    });
    
    return this.metrics;
  }

  createLazyComponent<T>(
    loader: () => Promise<T>,
    fallback?: React.ReactNode
  ) {
    let component: T | null = null;
    let isLoading = false;
    
    return {
      load: async (): Promise<T> => {
        if (!component && !isLoading) {
          isLoading = true;
          console.log('⏳ Lazy loading component...');
          
          try {
            component = await loader();
            console.log('✅ Component loaded successfully');
          } catch (error) {
            console.error('❌ Component loading failed:', error);
            throw error;
          } finally {
            isLoading = false;
          }
        }
        
        return component!;
      },
      isLoaded: () => component !== null,
      getFallback: () => fallback
    };
  }

  cleanup(maxAge: number = 300000): void { 
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.state.entries()) {
      if (now - item.timestamp > maxAge) {
        this.state.delete(key);
        cleaned++;
      }
    }
    
    console.log(`🧹 Cleaned ${cleaned} old state items`);
  }
}

export const stateManager = new StateManager();

export const usePerformance = () => {
  const [metrics, setMetrics] = React.useState(stateManager.getPerformanceReport());
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(stateManager.getPerformanceReport());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
};

export const useVirtualizedList = <T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  itemHeight: number = 50
) => {
  const [virtualList, setVirtualList] = React.useState(() => 
    stateManager.createVirtualizedList(items, renderItem, itemHeight)
  );
  
  const [scrollPosition, setScrollPosition] = React.useState(0);
  
  React.useEffect(() => {
    stateManager.set('scrollPosition', scrollPosition);
    const newVirtualList = stateManager.createVirtualizedList(items, renderItem, itemHeight);
    setVirtualList(newVirtualList);
  }, [scrollPosition, items]);
  
  return {
    ...virtualList,
    onScroll: (position: number) => setScrollPosition(position)
  };
};
