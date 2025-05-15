/**
 * PrismJS XSS Protection Loader
 * 
 * This script automatically loads the XSS protection for PrismJS
 * when imported in Sanity Studio.
 */

import './prismjs-xss-protection.js';

console.log('[Security] PrismJS XSS protection loaded');

// Export a helper function to check if protection is active
export function isPrismJsProtectionActive() {
  if (typeof window === 'undefined' || typeof Prism === 'undefined') {
    return false;
  }
  
  // Check if the tokenize function has been patched
  const tokenizeStr = Prism.tokenize.toString();
  return tokenizeStr.includes('XSS') || tokenizeStr.includes('Security');
}

// Auto-initialization
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const isProtected = isPrismJsProtectionActive();
    console.log(`[Security] PrismJS protection status: ${isProtected ? 'ACTIVE' : 'INACTIVE'}`);
    
    // Add to window for debugging purposes
    window.__securityStatus = {
      prismJsProtection: isProtected
    };
  });
}
