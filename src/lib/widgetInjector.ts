// Widget Injector & Auto-Mount System

interface WidgetConfig {
  containerId?: string;
  autoMount?: boolean;
  shadowDOM?: boolean;
  styles?: string;
  attributes?: Record<string, string>;
}

class WidgetInjector {
  private config: WidgetConfig;
  private isInjected = false;
  private widgetInstance: any = null;

  constructor(config: WidgetConfig = {}) {
    this.config = {
      containerId: 'market-widget',
      autoMount: true,
      shadowDOM: false,
      styles: '',
      attributes: {},
      ...config
    };
  }

  // Create injection script
  createEmbedScript(): string {
    return `
(function() {
  'use strict';
  
  // Widget Injector v1.0
  console.log('🚀 Widget Injector Starting...');
  
  // Check if already injected
  if (window.__MARKET_WIDGET_INJECTED__) {
    console.log('✅ Widget already injected');
    return;
  }
  
  // Main widget class
  class MarketWidget {
    constructor(config) {
      this.config = config;
      this.container = null;
      this.isMounted = false;
    }
    
    // Find or create container
    getContainer() {
      let container = document.getElementById(this.config.containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = this.config.containerId;
        container.style.cssText = \`
          position: relative;
          z-index: 9999;
          min-height: 600px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          overflow: hidden;
          \${this.config.styles || ''}
        \`;
        document.body.appendChild(container);
        console.log('📦 Created container:', this.config.containerId);
      }
      
      return container;
    }
    
    // Inject widget styles
    injectStyles() {
      const styleId = 'market-widget-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = \`
          .market-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            border-radius: 12px;
            overflow: hidden;
          }
          .market-widget * {
            box-sizing: border-box;
          }
          .market-widget-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            font-size: 14px;
            color: #666;
          }
        \`;
        document.head.appendChild(style);
        console.log('🎨 Styles injected');
      }
    }
    
    // Load widget bundle
    async loadWidgetBundle() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/widget.js';
        script.async = true;
        script.onload = () => {
          console.log('📦 Widget bundle loaded');
          resolve();
        };
        script.onerror = () => {
          console.error('❌ Failed to load widget bundle');
          reject(new Error('Widget bundle load failed'));
        };
        
        document.head.appendChild(script);
      });
    }
    
    // Mount widget
    async mount() {
      if (this.isMounted) {
        console.warn('⚠️ Widget already mounted');
        return;
      }
      
      try {
        console.log('🚀 Mounting widget...');
        
        // Inject styles
        this.injectStyles();
        
        // Get container
        this.container = this.getContainer();
        
        // Show loading state
        this.container.innerHTML = '<div class="market-widget-loading">Loading Marketplace Widget...</div>';
        
        // Load widget bundle
        await this.loadWidgetBundle();
        
        // Initialize widget (assuming widget.js exports MarketWidget)
        if (window.MarketWidget) {
          this.widgetInstance = new window.MarketWidget({
            container: this.container,
            ...this.config.attributes
          });
          
          this.isMounted = true;
          window.__MARKET_WIDGET_INJECTED__ = true;
          
          console.log('✅ Widget mounted successfully');
        } else {
          throw new Error('MarketWidget not found in bundle');
        }
      } catch (error) {
        console.error('❌ Failed to mount widget:', error);
        this.container.innerHTML = '<div class="market-widget-loading">Failed to load widget</div>';
      }
    }
    
    // Auto-mount if configured
    autoMount() {
      if (this.config.autoMount) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.mount());
        } else {
          this.mount();
        }
      }
    }
    
    // Unmount widget
    unmount() {
      if (!this.isMounted) return;
      
      console.log('🗑️ Unmounting widget...');
      
      if (this.widgetInstance && this.widgetInstance.destroy) {
        this.widgetInstance.destroy();
      }
      
      if (this.container) {
        this.container.innerHTML = '';
      }
      
      this.isMounted = false;
      window.__MARKET_WIDGET_INJECTED__ = false;
      
      console.log('✅ Widget unmounted');
    }
  }
  
  // Create embed script for injection
  createEmbedCode(): string {
    return `
(function() {
  // Widget Injector Configuration
  const config = ${JSON.stringify(this.config)};
  
  // Initialize and auto-mount
  const widget = new MarketWidget(config);
  widget.autoMount();
})();
    `;
  }
  
  // Inject into page
  inject(): void {
    if (this.isInjected) {
      console.warn('⚠️ Widget already injected');
      return;
    }
    
    try {
      console.log('💉 Injecting widget...');
      
      // Create and inject main script
      const script = document.createElement('script');
      script.textContent = this.createEmbedCode();
      script.setAttribute('data-widget-injector', 'marketplace');
      
      // Add to page
      (document.head || document.getElementsByTagName('head')[0]).appendChild(script);
      
      this.isInjected = true;
      console.log('✅ Widget injected successfully');
      
      // Auto-mount if configured
      if (this.config.autoMount) {
        // Small delay to ensure script is executed
        setTimeout(() => {
          if (window.__MARKET_WIDGET_INJECTED__) {
            console.log('🚀 Auto-mounting widget...');
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Injection failed:', error);
    }
  }
  
  // Manual mount control
  mount(): void {
    if (window.__MARKET_WIDGET_INJECTED__) {
      console.log('🚀 Manual mount triggered');
      // This would be called by external script
    }
  }
  
  // Get injection status
  getStatus(): object {
    return {
      isInjected: this.isInjected,
      isMounted: window.__MARKET_WIDGET_INJECTED__ || false,
      containerId: this.config.containerId,
      config: this.config
    };
  }
}

// Global injector instance
export const widgetInjector = new WidgetInjector();

// Auto-inject on script load
if (typeof window !== 'undefined') {
  // Auto-inject with default configuration
  widgetInjector.inject();
}
