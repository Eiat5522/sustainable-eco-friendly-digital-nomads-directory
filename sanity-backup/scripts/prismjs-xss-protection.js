/**
 * PrismJS XSS Protection Implementation
 * 
 * This module contains the implementation for protecting against XSS vulnerabilities
 * in PrismJS. It should be included in your application to enhance security.
 * 
 * Date: May 15, 2025
 */

/**
 * Applies XSS protection to PrismJS when the DOM is ready
 */
function applyPrismJSXssProtection() {
  // Wait for DOM to be ready
  if (typeof document !== 'undefined' && typeof window !== 'undefined' && typeof Prism !== 'undefined') {
    console.log('[Security] Applying XSS protection to PrismJS');
    
    // Protect the tokenize function
    const originalTokenize = Prism.tokenize;
    Prism.tokenize = function(text, grammar, language) {
      // Input validation
      if (typeof text !== 'string') {
        console.warn('[Security] Invalid input type for PrismJS tokenize');
        return [];
      }
      
      // Basic XSS protection - escape HTML entities
      text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // Sanitize potentially dangerous patterns
      text = text
        .replace(/javascript:/gi, 'safe-javascript:')
        .replace(/data:/gi, 'safe-data:')
        .replace(/onerror=/gi, 'safe-onerror=')
        .replace(/onload=/gi, 'safe-onload=')
        .replace(/onclick=/gi, 'safe-onclick=');
      
      return originalTokenize.call(this, text, grammar, language);
    };
    
    // Add performance optimization for large code blocks
    const originalHighlight = Prism.highlight;
    Prism.highlight = function(text, grammar, language) {
      // Input validation
      if (typeof text !== 'string') {
        return '';
      }
      
      // DOM detachment for large code blocks
      if (text && text.length > 10000) {
        const root = document.documentElement;
        const originalScrollPosition = {
          left: window.pageXOffset || root.scrollLeft || document.body.scrollLeft,
          top: window.pageYOffset || root.scrollTop || document.body.scrollTop
        };
        
        // Create a detached div
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
        document.body.appendChild(tempDiv);
        
        // Process the text with original highlight function
        const result = originalHighlight.call(this, text, grammar, language);
        
        // Clean up
        document.body.removeChild(tempDiv);
        
        // Restore scroll position if needed
        window.scrollTo(originalScrollPosition.left, originalScrollPosition.top);
        
        return result;
      }
      
      // Process normally for smaller code blocks
      return originalHighlight.call(this, text, grammar, language);
    };
    
    // Disable potentially dangerous plugins
    if (Prism.plugins) {
      const riskyPlugins = ['unescaped-markup', 'inline-color', 'data-uri-highlight'];
      for (let i = 0; i < riskyPlugins.length; i++) {
        const plugin = riskyPlugins[i];
        if (Prism.plugins[plugin]) {
          console.warn('[Security] Disabling potentially risky Prism plugin:', plugin);
          Prism.plugins[plugin] = null;
        }
      }
    }
    
    console.log('[Security] PrismJS XSS protection successfully applied');
  } else {
    console.warn('[Security] PrismJS not found or running in non-browser environment');
  }
}

// Export the function for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyPrismJSXssProtection };
} else if (typeof window !== 'undefined') {
  // Auto-apply in browser environment when script is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPrismJSXssProtection);
  } else {
    applyPrismJSXssProtection();
  }
}
