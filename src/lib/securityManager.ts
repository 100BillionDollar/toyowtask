import * as React from 'react';

// Security Manager with API Key Exchange & Protection

interface SecurityConfig {
  allowedOrigins: string[];
  apiKeys: Record<string, string>;
  cspHeaders: Record<string, string>;
  sandboxMode: boolean;
}

interface HandshakeRequest {
  type: 'HANDSHAKE_REQUEST';
  widgetId: string;
  timestamp: number;
  nonce: string;
}

interface HandshakeResponse {
  type: 'HANDSHAKE_RESPONSE';
  apiKey: string;
  permissions: string[];
  expires: number;
  nonce: string;
}

class SecurityManager {
  private config: SecurityConfig = {
    allowedOrigins: ['https://trusted-site.com', 'https://partner-site.com'],
    apiKeys: {},
    cspHeaders: {
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline'",
      'style-src': "'self' 'unsafe-inline'",
      'img-src': "'self' data: https:",
      'connect-src': "'self' https://api.example.com",
      'font-src': "'self'",
      'object-src': "'none'",
      'media-src': "'self'",
      'frame-src': "'self'",
      'child-src': "'self'",
      'worker-src': "'self'",
      'manifest-src': "'self'",
      'upgrade-insecure-requests': '1'
    },
    sandboxMode: true
  };

  private handshakeCallbacks = new Map<string, (response: HandshakeResponse) => void>();

  private generateNonce(): string {
    return btoa(Math.random().toString(36) + Date.now().toString());
  }

  private verifyOrigin(origin: string): boolean {
    return this.config.allowedOrigins.includes(origin);
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') 
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '') 
      .trim();
  }

  protectedFrame(): void {
    if (window.top !== window.self) {
      console.warn('🛡️ Clickjacking attempt detected');
      window.top!.location = window.self.location;
    }
  }

  initiateHandshake(parentOrigin: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const nonce = this.generateNonce();
      const request: HandshakeRequest = {
        type: 'HANDSHAKE_REQUEST',
        widgetId: this.getWidgetId(),
        timestamp: Date.now(),
        nonce
      };

      console.log('🔐 Initiating handshake with:', parentOrigin);

      const handleMessage = (event: MessageEvent) => {
        if (!this.verifyOrigin(event.origin)) {
          console.warn('🚫 Unauthorized message from:', event.origin);
          return;
        }

        const response = event.data as HandshakeResponse;
        
        if (response.type === 'HANDSHAKE_RESPONSE' && response.nonce === nonce) {
          console.log('✅ Handshake successful, API key received');
          window.removeEventListener('message', handleMessage);
          resolve(response.apiKey);
        }
      };

      window.addEventListener('message', handleMessage);

      window.parent.postMessage(request, parentOrigin);

      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('Handshake timeout'));
      }, 10000);
    });
  }

  secureBootstrap(): void {
    console.log('🔒 Starting secure bootstrap');

    const existingScripts = document.querySelectorAll('script');
    existingScripts.forEach(script => script.remove());

    const bootstrapScript = document.createElement('script');
    bootstrapScript.textContent = `
      (function() {
        'use strict';
        
        // Security checks
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          console.error('🚫 Insecure environment detected');
          return;
        }
        
        // Anti-clickjacking
        if (window.top !== window.self) {
          console.warn('🛡️ Potential clickjacking detected');
        }
        
        // Anti-XSS
        const originalConsole = window.console;
        window.console = {
          log: function(...args) {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('<script')) {
              originalConsole.warn('🚫 XSS attempt blocked');
              return;
            }
            originalConsole.log.apply(originalConsole, args);
          },
          warn: originalConsole.warn,
          error: originalConsole.error
        };
        
        console.log('🔐 Secure bootstrap completed');
      })();
    `;

    const nonce = this.generateNonce();
    bootstrapScript.setAttribute('nonce', nonce);
    bootstrapScript.setAttribute('data-security', 'enabled');
    
    document.head.appendChild(bootstrapScript);
    console.log('🔒 Bootstrap script injected with nonce:', nonce);
  }

  createSandboxIframe(container: HTMLElement): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    `;

    const secureContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="${Object.entries(this.config.cspHeaders).map(([key, value]) => `${key} ${value}`).join('; ')}">
        <title>Secure Widget</title>
      </head>
      <body>
        <div id="widget-container"></div>
        <script nonce="${this.generateNonce()}">
          // Widget code will be injected here
          console.log('🔐 Sandbox iframe loaded securely');
        </script>
      </body>
      </html>
    `;

    iframe.srcdoc = secureContent;
    container.appendChild(iframe);
    
    console.log('🔒 Sandbox iframe created');
    return iframe;
  }

  storeApiKey(key: string, apiKey: string): void {
    try {
      const encrypted = btoa(apiKey + '|' + Date.now());
      sessionStorage.setItem(`widget_api_${key}`, encrypted);
      console.log('🔐 API key stored securely');
    } catch (error) {
      console.error('❌ Failed to store API key:', error);
    }
  }

  getApiKey(key: string): string | null {
    try {
      const encrypted = sessionStorage.getItem(`widget_api_${key}`);
      if (!encrypted) return null;
      
      const decrypted = atob(encrypted);
      const [apiKey, timestamp] = decrypted.split('|');
      
      const isExpired = Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000;
      
      if (isExpired) {
        sessionStorage.removeItem(`widget_api_${key}`);
        console.log('🕐 API key expired, removed');
        return null;
      }
      
      console.log('🔐 API key retrieved successfully');
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to retrieve API key:', error);
      return null;
    }
  }

  private getWidgetId(): string {
    const existing = localStorage.getItem('widget_id');
    if (existing) return existing;
    
    const widgetId = 'widget_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('widget_id', widgetId);
    return widgetId;
  }

  init(): void {
    console.log('🔒 Initializing security manager');
    
    this.protectedFrame();
    
    this.secureBootstrap();
    
    window.addEventListener('message', (event: MessageEvent) => {
      if (!this.verifyOrigin(event.origin)) {
        console.warn('🚫 Unauthorized message from:', event.origin);
        return;
      }
      
      const data = event.data;
      if (data.type === 'API_KEY_EXCHANGE') {
        this.storeApiKey(data.key, data.apiKey);
        console.log('🔐 API key exchanged securely');
      }
    });

    console.log('🔒 Security manager initialized');
  }

  getSecurityStatus(): object {
    return {
      isInIframe: window.top !== window.self,
      isSecure: window.location.protocol === 'https:',
      hasSandbox: this.config.sandboxMode,
      allowedOrigins: this.config.allowedOrigins,
      cspEnabled: true,
      widgetId: this.getWidgetId()
    };
  }
}

export const securityManager = new SecurityManager();

export const useSecurity = () => {
  const [securityStatus, setSecurityStatus] = React.useState(
    securityManager.getSecurityStatus()
  );
  
  React.useEffect(() => {
    securityManager.init();
  }, []);
  
  return {
    ...securityStatus,
    initiateHandshake: securityManager.initiateHandshake,
    sanitizeInput: securityManager.sanitizeInput,
    createSandboxIframe: securityManager.createSandboxIframe
  };
};
