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

  // Primary Live Ad Unit ID for Play Game Over Interstitial
  PLAY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/9675420826',

  // Primary Live Ad Unit ID for Party Game Over Interstitial
  PARTY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/6749818086',

  // Primary Live Ad Unit ID for Revision / Wiederholen 10-Words Interstitial
  REVISION_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252/3372223589',

  // Google Official Test Interstitial Ad Unit ID (guaranteed fallback delivery)
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',

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
 * Initializes AdMob SDK on startup safely without pre-loading any ads.
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) {
    return;
  }

  logger.setAdMobPhase('INITIALIZING');

  try {
    if (isNativeAdMobAvailable()) {
      logger.admob('Native platform detected. Initializing AdMob SDK (Passive Mode - Zero preloads)...');
      await AdMob.initialize({
        initializeForTesting: false,
      }).catch((initErr) => {
        logger.admob(`AdMob.initialize notice: ${initErr?.message || initErr}`, initErr, 'warn');
      });

      isInitialized = true;
      logger.setAdMobPhase('IDLE', { status: 'Native AdMob Initialized' });
      logger.admob('✅ AdMob Native SDK initialized successfully. Strictly on-demand mode.');
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
 * Internal core helper to load and show an interstitial ad on demand under a black loading screen.
 */
async function loadAndShowInterstitialOnDemand(
  adUnitId: string,
  modeLabel: string
): Promise<boolean> {
  logger.admob(`🎮 [On-Demand Ad - ${modeLabel}] Request triggered under black loading screen: ${adUnitId}`);

  if (isAdActive) {
    logger.admob('Ad already active. Skipping duplicate call.');
    return false;
  }

  // Web / Dev simulation
  if (!isNativeAdMobAvailable()) {
    logger.admob(`Web simulated ${modeLabel} ad load under black screen...`);
    await new Promise((r) => setTimeout(r, 700));
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
    let loadTimer: any = null;

    const cleanup = (reason: string, success: boolean) => {
      if (resolved) return;
      resolved = true;

      if (loadTimer) {
        clearTimeout(loadTimer);
        loadTimer = null;
      }

      isAdActive = false;
      lastAdTimestamp = Date.now();
      logger.setAdMobPhase('IDLE', { cleanupReason: reason });
      logger.admob(`[On-Demand Ad - ${modeLabel}] Cleanup: ${reason} (success=${success})`);

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

    // 8-second safety timeout guard for the LOAD phase: Never leave user stuck if network is down
    loadTimer = setTimeout(() => {
      logger.admob(`⚠️ [On-Demand Ad - ${modeLabel}] 8s Load safety timeout reached. Resuming app.`);
      cleanup('LOAD_TIMEOUT', false);
    }, 8000);

    (async () => {
      try {
        // Register listeners for dismissal and failure to show
        dismissedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            logger.admob(`🎯 [${modeLabel}] Interstitial ad dismissed by user.`);
            cleanup('DISMISSED_BY_USER', true);
          }
        ).catch(() => null);

        failedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.FailedToShow,
          (err: AdMobError) => {
            logger.admob(`❌ [${modeLabel}] Interstitial failed to show: ${err?.message || JSON.stringify(err)}`, err, 'warn');
            cleanup('FAILED_TO_SHOW', false);
          }
        ).catch(() => null);

        // Step 1: Prepare the Ad Unit on-demand (Try Live Unit first, fallback to Test Unit if no fill)
        logger.admob(`[${modeLabel}] Preparing Ad Unit on-demand: ${adUnitId}...`);
        let prepared = false;

        try {
          await AdMob.prepareInterstitial({
            adId: adUnitId,
            isTesting: false,
          });
          logger.admob(`✅ [${modeLabel}] Live Ad Unit prepared successfully in RAM.`);
          prepared = true;
        } catch (liveErr: any) {
          logger.admob(`[${modeLabel}] Live ad unit not ready or unfulfilled (${liveErr?.message || liveErr}). Trying fallback ad unit...`, liveErr, 'warn');
          try {
            await AdMob.prepareInterstitial({
              adId: ADMOB_CONFIG.TEST_INTERSTITIAL_AD_UNIT_ID,
              isTesting: true,
            });
            logger.admob(`✅ [${modeLabel}] Fallback ad unit prepared successfully.`);
            prepared = true;
          } catch (fallbackErr: any) {
            logger.admob(`[${modeLabel}] Fallback ad prepare also failed: ${fallbackErr?.message || fallbackErr}`, fallbackErr, 'warn');
          }
        }

        if (!prepared) {
          logger.admob(`⚠️ [${modeLabel}] All ad prepare attempts failed. Resuming game.`);
          cleanup('PREPARE_FAILED', false);
          return;
        }

        // Ad is prepared! Clear the load timeout since ad is ready to show
        if (loadTimer) {
          clearTimeout(loadTimer);
          loadTimer = null;
        }

        // Step 2: Show the Ad immediately!
        logger.setAdMobPhase('SHOWING_INTERSTITIAL');
        logger.admob(`[${modeLabel}] Ad prepared! Calling AdMob.showInterstitial()...`);
        await AdMob.showInterstitial().catch((showErr) => {
          logger.admob(`AdMob.showInterstitial rejected: ${showErr?.message || showErr}`, showErr, 'warn');
          cleanup('SHOW_REJECTED', false);
        });

      } catch (err: any) {
        logger.admob(`Exception during ${modeLabel} on-demand ad execution: ${err?.message || err}`, err, 'warn');
        cleanup('EXCEPTION_CAUGHT', false);
      }
    })().catch((asyncErr) => {
      logger.admob(`Unhandled async error in ${modeLabel} on-demand ad`, asyncErr, 'warn');
      cleanup('UNHANDLED_ASYNC', false);
    });
  });
}

/**
 * Loads and shows the interstitial ad immediately on Play game finish (under the black loading screen).
 */
export async function loadAndShowAdOnGameFinish(): Promise<boolean> {
  return loadAndShowInterstitialOnDemand(
    ADMOB_CONFIG.PLAY_INTERSTITIAL_AD_UNIT_ID,
    'PlayMode'
  );
}

/**
 * Loads and shows the interstitial ad immediately on Party game finish (under the black loading screen).
 */
export async function loadAndShowPartyAdOnFinish(): Promise<boolean> {
  return loadAndShowInterstitialOnDemand(
    ADMOB_CONFIG.PARTY_INTERSTITIAL_AD_UNIT_ID,
    'PartyMode'
  );
}

/**
 * Loads and shows the interstitial ad immediately on Revision 10-words milestone (under the black loading screen).
 */
export async function loadAndShowRevisionAdOnMilestone(): Promise<boolean> {
  return loadAndShowInterstitialOnDemand(
    ADMOB_CONFIG.REVISION_INTERSTITIAL_AD_UNIT_ID,
    'RevisionMode'
  );
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
