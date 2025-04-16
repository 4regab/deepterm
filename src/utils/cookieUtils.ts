/**
 * Cookie utility functions for DeepTerm
 * Handles cookie consent and management for compliance with privacy regulations
 */

// Check for browser environment before accessing window or document
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// Cookie consent levels
export enum ConsentLevel {
  ESSENTIAL = 'essential',
  ALL = 'all',
  DECLINED = 'declined'
}

// Cookie types
export enum CookieType {
  ESSENTIAL = 'essential',
  ANALYTICS = 'analytics',
  ADVERTISING = 'advertising'
}

// Google AdSense related cookie names (commonly used)
const ADSENSE_COOKIES = ['_gads', '_gac', '__gads', '__gpi', 'DSID', 'IDE', 'NID', 'TAID'];

/**
 * Get the current consent level
 * @returns {ConsentLevel} The current consent level
 */
export const getConsentLevel = (): ConsentLevel => {
  if (!isBrowser) return ConsentLevel.ESSENTIAL;
  
  const consent = window.localStorage.getItem('cookieConsent');
  if (consent === ConsentLevel.ALL || consent === ConsentLevel.ESSENTIAL || consent === ConsentLevel.DECLINED) {
    return consent as ConsentLevel;
  }
  return ConsentLevel.ESSENTIAL; // Default to essential only
};

/**
 * Check if a specific type of cookie is allowed based on current consent
 * @param {CookieType} type - The type of cookie to check
 * @returns {boolean} Whether this type of cookie is allowed
 */
export const isCookieTypeAllowed = (type: CookieType): boolean => {
  const consent = getConsentLevel();
  
  // Essential cookies are always allowed
  if (type === CookieType.ESSENTIAL) {
    return true;
  }
  
  // For analytics and advertising, only if ALL cookies are accepted
  if (consent === ConsentLevel.ALL) {
    return true;
  }
  
  return false;
};

/**
 * Enable or disable Google AdSense based on consent
 */
export const configureAdsense = (): void => {
  if (!isBrowser) return;
  
  if (window.adsbygoogle) {
    if (isCookieTypeAllowed(CookieType.ADVERTISING)) {
      // Enable ad requests
      window.adsbygoogle.pauseAdRequests = 0;
      window.adsbygoogle.requestNonPersonalizedAds = 0;
    } else if (getConsentLevel() === ConsentLevel.ESSENTIAL) {
      // Use non-personalized ads when only essential cookies are accepted
      window.adsbygoogle.pauseAdRequests = 0;
      window.adsbygoogle.requestNonPersonalizedAds = 1;
    } else {
      // Pause ad requests when cookies are declined
      window.adsbygoogle.pauseAdRequests = 1;
    }
  }
};

/**
 * Set the consent level and configure cookies accordingly
 * @param {ConsentLevel} level - The consent level to set
 */
export const setConsentLevel = (level: ConsentLevel): void => {
  if (!isBrowser) return;
  
  window.localStorage.setItem('cookieConsent', level);
  
  // Configure Google AdSense based on new consent level
  configureAdsense();
  
  // Clear non-essential cookies if consent is not "all"
  if (level !== ConsentLevel.ALL) {
    clearNonEssentialCookies();
  }
};

/**
 * Clear all non-essential cookies from the browser
 */
export const clearNonEssentialCookies = (): void => {
  if (!isBrowser) return;
  
  // Get all cookies
  const cookies = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
  
  // List of essential cookies that should not be removed
  const essentialCookies = ['deeptermSessionID', 'deeptermCookieConsent'];
  
  // Remove non-essential cookies
  cookies.forEach(name => {
    if (!essentialCookies.includes(name)) {
      // For advertising cookies, specifically remove them
      if (ADSENSE_COOKIES.some(adCookie => name.includes(adCookie)) || 
          name.includes('_ga') || 
          name.includes('_gid') || 
          name.includes('_gcl')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    }
  });
};

// No need to declare it here as it's already in adsbygoogle.d.ts

export default {
  getConsentLevel,
  setConsentLevel,
  isCookieTypeAllowed,
  configureAdsense,
  clearNonEssentialCookies,
  ConsentLevel,
  CookieType
};
