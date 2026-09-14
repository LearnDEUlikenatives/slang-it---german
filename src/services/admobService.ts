import { AdMob, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * Google AdMob Integration Service with Deep Lifecycle Logging
 * Tracks state transitions, preparation phases, and event listeners
 * to diagnose unhandled promise rejections or white-screen collisions.
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
  const available = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  return available;
}

/**
 * Check if cooldown window has passed
 */
export function canShowAd(): { allowed: boolean; reason?: string } {
  if (isInterstitialShowing) {
    return { allowed: false, reason: 'Interstitial already in active showing state' };
  }
  if (isRewardShowing) {
    return { allowed: false, reason: 'Reward ad already in active showing state' };
  }
  const now = Date.now();
  const elapsed = now - lastAdTimestamp;
  if (elapsed < ADMOB_CONFIG.MIN_AD_INTERVAL_MS) {
    return {
      allowed: false,
      reason: `In cooldown window (${elapsed}ms < ${ADMOB_CONFIG.MIN_AD_INTERVAL_MS}ms)`,
    };
  }
  return { allowed: true };
}

/**
 * Initializes AdMob SDK.
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) {
    logger.admob('AdMob initialize called, but already initialized');
    return;
  }

  logger.setAdMobPhase('INITIALIZING');

  try {
    if (isNativeAdMobAvailable()) {
      logger.admob('Native AdMob platform detected. Initializing with test devices support...');
      await AdMob.initialize({
        initializeForTesting: true,
      });

      isInitialized = true;
      logger.setAdMobPhase('IDLE', { status: 'Native SDK Initialized' });
      logger.admob('✅ Google AdMob Native SDK initialized successfully.');
      return;
    }

    isInitialized = true;
    logger.setAdMobPhase('IDLE', { status: 'Web Simulated Mode' });
    logger.admob('ℹ️ AdMob initialized in Web Simulation mode.');
  } catch (error: any) {
    logger.setAdMobPhase('INIT_FAILED', { error: error?.message || error });
    logger.admob(`❌ AdMob initialization failure: ${error?.message || error}`, error, 'error');
  }
}

/**
 * Loads and shows the interstitial ad safely with full state logging.
 */
export async function loadAndShowInterstitialAd(forceTesting = true): Promise<boolean> {
  const check = canShowAd();
  if (!check.allowed) {
    logger.admob(`Interstitial skipped: ${check.reason}`);
    return false;
  }

  if (!isNativeAdMobAvailable()) {
    logger.admob('loadAndShowInterstitialAd: Running on Web/Browser. Returning simulated success.');
    lastAdTimestamp = Date.now();
    return true;
  }

  logger.setAdMobPhase('PREPARING_INTERSTITIAL');
  isInterstitialShowing = true;

  return new Promise<boolean>(async (resolve) => {
    let resolved = false;
    let dismissedListener: any = null;
    let failedListener: any = null;

    const cleanup = (reason: string) => {
      if (resolved) return;
      resolved = true;
      isInterstitialShowing = false;
      lastAdTimestamp = Date.now();
      logger.setAdMobPhase('IDLE', { cleanupReason: reason });
      logger.admob(`Interstitial cleanup completed: ${reason}`);

      if (dismissedListener && typeof dismissedListener.remove === 'function') {
        try { dismissedListener.remove(); } catch (e) {
          logger.admob('Error removing dismissedListener', e, 'warn');
        }
      }
      if (failedListener && typeof failedListener.remove === 'function') {
        try { failedListener.remove(); } catch (e) {
          logger.admob('Error removing failedListener', e, 'warn');
        }
      }
    };

    // Safety timeout: Never hang the app if ad fails to notify
    const safetyTimer = setTimeout(() => {
      logger.admob('⚠️ Interstitial safety timeout triggered after 10000ms', null, 'warn');
      cleanup('SAFETY_TIMEOUT_EXPIRED');
      resolve(false);
    }, 10000);

    try {
      logger.admob('Registering InterstitialAdPluginEvents listeners...');
      
      dismissedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          logger.admob('🎯 InterstitialAdPluginEvents.Dismissed received.');
          clearTimeout(safetyTimer);
          cleanup('DISMISSED_EVENT_RECEIVED');
          resolve(true);
        }
      );

      failedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        (err) => {
          logger.admob(`❌ InterstitialAdPluginEvents.FailedToShow received: ${JSON.stringify(err)}`, err, 'error');
          clearTimeout(safetyTimer);
          cleanup('FAILED_TO_SHOW_EVENT');
          resolve(false);
        }
      );

      // 1. Prepare Interstitial
      logger.setAdMobPhase('PREPARING_CALL', { adUnit: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID });
      try {
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
          isTesting: forceTesting,
        });
        logger.admob('Primary ad unit prepared successfully.');
      } catch (prepareErr: any) {
        logger.admob(`Primary ad unit prepare failed (${prepareErr?.message || prepareErr}). Trying official Google test unit...`, null, 'warn');
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.TEST_INTERSTITIAL_AD_UNIT_ID,
          isTesting: true,
        });
        logger.admob('Fallback test ad unit prepared successfully.');
      }

      // 2. Show Interstitial
      logger.setAdMobPhase('SHOWING_INTERSTITIAL');
      logger.admob('Calling AdMob.showInterstitial()...');
      await AdMob.showInterstitial();
      logger.admob('AdMob.showInterstitial() promise resolved.');
    } catch (err: any) {
      logger.setAdMobPhase('ERROR', { error: err?.message || err });
      logger.admob(`❌ AdMob loadAndShow caught unhandled error: ${err?.message || err}`, err, 'error');
      clearTimeout(safetyTimer);
      cleanup('ERROR_CAUGHT_DURING_SHOW');
      resolve(false);
    }
  });
}

/**
 * Wrapper for legacy calls - calls loadAndShowInterstitialAd
 */
export async function showGoogleInterstitialAd(isTesting = true): Promise<boolean> {
  logger.admob('showGoogleInterstitialAd wrapper invoked');
  return loadAndShowInterstitialAd(isTesting);
}

/**
 * Preloads Rewarded Video Ad silently in the background
 */
export async function preloadRewardVideoAd(isTesting = true): Promise<void> {
  logger.admob('preloadRewardVideoAd invoked');
}

/**
 * Displays a Rewarded Video Ad with full event logging.
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  isTesting = true
): Promise<boolean> {
  logger.admob('showGoogleRewardVideoAd invoked');

  if (isNativeAdMobAvailable()) {
    isRewardShowing = true;
    logger.setAdMobPhase('PREPARING_REWARD');

    try {
      if (!isRewardLoaded) {
        try {
          await AdMob.prepareRewardVideoAd({
            adId: ADMOB_CONFIG.REWARDED_AD_UNIT_ID,
            isTesting,
          });
          logger.admob('Rewarded ad unit prepared.');
        } catch {
          logger.admob('Rewarded primary failed. Using fallback test unit.', null, 'warn');
          await AdMob.prepareRewardVideoAd({
            adId: ADMOB_CONFIG.TEST_REWARDED_AD_UNIT_ID,
            isTesting: true,
          });
        }
      }

      let rewardGiven = false;
      const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        logger.admob('🎉 RewardAdPluginEvents.Rewarded triggered! Granting reward.');
        rewardGiven = true;
        onRewarded();
      });

      logger.setAdMobPhase('SHOWING_REWARD');
      await AdMob.showRewardVideoAd();
      logger.admob('Reward video completed / closed.');
      isRewardLoaded = false;
      isRewardShowing = false;
      logger.setAdMobPhase('IDLE');

      try {
        rewardListener.remove();
      } catch {}

      return rewardGiven;
    } catch (err: any) {
      logger.setAdMobPhase('IDLE', { error: err?.message || err });
      logger.admob(`❌ Rewarded ad failed to show: ${err?.message || err}`, err, 'error');
      isRewardShowing = false;
      isRewardLoaded = false;
      return false;
    }
  }

  // Web simulation for testing/desktop preview
  logger.admob('Web simulation reward granted.');
  onRewarded();
  return true;
}
