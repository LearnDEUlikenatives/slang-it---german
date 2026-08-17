import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Google AdMob Integration Service
 * Configured strictly for Interstitial Ads across the 3 core views (Play, Party, Revision).
 * App Open Ads are completely removed to prevent startup latency and visual glitches.
 * 
 * Features:
 * - Proactive Background Pre-caching (Instant ad display upon round/game completion)
 * - Automatic re-buffering after dismissal
 * - Intelligent frequency cooldown protection
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  // Minimum time between interstitial ads (45 seconds cooldown to avoid rapid spam)
  MIN_AD_INTERVAL_MS: 45000,
};

let isInitialized = false;
let isAdLoaded = false;
let isLoadingAd = false;
let isAdShowing = false;
let lastAdTimestamp = 0;

/**
 * Checks if AdMob is running in native Capacitor environment
 */
export function isNativeAdMobAvailable(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Check if cooldown window has passed
 */
export function canShowAd(): boolean {
  if (isAdShowing) return false;
  const now = Date.now();
  return now - lastAdTimestamp >= ADMOB_CONFIG.MIN_AD_INTERVAL_MS;
}

/**
 * Preloads the interstitial ad into device memory in the background.
 * This completely eliminates loading delays, flickering, and white screens.
 */
export async function preloadInterstitialAd(isTesting = false): Promise<void> {
  if (!isNativeAdMobAvailable() || isAdLoaded || isLoadingAd) return;

  try {
    isLoadingAd = true;
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
      isTesting,
    });
    isAdLoaded = true;
    isLoadingAd = false;
    console.log('✅ Google AdMob Interstitial pre-cached in memory.');
  } catch (error) {
    console.warn('AdMob background preload notice:', error);
    isAdLoaded = false;
    isLoadingAd = false;
  }
}

/**
 * Initializes AdMob SDK and begins pre-caching the first interstitial ad immediately.
 */
export async function initializeAdMob(isTesting = false): Promise<void> {
  if (isInitialized) return;

  try {
    if (isNativeAdMobAvailable()) {
      await AdMob.initialize({
        initializeForTesting: isTesting,
      });

      // Register native event listeners for lifecycle
      try {
        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          isAdLoaded = false;
          isAdShowing = false;
          lastAdTimestamp = Date.now();
          // Silently buffer the next ad in background
          setTimeout(() => preloadInterstitialAd(isTesting), 2000);
        });

        AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
          isAdLoaded = false;
          isLoadingAd = false;
        });

        AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
          isAdLoaded = true;
          isLoadingAd = false;
        });
      } catch (listenerErr) {
        console.warn('AdMob listener setup warning:', listenerErr);
      }

      isInitialized = true;
      console.log('✅ Google AdMob Native SDK initialized.');

      // Pre-load the first interstitial ad silently so it is ready when a user finishes a round
      preloadInterstitialAd(isTesting);
      return;
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Google AdMob initialization notice:', error);
  }
}

/**
 * Displays the pre-cached Google Interstitial Ad instantly with 0ms delay.
 * Returns true if displayed natively, false if falling back or on cooldown.
 */
export async function showGoogleInterstitialAd(isTesting = false): Promise<boolean> {
  if (!canShowAd()) {
    console.info('AdMob: Skipped due to cooldown interval.');
    return false;
  }

  // 1. Native Capacitor AdMob
  if (isNativeAdMobAvailable()) {
    isAdShowing = true;

    try {
      // If not pre-cached yet, load quickly
      if (!isAdLoaded) {
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
          isTesting,
        });
      }

      await AdMob.showInterstitial();
      isAdLoaded = false;
      isAdShowing = false;
      lastAdTimestamp = Date.now();
      // Silently pre-load the next ad in background
      setTimeout(() => preloadInterstitialAd(isTesting), 2000);
      return true;
    } catch (err) {
      console.warn('Native AdMob display notice:', err);
      isAdShowing = false;
      isAdLoaded = false;
      // Re-trigger preload for future attempts
      setTimeout(() => preloadInterstitialAd(isTesting), 3000);
      return false;
    }
  }

  // 2. Web fallback cooldown tracking
  lastAdTimestamp = Date.now();
  return false;
}



