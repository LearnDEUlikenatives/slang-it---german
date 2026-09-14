import { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Google AdMob Integration Service
 * Robust, event-driven ad management with automatic test unit fallback
 * so ads ALWAYS play during local development and testing builds.
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  // Production Ad Units
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  // Official Google AdMob Test Ad Units (Guaranteed 100% fill for testing)
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',
  TEST_REWARDED_AD_UNIT_ID: 'ca-app-pub-3940256099942544/5224354917',
  // Cooldown between interstitial ads (5s for test responsiveness)
  MIN_AD_INTERVAL_MS: 5000,
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
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) return;

  try {
    if (isNativeAdMobAvailable()) {
      await AdMob.initialize({
        initializeForTesting: true,
      });

      isInitialized = true;
      console.log('✅ Google AdMob Native SDK initialized with testing support.');
      return;
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Google AdMob initialization notice:', error);
  }
}

/**
 * Loads and shows the interstitial ad safely.
 * Tries the production ad unit first, with instant fallback to Google's test ad unit
 * so ads ALWAYS play during testing and development.
 */
export async function loadAndShowInterstitialAd(forceTesting = true): Promise<boolean> {
  if (!canShowAd()) return false;
  if (!isNativeAdMobAvailable()) {
    console.log('ℹ️ Running in web browser - AdMob simulated successfully.');
    return true;
  }

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

    // Safety timeout: Never hang the app if ad fails to notify
    const safetyTimer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 10000);

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

      // Attempt loading configured ID first, fallback to Google test ID if no fill
      try {
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
          isTesting: forceTesting,
        });
      } catch (prepareErr) {
        console.warn('Live Ad Unit returned no-fill, falling back to official Google test ad unit:', prepareErr);
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.TEST_INTERSTITIAL_AD_UNIT_ID,
          isTesting: true,
        });
      }

      // Show the loaded ad
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
export async function showGoogleInterstitialAd(isTesting = true): Promise<boolean> {
  return loadAndShowInterstitialAd(isTesting);
}

/**
 * Preloads Rewarded Video Ad silently in the background
 */
export async function preloadRewardVideoAd(isTesting = true): Promise<void> {
  // Rewarded ads are prepared on demand
}

/**
 * Displays a Rewarded Video Ad and calls onRewarded when user completes it.
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  isTesting = true
): Promise<boolean> {
  if (isNativeAdMobAvailable()) {
    isRewardShowing = true;

    try {
      if (!isRewardLoaded) {
        try {
          await AdMob.prepareRewardVideoAd({
            adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
            isTesting,
          });
        } catch {
          await AdMob.prepareRewardVideoAd({
            adId: ADMOB_CONFIG.TEST_REWARDED_AD_UNIT_ID,
            isTesting: true,
          });
        }
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
