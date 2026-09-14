import { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Google AdMob Integration Service
 * Robust, event-driven ad management without raw DOM side-effects.
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  // Minimum time between interstitial ads (40 seconds cooldown to prevent spam)
  MIN_AD_INTERVAL_MS: 40000,
};

let isInitialized = false;
let isInterstitialShowing = false;
let isRewardShowing = false;
let isRewardLoaded = false;
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
  if (isInterstitialShowing || isRewardShowing) return false;
  const now = Date.now();
  return now - lastAdTimestamp >= ADMOB_CONFIG.MIN_AD_INTERVAL_MS;
}

/**
 * Initializes AdMob SDK.
 */
export async function initializeAdMob(isTesting = false): Promise<void> {
  if (isInitialized) return;

  try {
    if (isNativeAdMobAvailable()) {
      await AdMob.initialize({
        initializeForTesting: isTesting,
      });

      isInitialized = true;
      console.log('✅ Google AdMob Native SDK initialized.');
      return;
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Google AdMob initialization notice:', error);
  }
}

/**
 * Loads and shows the interstitial ad safely.
 * Uses native plugin events (Dismissed / FailedToShow) and a safety timeout
 * so the web view never hangs or encounters raw DOM collision.
 */
export async function loadAndShowInterstitialAd(isTesting = false): Promise<boolean> {
  if (!canShowAd()) return false;
  if (!isNativeAdMobAvailable()) return false;

  isInterstitialShowing = true;

  return new Promise<boolean>(async (resolve) => {
    let resolved = false;
    let dismissedListener: any = null;
    let failedListener: any = null;

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      isInterstitialShowing = false;
      lastAdTimestamp = Date.now();

      if (dismissedListener && typeof dismissedListener.remove === 'function') {
        try { dismissedListener.remove(); } catch {}
      }
      if (failedListener && typeof failedListener.remove === 'function') {
        try { failedListener.remove(); } catch {}
      }
    };

    // Safety timeout: Never let the app hang indefinitely if native ad fails to notify
    const safetyTimer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 12000);

    try {
      dismissedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          clearTimeout(safetyTimer);
          cleanup();
          resolve(true);
        }
      );

      failedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        (err) => {
          console.warn('AdMob failed to show interstitial:', err);
          clearTimeout(safetyTimer);
          cleanup();
          resolve(false);
        }
      );

      // 1. Prepare (Load) the ad
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
        isTesting,
      });

      // 2. Show the ad
      await AdMob.showInterstitial();
    } catch (err) {
      console.warn('AdMob loadAndShow failed:', err);
      clearTimeout(safetyTimer);
      cleanup();
      resolve(false);
    }
  });
}

/**
 * Wrapper for legacy calls - calls loadAndShowInterstitialAd
 */
export async function showGoogleInterstitialAd(isTesting = false): Promise<boolean> {
  return loadAndShowInterstitialAd(isTesting);
}

/**
 * Preloads Rewarded Video Ad silently in the background
 */
export async function preloadRewardVideoAd(isTesting = false): Promise<void> {
  // Rewarded ads are prepared on demand
}

/**
 * Displays a Rewarded Video Ad and calls onRewarded when user completes it.
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  isTesting = false
): Promise<boolean> {
  if (isNativeAdMobAvailable()) {
    isRewardShowing = true;

    try {
      if (!isRewardLoaded) {
        await AdMob.prepareRewardVideoAd({
          adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
          isTesting,
        });
      }

      let rewardGiven = false;
      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewardGiven = true;
        onRewarded();
      });

      await AdMob.showRewardVideoAd();
      isRewardLoaded = false;
      isRewardShowing = false;
      
      try {
        rewardListener.remove();
      } catch {}

      return rewardGiven;
    } catch (err) {
      console.warn('Rewarded ad failed to show:', err);
      isRewardShowing = false;
      isRewardLoaded = false;
      return false;
    }
  }

  // Web simulation for testing/desktop preview
  onRewarded();
  return true;
}
