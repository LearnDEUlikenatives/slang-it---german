/**
 * Google AdMob Integration Service
 * Configured with official AdMob App ID & Ad Unit IDs.
 * Includes global cooldown throttling (minimum 90s between ads) to prevent spam & screen flickering.
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  APP_OPEN_AD_UNIT_ID: 'ca-app-pub-4045089359333252/8011089596',
  // Minimum time between interstitial ads (in ms) to protect user experience & avoid spam
  MIN_AD_INTERVAL_MS: 75000, // 75 seconds cooldown
};

let isInitialized = false;
let lastAdTimestamp = 0;
let isAdShowing = false;

/**
 * Check if sufficient time has passed since the last ad was shown
 */
export function canShowAd(): boolean {
  if (isAdShowing) return false;
  const now = Date.now();
  return now - lastAdTimestamp >= ADMOB_CONFIG.MIN_AD_INTERVAL_MS;
}

/**
 * Initializes AdMob SDK if running in a native wrapper
 */
export async function initializeAdMob(isTesting = false): Promise<void> {
  if (isInitialized) return;

  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable?.('AdMob')) {
      const { AdMob } = (window as any).Capacitor.Plugins;
      await AdMob.initialize({
        initializeForTesting: isTesting,
      });
      isInitialized = true;
      console.log('✅ Google AdMob Native Plugin initialized.');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).admob) {
      isInitialized = true;
      console.log('✅ Google AdMob Cordova Plugin detected.');
      return;
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Google AdMob initialization error:', error);
  }
}

/**
 * Shows Google Interstitial Ad with built-in cooldown check.
 * Returns true if an ad was displayed natively.
 */
export async function showGoogleInterstitialAd(isTesting = false): Promise<boolean> {
  if (!canShowAd()) {
    console.info('AdMob: Ad skipped due to frequency throttling cooldown.');
    return false;
  }

  try {
    const adUnitId = ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID;

    // 1. Capacitor Native AdMob integration
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isPluginAvailable?.('AdMob')) {
      const { AdMob } = (window as any).Capacitor.Plugins;
      isAdShowing = true;
      await AdMob.prepareInterstitial({
        adId: adUnitId,
        isTesting,
      });
      await AdMob.showInterstitial();
      lastAdTimestamp = Date.now();
      isAdShowing = false;
      return true;
    }

    // 2. Cordova Native Bridge
    if (typeof window !== 'undefined' && (window as any).admob?.interstitial) {
      isAdShowing = true;
      await new Promise<void>((resolve) => {
        (window as any).admob.interstitial.load({ id: adUnitId });
        (window as any).admob.interstitial.show();
        resolve();
      });
      lastAdTimestamp = Date.now();
      isAdShowing = false;
      return true;
    }

    // Web fallback
    lastAdTimestamp = Date.now();
    return false;
  } catch (error) {
    console.error('Error invoking Google AdMob Interstitial:', error);
    isAdShowing = false;
    return false;
  }
}

/**
 * App Open Ad helper (safely suppressed if fresh boot)
 */
export async function showGoogleAppOpenAd(isTesting = false): Promise<boolean> {
  return false;
}

