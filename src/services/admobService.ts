import {
  AdMob,
  InterstitialAdPluginEvents,
  AdMobError,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * AdMob Configuration for German Slang
 */
export const ADMOB_CONFIG = {
  // AdMob App ID
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',

  // Primary Ad Unit ID for Play Game Over Interstitial
  PLAY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/8011089596',

  // Official Test Ad Unit for guaranteed test device delivery
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',

  // Minimum interval between ads to protect UX
  MIN_AD_INTERVAL_MS: 4000,
};

let isInitialized = false;
let isAdActive = false;
let lastAdTimestamp = 0;

/**
 * Checks if AdMob is running in native Capacitor environment
 */
export function isNativeAdMobAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(Capacitor.isNativePlatform());
}

/**
 * Initializes AdMob SDK on startup safely without preloading.
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) {
    return;
  }

  logger.setAdMobPhase('INITIALIZING');

  try {
    if (isNativeAdMobAvailable()) {
      logger.admob('Native platform detected. Initializing AdMob SDK (No preloading mode)...');
      await AdMob.initialize({
        initializeForTesting: true,
      }).catch((initErr) => {
        logger.admob(`AdMob.initialize notice: ${initErr?.message || initErr}`, initErr, 'warn');
      });

      isInitialized = true;
      logger.setAdMobPhase('IDLE', { status: 'Native AdMob Initialized' });
      logger.admob('✅ AdMob Native SDK initialized successfully (On-Demand Load mode).');
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
 * Loads and shows the interstitial ad immediately on game finish (under the black screen overlay).
 * 
 * Flow:
 * 1. Black screen is displayed in the UI.
 * 2. Ad is requested and prepared on-demand.
 * 3. Once loaded, showInterstitial is called immediately.
 * 4. Resolves when the user dismisses the ad (or on fail/timeout), so the UI can safely remove the black screen.
 */
export async function loadAndShowAdOnGameFinish(forceTest = false): Promise<boolean> {
  logger.admob('🎮 [On-Demand Ad] loadAndShowAdOnGameFinish triggered under black screen overlay');

  if (isAdActive) {
    logger.admob('Ad already active. Skipping duplicate call.');
    return false;
  }

  // Web / Dev simulation
  if (!isNativeAdMobAvailable()) {
    logger.admob('Web simulated ad load under black screen...');
    await new Promise((r) => setTimeout(r, 600));
    lastAdTimestamp = Date.now();
    return true;
  }

  // Cooldown check
  const elapsed = Date.now() - lastAdTimestamp;
  if (elapsed < ADMOB_CONFIG.MIN_AD_INTERVAL_MS) {
    logger.admob(`Ad cooldown active (${elapsed}ms < ${ADMOB_CONFIG.MIN_AD_INTERVAL_MS}ms). Skipping ad.`);
    return false;
  }

  isAdActive = true;
  logger.setAdMobPhase('LOADING_ON_DEMAND');

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    let dismissedListener: any = null;
    let failedListener: any = null;
    let safetyTimer: any = null;

    const cleanup = (reason: string, success: boolean) => {
      if (resolved) return;
      resolved = true;

      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }

      isAdActive = false;
      lastAdTimestamp = Date.now();
      logger.setAdMobPhase('IDLE', { cleanupReason: reason });
      logger.admob(`[On-Demand Ad] Cleanup: ${reason} (success=${success})`);

      if (dismissedListener && typeof dismissedListener.remove === 'function') {
        try {
          dismissedListener.remove();
        } catch {}
      }
      if (failedListener && typeof failedListener.remove === 'function') {
        try {
          failedListener.remove();
        } catch {}
      }

      resolve(success);
    };

    // 6-second max safety timeout guard: Never leave the user stuck on the black screen
    safetyTimer = setTimeout(() => {
      logger.admob('⚠️ [On-Demand Ad] 6s Safety timeout expired. Resuming app seamlessly.');
      cleanup('SAFETY_TIMEOUT', false);
    }, 6000);

    (async () => {
      try {
        // Register listeners for dismissal / failure
        dismissedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            logger.admob('🎯 Interstitial ad dismissed by user.');
            cleanup('DISMISSED_BY_USER', true);
          }
        ).catch(() => null);

        failedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.FailedToShow,
          (err: AdMobError) => {
            logger.admob(`❌ Interstitial failed to show: ${err?.message || JSON.stringify(err)}`, err, 'warn');
            cleanup('FAILED_TO_SHOW', false);
          }
        ).catch(() => null);

        // Step 1: Prepare the Ad Unit
        logger.admob(`Preparing Ad Unit on-demand: ${ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID}...`);
        let prepared = false;

        try {
          await AdMob.prepareInterstitial({
            adId: ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID,
            isTesting: forceTest,
          });
          logger.admob('✅ Primary Ad Unit prepared successfully.');
          prepared = true;
        } catch (prepErr: any) {
          logger.admob(`Primary ad prepare notice (${prepErr?.message || prepErr}). Trying test unit fallback...`, null, 'warn');
          try {
            await AdMob.prepareInterstitial({
              adId: ADMOB_CONFIG.TEST_INTERSTITIAL_AD_UNIT_ID,
              isTesting: true,
            });
            logger.admob('✅ Test Ad Unit prepared successfully.');
            prepared = true;
          } catch (fallbackErr: any) {
            logger.admob(`Test unit prepare failed: ${fallbackErr?.message || fallbackErr}`, fallbackErr, 'warn');
          }
        }

        if (!prepared) {
          logger.admob('⚠️ Ad prepare failed. Removing black screen and resuming.');
          cleanup('PREPARE_FAILED', false);
          return;
        }

        // Step 2: Show the Ad
        logger.setAdMobPhase('SHOWING_INTERSTITIAL');
        logger.admob('Calling AdMob.showInterstitial()...');
        await AdMob.showInterstitial().catch((showErr) => {
          logger.admob(`AdMob.showInterstitial rejected: ${showErr?.message || showErr}`, showErr, 'warn');
          cleanup('SHOW_REJECTED', false);
        });

      } catch (err: any) {
        logger.admob(`Exception during on-demand ad execution: ${err?.message || err}`, err, 'warn');
        cleanup('EXCEPTION_CAUGHT', false);
      }
    })().catch((asyncErr) => {
      logger.admob('Unhandled async error in on-demand ad', asyncErr, 'warn');
      cleanup('UNHANDLED_ASYNC', false);
    });
  });
}

/**
 * Standard alias for the play game over ad
 */
export async function showGoogleInterstitialAd(forceTest = false): Promise<boolean> {
  return loadAndShowAdOnGameFinish(forceTest);
}

/**
 * General load and show interstitial helper (used for testing or diagnostics)
 */
export async function loadAndShowInterstitialAd(forceTest = false): Promise<boolean> {
  return loadAndShowAdOnGameFinish(forceTest);
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
