import {
  AdMob,
  InterstitialAdPluginEvents,
  AdMobError,
} from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * Production AdMob Configuration for German Slang
 */
export const ADMOB_CONFIG = {
  // AdMob App ID
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',

  // Primary Live Ad Unit ID for Play Game Over Interstitial
  PLAY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/8011089596',

  // Minimum interval between ads to protect UX
  MIN_AD_INTERVAL_MS: 3000,
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
 * Initializes AdMob SDK on startup safely.
 * Strict rules:
 * - NO pre-loading of any ads on startup or mount.
 * - initializeForTesting: false (enables real AdMob ads for production unit).
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) {
    return;
  }

  logger.setAdMobPhase('INITIALIZING');

  try {
    if (isNativeAdMobAvailable()) {
      logger.admob('Native platform detected. Initializing AdMob SDK with live production ad unit...');
      await AdMob.initialize({
        initializeForTesting: false,
      }).catch((initErr) => {
        logger.admob(`AdMob.initialize notice: ${initErr?.message || initErr}`, initErr, 'warn');
      });

      isInitialized = true;
      logger.setAdMobPhase('IDLE', { status: 'Native AdMob Initialized (Live Mode)' });
      logger.admob('✅ AdMob Native SDK initialized successfully in Live Production Mode. Zero preloads.');
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
 * 2. Ad is requested and prepared on-demand strictly for your live ad unit.
 * 3. Once loaded, showInterstitial is called immediately.
 * 4. Resolves when the user dismisses the ad (or on fail/timeout), so the UI can safely remove the black screen.
 */
export async function loadAndShowAdOnGameFinish(): Promise<boolean> {
  logger.admob(`🎮 [On-Demand Ad] Requesting live ad unit (${ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID}) under black screen`);

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
      logger.admob('⚠️ [On-Demand Ad] Safety timeout reached. Resuming app seamlessly.');
      cleanup('SAFETY_TIMEOUT', false);
    }, 6000);

    (async () => {
      try {
        // Register listeners for dismissal / failure
        dismissedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            logger.admob('🎯 Live Interstitial ad dismissed by user.');
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

        // Step 1: Prepare the Real Live Ad Unit on-demand (No test mode)
        logger.admob(`Preparing live ad unit on demand: ${ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID}...`);
        await AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID,
          isTesting: false,
        });
        logger.admob('✅ Live Ad Unit prepared successfully in RAM.');

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
export async function showGoogleInterstitialAd(): Promise<boolean> {
  return loadAndShowAdOnGameFinish();
}

/**
 * General load and show interstitial helper (used for testing or diagnostics)
 */
export async function loadAndShowInterstitialAd(): Promise<boolean> {
  return loadAndShowAdOnGameFinish();
}

/**
 * Rewarded Video Ad helper (direct reward for clean testing)
 */
export async function showGoogleRewardVideoAd(
  onRewarded: () => void
): Promise<boolean> {
  try {
    onRewarded();
  } catch (err) {
    logger.error('Error executing reward callback', err);
  }
  return true;
}
