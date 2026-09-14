import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * AdMob Service for German Slang
 * Step 1 Integration: Interstitial Ad on 'Play' Page after Game Finish
 */

export const ADMOB_CONFIG = {
  // Application ID
  APP_ID: 'ca-app-pub-4045089359333252~3927685995',

  // Primary Ad Unit ID for Play Game Over Interstitial
  PLAY_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-4045089359333252~3927685995',

  // Alternate formatted candidates if standard format differs
  CANDIDATE_AD_UNITS: [
    'ca-app-pub-4045089359333252~3927685995',
    'ca-app-pub-4045089359333252/3927685995',
    'ca-app-pub-4045089359333252/9100121622',
    'ca-app-pub-3940256099942544/1033173712', // Google Official Test Interstitial
  ],

  // Official Test Ad Unit for guaranteed test delivery
  TEST_INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-3940256099942544/1033173712',

  // Minimum interval between ads to prevent visual spam
  MIN_AD_INTERVAL_MS: 4000,
};

let isInitialized = false;
let isInterstitialShowing = false;
let lastAdTimestamp = 0;

/**
 * Checks if AdMob is running in native Capacitor environment
 */
export function isNativeAdMobAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(Capacitor.isNativePlatform());
}

/**
 * Check if cooldown window has passed
 */
export function canShowAd(): { allowed: boolean; reason?: string } {
  if (isInterstitialShowing) {
    return { allowed: false, reason: 'Interstitial is already showing' };
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
 * Initializes AdMob SDK on startup safely.
 */
export async function initializeAdMob(): Promise<void> {
  if (isInitialized) {
    return;
  }

  logger.setAdMobPhase('INITIALIZING');

  try {
    if (isNativeAdMobAvailable()) {
      logger.admob('Native platform detected. Initializing Google AdMob SDK with test device support...');
      await AdMob.initialize({
        initializeForTesting: true,
      }).catch((initErr: any) => {
        logger.admob(`AdMob.initialize notice: ${initErr?.message || initErr}`, initErr, 'warn');
      });

      isInitialized = true;
      logger.setAdMobPhase('IDLE', { status: 'Native AdMob Initialized' });
      logger.admob('✅ AdMob Native SDK initialized successfully.');
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
 * Displays the Interstitial Ad right after finishing the 'Play' game.
 * Completely encapsulated and crash-proof.
 */
export async function showPlayGameOverAd(forceTesting = true): Promise<boolean> {
  logger.admob('🎮 Play Game Over ad triggered');

  const check = canShowAd();
  if (!check.allowed) {
    logger.admob(`Play ad skipped: ${check.reason}`);
    return false;
  }

  if (!isNativeAdMobAvailable()) {
    logger.admob('Play ad: Web simulation mode (non-native).');
    lastAdTimestamp = Date.now();
    return true;
  }

  logger.setAdMobPhase('PREPARING_PLAY_INTERSTITIAL');
  isInterstitialShowing = true;

  return new Promise<boolean>((resolve) => {
    let resolved = false;
    let dismissedListener: any = null;
    let failedListener: any = null;
    let safetyTimer: any = null;

    const cleanup = (reason: string) => {
      if (resolved) return;
      resolved = true;

      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }

      isInterstitialShowing = false;
      lastAdTimestamp = Date.now();
      logger.setAdMobPhase('IDLE', { cleanupReason: reason });
      logger.admob(`Play ad cleanup: ${reason}`);

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
    };

    // 7-second safety timeout guard to ensure user is never blocked
    safetyTimer = setTimeout(() => {
      logger.admob('Play ad safety timeout triggered', null, 'warn');
      cleanup('SAFETY_TIMEOUT_GUARD');
      resolve(false);
    }, 7000);

    (async () => {
      try {
        dismissedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.Dismissed,
          () => {
            logger.admob('🎯 Interstitial dismissed by user.');
            cleanup('DISMISSED');
            resolve(true);
          }
        ).catch(() => null);

        failedListener = await AdMob.addListener(
          InterstitialAdPluginEvents.FailedToShow,
          (err) => {
            logger.admob('❌ Interstitial failed to show', err, 'warn');
            cleanup('FAILED_TO_SHOW');
            resolve(false);
          }
        ).catch(() => null);

        // Try preparing the requested Ad Unit ID
        let prepared = false;
        const candidates = ADMOB_CONFIG.CANDIDATE_AD_UNITS;

        for (const adId of candidates) {
          try {
            logger.setAdMobPhase('PREPARING_AD_UNIT', { adId });
            await AdMob.prepareInterstitial({
              adId,
              isTesting: forceTesting,
            });
            logger.admob(`✅ Ad unit prepared: ${adId}`);
            prepared = true;
            break;
          } catch (prepErr: any) {
            logger.admob(`Ad unit ${adId} prepare attempt failed: ${prepErr?.message || prepErr}`, null, 'warn');
          }
        }

        if (!prepared) {
          cleanup('ALL_AD_PREPARES_FAILED');
          resolve(false);
          return;
        }

        logger.setAdMobPhase('SHOWING_PLAY_INTERSTITIAL');
        await AdMob.showInterstitial().catch((showErr: any) => {
          logger.admob(`AdMob.showInterstitial rejected: ${showErr?.message || showErr}`, showErr, 'warn');
          throw showErr;
        });

        logger.admob('AdMob.showInterstitial() completed.');
      } catch (err: any) {
        logger.setAdMobPhase('ERROR', { error: err?.message || err });
        logger.admob(`Play ad show error: ${err?.message || err}`, err, 'warn');
        cleanup('ERROR_DURING_SHOW');
        resolve(false);
      }
    })().catch((asyncErr) => {
      logger.admob('Async wrapper catch in Play ad', asyncErr, 'warn');
      cleanup('UNHANDLED_ASYNC_WRAPPER');
      resolve(false);
    });
  });
}

/**
 * Standard alias for the play game over ad
 */
export async function showGoogleInterstitialAd(isTesting = true): Promise<boolean> {
  return showPlayGameOverAd(isTesting);
}

/**
 * General load and show interstitial helper (used for testing or other screens)
 */
export async function loadAndShowInterstitialAd(isTesting = true): Promise<boolean> {
  return showPlayGameOverAd(isTesting);
}

/**
 * Preload helper
 */
export async function preloadRewardVideoAd(_isTesting = true): Promise<void> {
  // Kept clean for later integration
}

/**
 * Rewarded Video Ad helper (currently direct reward for testing)
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
