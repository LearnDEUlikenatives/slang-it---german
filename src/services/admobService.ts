import { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

/**
 * Google AdMob Integration Service
 * Configured for on-demand loading to prevent white screen issues.
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
 * Loads and shows the interstitial ad on demand with a black loading overlay.
 */
export async function loadAndShowInterstitialAd(isTesting = false): Promise<boolean> {
  if (!canShowAd()) return false;
  if (!isNativeAdMobAvailable()) return false;

  isInterstitialShowing = true;

  // Create a temporary black overlay to mask the white screen flash
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'black';
  overlay.style.zIndex = '999999';
  document.body.appendChild(overlay);

  try {
    // 1. Prepare (Load) the ad
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
      isTesting,
    });

    // 2. Show the ad
    await AdMob.showInterstitial();
    
    // Remove overlay after ad is shown
    document.body.removeChild(overlay);
    
    isInterstitialShowing = false;
    lastAdTimestamp = Date.now();
    return true;
  } catch (err) {
    console.warn('AdMob loadAndShow failed:', err);
    
    // Remove overlay if ad fails
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
    
    isInterstitialShowing = false;
    return false;
  }
}

/**
 * Wrapper for legacy calls - now just calls loadAndShowInterstitialAd
 */
export async function showGoogleInterstitialAd(isTesting = false): Promise<boolean> {
  return loadAndShowInterstitialAd(isTesting);
}

/**
 * Preloads Rewarded Video Ad silently in the background
 */
export async function preloadRewardVideoAd(isTesting = false): Promise<void> {
  // This is now effectively a placeholder as we've moved to on-demand loading for Interstitials,
  // but keeping it to avoid breaking other parts of the app.
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




