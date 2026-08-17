import { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Google AdMob Integration Service
 * Configured for instant Zero-Delay display with background pre-caching and Rewarded Video Ads.
 * 
 * Features:
 * - Proactive Background Pre-caching (Ad is already buffered in RAM before game ends)
 * - 0.0s instant fallback (never blocks the UI thread with synchronous network requests)
 * - Rewarded Video Ads for high-eCPM monetization (Double XP, Hints, Avatar Unlock)
 * - Automatic re-buffering after dismissal
 * - Frequency cooldown protection
 */

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622',
  REWARDED_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9100121622', // Can use rewarded ID or fallback
  // Minimum time between interstitial ads (40 seconds cooldown to prevent spam)
  MIN_AD_INTERVAL_MS: 40000,
};

let isInitialized = false;
let isInterstitialLoaded = false;
let isLoadingInterstitial = false;
let isInterstitialShowing = false;

let isRewardLoaded = false;
let isLoadingReward = false;
let isRewardShowing = false;

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
 * Preloads the interstitial ad silently into device RAM in the background.
 * Completely eliminates loading delays and white screen freezes.
 */
export async function preloadInterstitialAd(isTesting = false): Promise<void> {
  if (!isNativeAdMobAvailable() || isInterstitialLoaded || isLoadingInterstitial) return;

  try {
    isLoadingInterstitial = true;
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
      isTesting,
    });
    isInterstitialLoaded = true;
    isLoadingInterstitial = false;
    console.log('✅ Google AdMob Interstitial pre-cached in memory.');
  } catch (error) {
    console.warn('AdMob background preload notice:', error);
    isInterstitialLoaded = false;
    isLoadingInterstitial = false;
  }
}

/**
 * Preloads Rewarded Video Ad silently in the background
 */
export async function preloadRewardVideoAd(isTesting = false): Promise<void> {
  if (!isNativeAdMobAvailable() || isRewardLoaded || isLoadingReward) return;

  try {
    isLoadingReward = true;
    await AdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
      isTesting,
    });
    isRewardLoaded = true;
    isLoadingReward = false;
    console.log('✅ Google AdMob Rewarded Video pre-cached in memory.');
  } catch (error) {
    console.warn('Rewarded ad preload notice:', error);
    isRewardLoaded = false;
    isLoadingReward = false;
  }
}

/**
 * Initializes AdMob SDK and begins pre-caching ads immediately on app startup.
 */
export async function initializeAdMob(isTesting = false): Promise<void> {
  if (isInitialized) return;

  try {
    if (isNativeAdMobAvailable()) {
      await AdMob.initialize({
        initializeForTesting: isTesting,
      });

      // Register native event listeners for Interstitials
      try {
        AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
          isInterstitialLoaded = false;
          isInterstitialShowing = false;
          lastAdTimestamp = Date.now();
          // Silently buffer the next ad in background after 1.5 seconds
          setTimeout(() => preloadInterstitialAd(isTesting), 1500);
        });

        AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
          isInterstitialLoaded = false;
          isLoadingInterstitial = false;
        });

        AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
          isInterstitialLoaded = true;
          isLoadingInterstitial = false;
        });

        // Register native event listeners for Rewarded Video
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          isRewardLoaded = false;
          isRewardShowing = false;
          setTimeout(() => preloadRewardVideoAd(isTesting), 1500);
        });

        AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
          isRewardLoaded = false;
          isLoadingReward = false;
        });

        AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
          isRewardLoaded = true;
          isLoadingReward = false;
        });
      } catch (listenerErr) {
        console.warn('AdMob listener setup warning:', listenerErr);
      }

      isInitialized = true;
      console.log('✅ Google AdMob Native SDK initialized.');

      // Pre-load ads in background immediately
      preloadInterstitialAd(isTesting);
      preloadRewardVideoAd(isTesting);
      return;
    }

    isInitialized = true;
  } catch (error) {
    console.warn('Google AdMob initialization notice:', error);
  }
}

/**
 * Displays the pre-cached Interstitial Ad with ZERO waiting time.
 * If the ad is NOT pre-loaded in memory, it skips immediately (0.0s delay)
 * rather than hanging the app on a white screen while downloading.
 */
export async function showGoogleInterstitialAd(isTesting = false): Promise<boolean> {
  if (!canShowAd()) {
    return false;
  }

  // 1. Native Capacitor AdMob
  if (isNativeAdMobAvailable()) {
    // If not already in memory, do NOT stall the screen!
    if (!isInterstitialLoaded) {
      console.info('Ad not in RAM yet — skipping to prevent white screen delay & pre-loading in background.');
      preloadInterstitialAd(isTesting);
      return false;
    }

    isInterstitialShowing = true;

    try {
      // Race show against a 500ms safety timeout to prevent hanging UI
      const showPromise = AdMob.showInterstitial();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Ad show timeout')), 500)
      );

      await Promise.race([showPromise, timeoutPromise]);
      isInterstitialLoaded = false;
      isInterstitialShowing = false;
      lastAdTimestamp = Date.now();
      setTimeout(() => preloadInterstitialAd(isTesting), 2000);
      return true;
    } catch (err) {
      console.warn('AdMob instant show bypassed:', err);
      isInterstitialShowing = false;
      isInterstitialLoaded = false;
      setTimeout(() => preloadInterstitialAd(isTesting), 2000);
      return false;
    }
  }

  lastAdTimestamp = Date.now();
  return false;
}

/**
 * Displays a Rewarded Video Ad and calls onRewarded when user completes it.
 * Rewarded ads have 3x-5x higher eCPM ($15-$35 vs $2-$5).
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  isTesting = false
): Promise<boolean> {
  if (isNativeAdMobAvailable()) {
    isRewardShowing = true;

    try {
      // If not loaded, prepare it
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

      setTimeout(() => preloadRewardVideoAd(isTesting), 2000);
      return rewardGiven;
    } catch (err) {
      console.warn('Rewarded ad failed to show:', err);
      isRewardShowing = false;
      isRewardLoaded = false;
      setTimeout(() => preloadRewardVideoAd(isTesting), 2000);
      return false;
    }
  }

  // Web simulation for testing/desktop preview
  onRewarded();
  return true;
}




