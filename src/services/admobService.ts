import {
  AdMob,
  InterstitialAdPluginEvents,
  AdLoadInfo,
  AdMobError,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * AdMob Service for German Slang
 * Step 1: Preloaded Interstitial Ad on 'Play' Page
 * 
 * CRITICAL ARCHITECTURE:
 * - Ads are preloaded asynchronously in the background.
 * - `showInterstitial` is ONLY ever called when `isInterstitialLoaded` is TRUE.
 * - This completely prevents the blank white screen caused by calling show on an unloaded ad.
 */

export const ADMOB_CONFIG = {
  // Application ID
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',

  // Primary Ad Unit ID for Play Game Over Interstitial
  PLAY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/8011089596',

  // Test Interstitial Ad Unit (Used in testing devices)
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',

  // Minimum interval between ads to protect UX
  MIN_AD_INTERVAL_MS: 5000,
};

let isInitialized = false;
let isListenersRegistered = false;
let isPreparing = false;
let isInterstitialLoaded = false;
let isInterstitialShowing = false;
let lastAdTimestamp = 0;

/**
 * Checks if AdMob is running in native Capacitor environment
 */
export function isNativeAdMobAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(Capacitor.isNativePlatform());
}

/**
 * Returns current ad readiness state
 */
export function getAdMobState() {
  return {
    isInitialized,
    isInterstitialLoaded,
    isInterstitialShowing,
    isPreparing,
    timeSinceLastAdMs: Date.now() - lastAdTimestamp,
  };
}

/**
 * Check if cooldown window has passed
 */
export function canShowAd(): { allowed: boolean; reason?: string } {
  if (isInterstitialShowing) {
    return { allowed: false, reason: 'Interstitial is currently showing' };
  }
  if (!isInterstitialLoaded) {
    return { allowed: false, reason: 'Ad is not yet loaded in memory' };
  }
  const now = Date.now();
  const elapsed = now - lastAdTimestamp;
  if (elapsed < ADMOB_CONFIG.MIN_AD_INTERVAL_MS) {
    return {
      allowed: false,
      reason: `Ad cooldown active (${elapsed}ms < ${ADMOB_CONFIG.MIN_AD_INTERVAL_MS}ms)`,
    };
  }
  return { allowed: true };
}

/**
 * Register global AdMob event listeners once
 */
async function registerAdMobListeners(): Promise<void> {
  if (isListenersRegistered || !isNativeAdMobAvailable()) return;

  try {
    // 1. Interstitial Loaded
    await AdMob.addListener(InterstitialAdPluginEvents.Loaded, (info: AdLoadInfo) => {
      isInterstitialLoaded = true;
      isPreparing = false;
      logger.setAdMobPhase('AD_READY_IN_MEMORY', info);
      logger.admob('✅ Interstitial ad preloaded & ready in memory');
    }).catch(() => null);

    // 2. Interstitial Failed to Load
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (err: AdMobError) => {
      isInterstitialLoaded = false;
      isPreparing = false;
      logger.setAdMobPhase('IDLE', { failedToLoad: err });
      logger.admob(`ℹ️ Interstitial ad background load notice: ${err?.message || 'No fill / loading'}`, err, 'warn');
    }).catch(() => null);

    // 3. Interstitial Showed
    await AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      isInterstitialShowing = true;
      isInterstitialLoaded = false;
      lastAdTimestamp = Date.now();
      logger.setAdMobPhase('SHOWING_INTERSTITIAL');
      logger.admob('📺 Interstitial ad is now displaying');
    }).catch(() => null);

    // 4. Interstitial Dismissed
    await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      isInterstitialShowing = false;
      isInterstitialLoaded = false;
      lastAdTimestamp = Date.now();
      logger.setAdMobPhase('IDLE', { status: 'Dismissed by user' });
      logger.admob('🎯 Interstitial closed. Preloading next ad in background...');
      
      // Automatically preload the next ad for future game sessions
      setTimeout(() => {
        preloadPlayInterstitial();
      }, 2500);
    }).catch(() => null);

    // 5. Interstitial Failed to Show
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, (err: AdMobError) => {
      isInterstitialShowing = false;
      isInterstitialLoaded = false;
      logger.setAdMobPhase('IDLE', { failedToShow: err });
      logger.admob(`❌ Interstitial failed to show: ${err?.message || JSON.stringify(err)}`, err, 'warn');

      setTimeout(() => {
        preloadPlayInterstitial();
      }, 2500);
    }).catch(() => null);

    isListenersRegistered = true;
    logger.admob('AdMob event listeners registered successfully.');
  } catch (err: any) {
    logger.admob(`Failed to register AdMob listeners: ${err?.message || err}`, err, 'warn');
  }
}

/**
 * Initializes AdMob SDK on startup safely.
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) {
    return;
  }

  logger.setAdMobPhase('INITIALIZING');

  try {
    if (isNativeAdMobAvailable()) {
      logger.admob('Native platform detected. Initializing AdMob SDK...');
      await AdMob.initialize({
        initializeForTesting: true,
      }).catch((initErr: any) => {
        logger.admob(`AdMob.initialize notice: ${initErr?.message || initErr}`, initErr, 'warn');
      });

      isInitialized = true;
      logger.setAdMobPhase('IDLE', { status: 'Native AdMob Initialized' });
      logger.admob('✅ AdMob Native SDK initialized.');

      // Setup listeners & initiate initial background preload
      await registerAdMobListeners();
      preloadPlayInterstitial();
      return;
    }

    isInitialized = true;
    logger.setAdMobPhase('IDLE', { status: 'Web Simulated Mode' });
    logger.admob('ℹ️ AdMob initialized in Web Simulation mode.');
  } catch (error: any) {
    logger.setAdMobPhase('INIT_FAILED', { error: error?.message || error });
    logger.admob(`AdMob init notice: ${error?.message || error}`, error, 'warn');
  }
}

/**
 * Preload Play Interstitial Ad in background.
 * Call this whenever a game starts or when app mounts.
 */
export async function preloadPlayInterstitial(isTesting = false): Promise<void> {
  if (!isNativeAdMobAvailable() || isPreparing || isInterstitialLoaded || isInterstitialShowing) {
    return;
  }

  isPreparing = true;
  logger.setAdMobPhase('PRELOADING_AD');
  logger.admob(`🔄 Preloading interstitial ad in background (${ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID})...`);

  try {
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID,
      isTesting,
    }).catch(async (primaryErr: any) => {
      logger.admob(`Primary ad unit preload failed (${primaryErr?.message || primaryErr}). Trying official test unit fallback...`, null, 'warn');
      // Fallback to test unit if primary unit is pending approval
      await AdMob.prepareInterstitial({
        adId: ADMOB_CONFIG.TEST_INTERSTITIAL_AD_UNIT_ID,
        isTesting: true,
      }).catch((fallbackErr: any) => {
        logger.admob(`Fallback test unit prepare notice: ${fallbackErr?.message || fallbackErr}`, fallbackErr, 'warn');
        isPreparing = false;
        isInterstitialLoaded = false;
      });
    });
  } catch (err: any) {
    isPreparing = false;
    isInterstitialLoaded = false;
    logger.admob(`Preload exception: ${err?.message || err}`, err, 'warn');
  }
}

/**
 * Displays the Interstitial Ad right after finishing the 'Play' game.
 * ONLY shows if the ad is already loaded in memory to completely avoid blank white screens.
 */
export async function showPlayGameOverAd(): Promise<boolean> {
  logger.admob('🎮 showPlayGameOverAd requested');

  if (!isNativeAdMobAvailable()) {
    logger.admob('Play ad: Web simulation mode (non-native). Returning simulated success.');
    lastAdTimestamp = Date.now();
    return true;
  }

  // If ad is not ready yet, DO NOT OPEN AD ACTIVITY (avoids blank white screen)
  if (!isInterstitialLoaded) {
    logger.admob('⚠️ Ad is not loaded in memory yet. Skipping display to prevent blank screen, preloading now for next time.');
    preloadPlayInterstitial();
    return false;
  }

  const check = canShowAd();
  if (!check.allowed) {
    logger.admob(`Ad skipped: ${check.reason}`);
    return false;
  }

  try {
    logger.setAdMobPhase('CALLING_SHOW_INTERSTITIAL');
    logger.admob('Calling AdMob.showInterstitial()...');
    await AdMob.showInterstitial();
    return true;
  } catch (err: any) {
    isInterstitialShowing = false;
    isInterstitialLoaded = false;
    logger.setAdMobPhase('IDLE', { error: err?.message || err });
    logger.admob(`showInterstitial exception: ${err?.message || err}`, err, 'warn');
    preloadPlayInterstitial();
    return false;
  }
}

/**
 * Standard alias for the play game over ad
 */
export async function showGoogleInterstitialAd(_isTesting = true): Promise<boolean> {
  return showPlayGameOverAd();
}

/**
 * General load and show interstitial helper (used for testing or diagnostics)
 */
export async function loadAndShowInterstitialAd(_isTesting = true): Promise<boolean> {
  if (!isInterstitialLoaded) {
    await preloadPlayInterstitial();
    // Give it a brief 1.5s check
    await new Promise((r) => setTimeout(r, 1500));
  }
  return showPlayGameOverAd();
}

/**
 * Preload helper
 */
export async function preloadRewardVideoAd(_isTesting = true): Promise<void> {
  // Kept clean for later step
}

/**
 * Rewarded Video Ad helper (direct reward for clean testing)
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void,
  _isTesting = true
): Promise<boolean> {
  try {
    onRewarded();
  } catch (err) {
    logger.error('Error executing reward callback', err);
  }
  return true;
}
